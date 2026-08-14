import express from 'express';
import { randomUUID } from 'crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { createServer } from './server.js';

// Streamable HTTP/SSE transport as an Express router, so it can be run
// standalone (src/index.js) or mounted inside another app (isenax-backend).
export function createMcpRouter({ getToken, onActivity } = {}) {
  const router = express.Router();
  const transports = new Map();

  router.use(express.json());

  router.post('/', async (req, res) => {
    const token = getToken?.();
    if (token && req.headers.authorization !== `Bearer ${token}`) {
      res.status(401).json({ jsonrpc: '2.0', error: { code: -32001, message: 'Unauthorized' }, id: null });
      return;
    }

    const sessionId = req.headers['mcp-session-id'];
    let transport = sessionId ? transports.get(sessionId) : undefined;

    if (!transport) {
      if (!isInitializeRequest(req.body)) {
        res.status(400).json({ jsonrpc: '2.0', error: { code: -32000, message: 'Bad Request: no session, expected an initialize request' }, id: null });
        return;
      }
      const server = createServer({ onActivity });
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (id) => transports.set(id, transport)
      });
      transport.onclose = () => {
        if (transport.sessionId) transports.delete(transport.sessionId);
      };
      await server.connect(transport);
    }

    await transport.handleRequest(req, res, req.body);
  });

  return router;
}
