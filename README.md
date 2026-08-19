<div align="center">

<img src="assets/banner.png" alt="Isenax - Open-source isometric diagram tool" width="100%" />

</div>



<p align="center">
 <a href="README.md">English</a> | <a href="docs/README.cn.md">简体中文</a> | <a href="docs/README.es.md">Español</a> | <a href="docs/README.pt.md">Português</a> | <a href="docs/README.fr.md">Français</a> | <a href="docs/README.hi.md">हिन्दी</a> | <a href="docs/README.bn.md">বাংলা</a> | <a href="docs/README.ru.md">Русский</a> | <a href="docs/README.id.md">Bahasa Indonesia</a> | <a href="docs/README.de.md">Deutsch</a> | <a href="docs/README.ko.md">한국어</a> | <a href="docs/README.ja.md">日本語</a> | <a href="docs/README.it.md">Italiano</a> | <a href="docs/README.pl.md">Polski</a> | <a href="docs/README.tr.md">Türkçe</a>
</p>

## Note:
This repo (Isenax) is a derivative of [Abrar74774/FossFLOW](https://github.com/Abrar74774/FossFLOW), which is itself a fork of stan-smith/FossFLOW (which in turn was a fork of [markmanx/isoflow](https://github.com/markmanx/isoflow)) originally made for the purpose of contributing to the original repo through PRs, however the username of the author seems to have been changed to [mug-book-droid](https://github.com/mug-book-droid) and their activity set to private (account suspended maybe?), making the original repo inaccessible.

For now, I intend to make this repo (now named Isenax) a continuation of development from FossFLOW, and any contributions through PRs are welcome as well. 

You can check out the last state of the original repo that I fetched on `backup/stan-smith-FossFLOW` branch.

---

Isenax is a powerful, open-source Progressive Web App (PWA) for creating beautiful isometric diagrams. Built with React and the <a href="https://github.com/markmanx/isoflow">Isoflow</a> (forked and published to NPM as fossflow, then flowvia, and now as isenax in this fork) library, it runs entirely in your browser with offline support.

---
<p align="center">
<b>Try it online --> https://nyangko.github.io/Isenax/ <-- </b>
</p>
 
<img width="100%" alt="Isenax-Isometric-Diagramming-Tool" src="https://github.com/user-attachments/assets/15956888-991a-4b5e-9849-dbd82d6f9308" />

---------

## 🐳 Quick Deploy with Docker

```bash
# Using Docker Compose (recommended - includes persistent storage)
docker compose up

# Or run directly from Docker Hub with persistent storage
docker run -p 80:80 -v $(pwd)/diagrams:/data/diagrams nyangko/isenax:latest
```

Server storage is enabled by default in Docker. Your diagrams will be saved (as root by default) to `./diagrams` on the host. To change user or group id for saving as, set the `PUID` and `PGID` env variables.

To disable server storage, set `ENABLE_SERVER_STORAGE=false`:
```bash
docker run -p 80:80 -e ENABLE_SERVER_STORAGE=false nyangko/isenax:latest
```

### HTTP Basic Authentication (Optional)

Protect your Isenax instance with HTTP Basic Auth:

```bash
# With Docker Compose
HTTP_AUTH_USER=admin HTTP_AUTH_PASSWORD=secret docker compose up

# Or with docker run
docker run -p 80:80 \
  -e HTTP_AUTH_USER=admin \
  -e HTTP_AUTH_PASSWORD=secret \
  nyangko/isenax:latest
```

> **Note**: Both variables must be set to enable authentication. If either is empty, the app is accessible without login.

## Quick Start (Local Development)

```bash
# Clone the repository
git clone https://github.com/nyangko/Isenax
cd Isenax

# Install dependencies
npm install

# Build the library (required first time)
npm run build:lib

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Monorepo Structure

This is a monorepo containing four packages:

- `packages/isenax-lib` - React component library for drawing network diagrams (built with Rslib/Rspack)
- `packages/isenax-app` - Progressive Web App which wraps the lib and presents it (built with RSBuild)
- `packages/isenax-backend` - Express server providing optional self-hosted storage for diagrams (used in the Docker deployment)
- `packages/isenax-mcp` - MCP (Model Context Protocol) server letting an external AI agent read, create and edit your diagrams directly (stdio or Streamable HTTP)

### Development Commands

```bash
# Development
npm run dev          # Start app development server
npm run dev:lib      # Watch mode for library development

# Building
npm run build        # Build both library and app
npm run build:lib    # Build library only
npm run build:app    # Build app only

# Testing & Linting
npm test             # Run unit tests
npm run lint         # Check for linting errors

# E2E Tests (Selenium)
cd e2e-tests
./run-tests.sh       # Run end-to-end tests (requires Docker & Python)

# Publishing
npm run publish:lib  # Publish library to npm
```

## How to Use

### Creating Diagrams

1. **Add Items**:
   - Press the "+" button on the top right menu, the library of components will appear on the left
   - Drag and drop components from the library onto the canvas
   - Or right-click on the grid and select "Add node"

2. **Connect Items**: 
   - Select the Connector tool (press 'C' or click connector icon)
   - **Click mode** (default): Click first node, then click second node
   - **Drag mode** (optional): Click and drag from first to second node
   - Switch modes in Settings → Connectors tab

3. **Save Your Work**:
   - **Quick Save** - Saves to browser session
   - **Export** - Download as JSON file
   - **Import** - Load from JSON file

4. **Organize with the Layers Panel**:
   - Open Layers from the toolbar to see every node, connector, area and text box in one list
   - Select an item there to edit it in the panel's Edit tab
   - On narrow screens it opens as a bottom sheet from the button at the bottom-right of the canvas

### Storage Options

- **Session Storage**: Temporary saves cleared when browser closes
- **Export/Import**: Permanent storage as JSON files
- **Auto-Save**: Automatically saves changes every 5 seconds to session

### MCP Integration (AI Agents)

Isenax ships an MCP server so an external AI agent (Claude, etc.) can read, create and edit your diagrams directly:

1. Open **Settings → MCP** and toggle it on — a connection URL and Bearer token are shown.
2. Point your MCP client at that URL/token (`packages/isenax-mcp` supports both stdio and Streamable HTTP transports).
3. Edits the agent makes appear live in any open tab showing that diagram, no refresh needed — a "MCP is writing..." indicator shows while it's working.

Built-in icons round-trip by id only (no base64 sent to the agent), and `update_diagram_patch` lets an agent change just the fields it touched instead of resending the whole model.

## Recently added

### Redesigned Settings
A searchable (⌘K), two-pane settings dialog replaces the old tab strip — grouped into Shortcuts/Pan/Zoom, Display, Icon Packs and Extensions, with Cancel/Save semantics and a "Reset to defaults" button per section.

### Layers panel
Search and type filters (All/Nodes/Connectors/Areas/Text), nodes nested under the area they sit inside, per-item show/lock toggles, and the panel now docks flush to the screen edge with a configurable toolbar position.

### Node edit panel
Redesigned summary card with a larger icon, selection badge, zone/connection/type chips, a Label Display mode (Always/On Hover/Hidden), and a Connection Summary that jumps the canvas to a connected node when clicked.

### MCP tool integration
The Settings → MCP panel now lists the tools ( list/get/create/update/patch/delete diagram) a connected AI agent can call.

### Icon pack brand logos
AWS, GCP, Azure and Kubernetes icon packs show their real brand logo in Settings instead of a generic initial badge.

### Connectors multiplexing
<img src="demos/connectors.gif" alt="Multiplexed connectors demo" />

### Copy Pasting items
<img src="demos/copy-paste-demo.gif" alt="Copy pasting demo" />


## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Documentation

- [ISENAX_ENCYCLOPEDIA.md](docs/ISENAX_ENCYCLOPEDIA.md) - Comprehensive guide to the codebase
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contributing guidelines

## License

MIT
