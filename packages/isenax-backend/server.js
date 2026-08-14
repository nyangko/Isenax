import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import { watch } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomBytes } from 'crypto';
import rateLimit from 'express-rate-limit';
import { createMcpRouter } from 'isenax-mcp/http-handler';

try {
  process.loadEnvFile();
} catch {
  // No .env file present — fine, env vars may come from the environment directly.
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;
const HOST = process.env.BACKEND_HOST || '0.0.0.0';

const STORAGE_ENABLED = process.env.ENABLE_SERVER_STORAGE === 'true';
const STORAGE_PATH = path.resolve(process.env.STORAGE_PATH || '/data/diagrams');
const ENABLE_GIT_BACKUP = process.env.ENABLE_GIT_BACKUP === 'true';

const SAFE_ID = /^[a-zA-Z0-9._-]+$/;

function safeDiagramPath(id) {
  if (!SAFE_ID.test(id)) return null;
  const resolved = path.resolve(STORAGE_PATH, `${id}.json`);
  if (!resolved.startsWith(STORAGE_PATH + path.sep) && resolved !== STORAGE_PATH) return null;
  return resolved;
}

const readLimiter = rateLimit({ windowMs: 60_000, max: 200, standardHeaders: true, legacyHeaders: false });
const writeLimiter = rateLimit({ windowMs: 60_000, max: 50, standardHeaders: true, legacyHeaders: false });

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// MCP: opt in at the process level (ENABLE_MCP), then toggled at runtime from
// the app's Settings screen. isenax-mcp reads diagrams via the same
// STORAGE_PATH/STORAGE_ENABLED this server uses — no separate storage wiring.
const MCP_ENABLED_AT_ALL = process.env.ENABLE_MCP === 'true';
let mcpRuntimeEnabled = false;
let mcpToken = null;

app.get('/api/mcp/status', readLimiter, (req, res) => {
  // Anyone who can reach this can already mint a token via /enable below —
  // handing back the current one on status too isn't a new exposure, and
  // avoids losing it (and thus silently invalidating whatever a user
  // already pasted into an MCP client's config) on every page refresh.
  res.json({
    available: MCP_ENABLED_AT_ALL,
    enabled: mcpRuntimeEnabled,
    url: mcpRuntimeEnabled ? '/mcp' : null,
    token: mcpRuntimeEnabled ? mcpToken : null
  });
});

app.post('/api/mcp/enable', writeLimiter, (req, res) => {
  if (!MCP_ENABLED_AT_ALL) {
    return res.status(503).json({ error: 'MCP is disabled for this deployment (set ENABLE_MCP=true)' });
  }
  // Idempotent: re-enabling an already-enabled server reuses its token
  // instead of rotating it out from under anyone already using it.
  if (!mcpRuntimeEnabled) {
    mcpToken = randomBytes(24).toString('hex');
    mcpRuntimeEnabled = true;
  }
  res.json({ enabled: true, url: '/mcp', token: mcpToken });
});

app.post('/api/mcp/disable', writeLimiter, (req, res) => {
  mcpRuntimeEnabled = false;
  mcpToken = null;
  res.json({ enabled: false });
});

app.use(
  '/mcp',
  (req, res, next) => {
    if (!mcpRuntimeEnabled) return res.status(503).json({ error: 'MCP is disabled' });
    next();
  },
  createMcpRouter({ getToken: () => mcpToken, onActivity: broadcastMcpActivity })
);

// Health check / Storage status endpoint
app.get('/api/storage/status', (req, res) => {
  res.json({
    enabled: STORAGE_ENABLED,
    gitBackup: ENABLE_GIT_BACKUP,
    version: '1.0.0'
  });
});

// Reject all diagram storage requests up front when storage is disabled,
// instead of duplicating every route below for the disabled case.
app.use('/api/diagrams', (req, res, next) => {
  if (!STORAGE_ENABLED) {
    return res.status(503).json({ error: 'Server storage is disabled' });
  }
  next();
});

if (STORAGE_ENABLED) {
  // Ensure storage directory exists
  async function ensureStorageDir() {
    try {
      await fs.access(STORAGE_PATH);
      console.log(`Storage directory exists: ${STORAGE_PATH}`);

      // Log current files
      const files = await fs.readdir(STORAGE_PATH);
      console.log(`Current files in storage: ${files.length} files`);
      if (files.length > 0) {
        console.log('Files:', files.join(', '));
      }
    } catch {
      console.log(`Creating storage directory: ${STORAGE_PATH}`);
      await fs.mkdir(STORAGE_PATH, { recursive: true });
      console.log(`Created storage directory: ${STORAGE_PATH}`);
    }
  }

  // Initialize storage
  ensureStorageDir().catch((err) => {
    console.error('Failed to initialize storage:', err);
  });
}

// Live sync: any writer to STORAGE_PATH — this server's own PUT/POST/DELETE
// routes, or isenax-mcp writing straight to the filesystem when embedded
// (bypasses those routes entirely) — ends up as a change to a file here.
// Watching the directory itself, instead of hooking each write call site,
// is what lets one broadcaster cover every current and future writer.
const sseClients = new Set();
const debouncedIds = new Map();

function broadcastDiagramChanged(id) {
  clearTimeout(debouncedIds.get(id));
  debouncedIds.set(
    id,
    setTimeout(() => {
      debouncedIds.delete(id);
      const payload = `data: ${JSON.stringify({ type: 'changed', id })}\n\n`;
      sseClients.forEach((res) => res.write(payload));
    }, 150)
  );
}

// Fired the instant an MCP tool call starts (before validation/write), so
// the UI can show "MCP is writing..." immediately instead of waiting for
// the debounced filesystem-change broadcast above once it's already done.
function broadcastMcpActivity(id) {
  const payload = `data: ${JSON.stringify({ type: 'start', id: id || null })}\n\n`;
  sseClients.forEach((res) => res.write(payload));
}

if (STORAGE_ENABLED) {
  watch(STORAGE_PATH, (eventType, filename) => {
    if (!filename || !filename.endsWith('.json') || filename === 'metadata.json') return;
    broadcastDiagramChanged(filename.replace(/\.json$/, ''));
  });
}

app.get('/api/diagrams/stream', (req, res) => {
  if (!STORAGE_ENABLED) {
    return res.status(503).json({ error: 'Server storage is disabled' });
  }
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  });
  res.write(': connected\n\n');
  sseClients.add(res);
  req.on('close', () => sseClients.delete(res));
});

app.get('/api/diagrams', readLimiter, async (req, res) => {
  try {
    try {
      await fs.access(STORAGE_PATH);
    } catch {
      return res.json([]);
    }

    const files = await fs.readdir(STORAGE_PATH);
    const diagrams = [];

    for (const file of files) {
      if (file.endsWith('.json') && file !== 'metadata.json') {
        const diagramId = file.replace('.json', '');
        const filePath = safeDiagramPath(diagramId);
        if (!filePath) continue;
        try {
          const stats = await fs.stat(filePath);
          const content = await fs.readFile(filePath, 'utf-8');
          const data = JSON.parse(content);
          const name = data.name || data.title || 'Untitled Diagram';
          diagrams.push({
            id: diagramId,
            name: name,
            lastModified: stats.mtime,
            size: stats.size
          });
        } catch {
          continue;
        }
      }
    }

    res.json(diagrams);
  } catch (error) {
    console.error('Error listing diagrams:', error);
    res.status(500).json({ error: 'Failed to list diagrams' });
  }
});

app.get('/api/diagrams/:id', readLimiter, async (req, res) => {
  const diagramId = req.params.id;
  const filePath = safeDiagramPath(diagramId);
  if (!filePath) {
    return res.status(400).json({ error: 'Invalid diagram ID' });
  }

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    res.json(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.status(404).json({ error: 'Diagram not found' });
    } else {
      console.error('Error reading diagram: %s', error.message);
      res.status(500).json({ error: 'Failed to read diagram' });
    }
  }
});

app.put('/api/diagrams/:id', writeLimiter, async (req, res) => {
  const diagramId = req.params.id;
  const filePath = safeDiagramPath(diagramId);
  if (!filePath) {
    return res.status(400).json({ error: 'Invalid diagram ID' });
  }

  try {
    const data = {
      ...req.body,
      id: diagramId,
      lastModified: new Date().toISOString()
    };

    await fs.writeFile(filePath, JSON.stringify(data, null, 2));

    if (ENABLE_GIT_BACKUP) {
      console.log('[PUT] Git backup not yet implemented');
    }

    res.json({ success: true, id: diagramId });
  } catch (error) {
    console.error('Error saving diagram: %s', error.message);
    res.status(500).json({ error: 'Failed to save diagram' });
  }
});

app.delete('/api/diagrams/:id', writeLimiter, async (req, res) => {
  const filePath = safeDiagramPath(req.params.id);
  if (!filePath) {
    return res.status(400).json({ error: 'Invalid diagram ID' });
  }

  try {
    await fs.unlink(filePath);
    res.json({ success: true });
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.status(404).json({ error: 'Diagram not found' });
    } else {
      console.error('Error deleting diagram: %s', error.message);
      res.status(500).json({ error: 'Failed to delete diagram' });
    }
  }
});

app.post('/api/diagrams', writeLimiter, async (req, res) => {
  try {
    const rawId = req.body.id || `diagram_${Date.now()}`;
    const filePath = safeDiagramPath(rawId);
    if (!filePath) {
      return res.status(400).json({ error: 'Invalid diagram ID' });
    }
    const id = rawId;

    try {
      await fs.access(filePath);
      return res.status(409).json({ error: 'Diagram already exists' });
    } catch {
      // File doesn't exist, proceed
    }

    const data = {
      ...req.body,
      id,
      created: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    res.status(201).json({ success: true, id });
  } catch (error) {
    console.error('Error creating diagram: %s', error.message);
    res.status(500).json({ error: 'Failed to create diagram' });
  }
});

// Start server
app.listen(PORT, HOST, () => {
  console.log(`Isenax Backend Server running on ${HOST}:${PORT}`);
  console.log(`Server storage: ${STORAGE_ENABLED ? 'ENABLED' : 'DISABLED'}`);
  if (STORAGE_ENABLED) {
    console.log(`Storage path: ${STORAGE_PATH}`);
    console.log(`Git backup: ${ENABLE_GIT_BACKUP ? 'ENABLED' : 'DISABLED'}`);
  }
});