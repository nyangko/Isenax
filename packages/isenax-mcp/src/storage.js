import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const SAFE_ID = /^[a-zA-Z0-9._-]+$/;

function fsAdapter(storagePath) {
  function requireSafePath(id) {
    if (!SAFE_ID.test(id)) throw new Error(`Invalid diagram id: ${id}`);
    const resolved = path.resolve(storagePath, `${id}.json`);
    if (!resolved.startsWith(storagePath + path.sep) && resolved !== storagePath) {
      throw new Error(`Invalid diagram id: ${id}`);
    }
    return resolved;
  }

  async function ensureDir() {
    await fs.mkdir(storagePath, { recursive: true });
  }

  return {
    async list() {
      await ensureDir();
      const files = await fs.readdir(storagePath);
      const diagrams = [];
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        const id = file.replace('.json', '');
        let filePath;
        try {
          filePath = requireSafePath(id);
        } catch {
          continue;
        }
        const stats = await fs.stat(filePath);
        const content = JSON.parse(await fs.readFile(filePath, 'utf-8'));
        diagrams.push({ id, name: content.title || 'Untitled', lastModified: stats.mtime, size: stats.size });
      }
      return diagrams;
    },

    async get(id) {
      const filePath = requireSafePath(id);
      try {
        return JSON.parse(await fs.readFile(filePath, 'utf-8'));
      } catch (error) {
        if (error.code === 'ENOENT') throw new Error(`Diagram not found: ${id}`);
        throw error;
      }
    },

    async create(id, model) {
      await ensureDir();
      const filePath = requireSafePath(id);
      try {
        await fs.writeFile(filePath, JSON.stringify(model, null, 2), { flag: 'wx' });
      } catch (error) {
        if (error.code === 'EEXIST') throw new Error(`Diagram already exists: ${id}`);
        throw error;
      }
      return { id };
    },

    async update(id, model) {
      const filePath = requireSafePath(id);
      await fs.writeFile(filePath, JSON.stringify(model, null, 2));
      return { id };
    },

    async delete(id) {
      const filePath = requireSafePath(id);
      await fs.unlink(filePath);
    }
  };
}

function restAdapter(backendUrl) {
  async function call(pathname, options) {
    const res = await fetch(`${backendUrl}${pathname}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options?.headers }
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Backend request failed: ${res.status}`);
    }
    return res.json();
  }

  return {
    list: () => call('/api/diagrams'),
    get: (id) => call(`/api/diagrams/${encodeURIComponent(id)}`),
    create: (id, model) => call('/api/diagrams', { method: 'POST', body: JSON.stringify({ ...model, id }) }),
    update: (id, model) => call(`/api/diagrams/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(model) }),
    delete: (id) => call(`/api/diagrams/${encodeURIComponent(id)}`, { method: 'DELETE' })
  };
}

export function createStorage() {
  const backendUrl = process.env.ISENAX_BACKEND_URL;
  const mode = process.env.ISENAX_STORAGE || (backendUrl ? 'rest' : 'fs');

  if (mode === 'rest') {
    if (!backendUrl) throw new Error('ISENAX_STORAGE=rest requires ISENAX_BACKEND_URL to be set');
    return restAdapter(backendUrl.replace(/\/$/, ''));
  }

  const storagePath = path.resolve(process.env.STORAGE_PATH || path.join(os.homedir(), '.isenax', 'diagrams'));
  return fsAdapter(storagePath);
}
