#!/usr/bin/env node
import express from 'express';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';
import { createMcpRouter } from './httpHandler.js';

const httpPort = process.env.MCP_HTTP_PORT;

if (httpPort) {
  const app = express();
  app.use('/mcp', createMcpRouter({ getToken: () => process.env.MCP_TOKEN }));

  app.listen(httpPort, () => {
    console.log(`isenax-mcp listening on http://localhost:${httpPort}/mcp`);
  });
} else {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
