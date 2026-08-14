# isenax-mcp

MCP server exposing Isenax diagrams as tools for AI agents: `list_diagrams`,
`get_diagram`, `create_diagram`, `update_diagram`, `delete_diagram`. Diagram
models are validated against the `isenax` package's zod schema before every
write, and reused for reading.

## Storage

- `ISENAX_STORAGE=fs` (default) reads/writes JSON files directly under
  `STORAGE_PATH` (default `~/.isenax/diagrams`).
- `ISENAX_STORAGE=rest` proxies to an `isenax-backend` instance via
  `ISENAX_BACKEND_URL` (e.g. `http://localhost:3001`). Setting
  `ISENAX_BACKEND_URL` without `ISENAX_STORAGE` implies `rest`.

## Transport

- No `MCP_HTTP_PORT` set: stdio (for Claude Desktop/Code `mcpServers` config).
- `MCP_HTTP_PORT=<port>` set: Streamable HTTP/SSE at `http://localhost:<port>/mcp`,
  for a shared/remote deployment (e.g. alongside `isenax-backend`).

```bash
npm run start --workspace=packages/isenax-mcp                    # stdio, local fs storage
MCP_HTTP_PORT=3100 ISENAX_BACKEND_URL=http://localhost:3001 \
  npm run start --workspace=packages/isenax-mcp                  # HTTP, backed by isenax-backend
```

## Embedded in isenax-backend

`isenax-backend` can host this server itself, at `/mcp`, instead of running
it as a separate process — this is what the app's Settings → MCP Server tab
toggles. Set `ENABLE_MCP=true` on the backend to allow it (off by default);
the runtime on/off switch and the per-session bearer token are then driven
by `POST /api/mcp/enable` / `/api/mcp/disable` (see `server.js`). It shares
the backend's own `STORAGE_PATH`/`ENABLE_SERVER_STORAGE`, not a separate
storage config.
