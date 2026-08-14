import { randomUUID } from 'crypto';
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { modelSchema, hydrateBuiltinIconUrls, stripBuiltinIconUrls } from 'isenax/standalone';
import { createStorage } from './storage.js';

// Compact, not pretty-printed: indentation is purely cosmetic for a human
// reader, and an AI agent parses either form identically — pretty-printing
// this diagram JSON measured ~57% pure whitespace overhead on every tool
// response for no benefit to the consumer.
const jsonResult = (data) => ({ content: [{ type: 'text', text: JSON.stringify(data) }] });
const errorResult = (message) => ({ content: [{ type: 'text', text: message }], isError: true });

// Built-in icons (aws/gcp/azure/kubernetes/isoflow packs) carry the same
// base64 SVG every time — an AI agent has no use for that pixel data, so
// strip it from what we hand back and restore it server-side from what an
// agent sends in (icon id only).
const stripIcons = (model) =>
  model && Array.isArray(model.icons) ? { ...model, icons: stripBuiltinIconUrls(model.icons) } : model;
const hydrateIcons = (model) =>
  model && Array.isArray(model.icons) ? { ...model, icons: hydrateBuiltinIconUrls(model.icons) } : model;

// So an agent can confirm what actually got saved without a separate
// get_diagram round trip.
const summarize = (id, model) => ({
  id,
  title: model.title,
  itemCount: model.items.length,
  views: model.views.map((view) => ({
    id: view.id,
    name: view.name,
    itemCount: view.items.length,
    connectorCount: view.connectors?.length ?? 0,
    rectangleCount: view.rectangles?.length ?? 0
  }))
});

export function createServer({ onActivity } = {}) {
  const storage = createStorage();
  const server = new McpServer({ name: 'isenax-mcp', version: '1.5.0' });

  server.registerTool(
    'list_diagrams',
    { description: 'List all stored Isenax diagrams (id, title, last modified, size).' },
    async () => jsonResult(await storage.list())
  );

  server.registerTool(
    'get_diagram',
    {
      description:
        'Fetch a full Isenax diagram model by id, as isenax Model JSON. Built-in icons (aws/gcp/azure/kubernetes/isoflow ' +
        "packs) come back as {id, name, collection} with no url — that's expected, not missing data.",
      inputSchema: { id: z.string() }
    },
    async ({ id }) => jsonResult(stripIcons(await storage.get(id)))
  );

  server.registerTool(
    'create_diagram',
    {
      description:
        'Create a new Isenax diagram from an isenax Model JSON object (title, items, views, icons, colors). ' +
        'The model is validated against the isenax schema before saving. For icons from a built-in pack ' +
        '(aws/gcp/azure/kubernetes/isoflow), an icons[] entry of just {id, name} is enough — no url/base64 needed, ' +
        'the server resolves it by id. A url is only required for a genuinely custom icon. ' +
        "To group related items into a labeled zone (e.g. \"DMZ\", \"internal network\"), add a view-level " +
        'rectangles[] entry ({id, color, from: {x,y}, to: {x,y}}) spanning their tiles — drawn behind the items. ' +
        'A connector can carry request/response-style annotations via its labels[] ' +
        '({id, text, position: 0-100 along the path}), not just a single description. ' +
        'Returns a summary (item/view/connector/rectangle counts), not the full model.',
      inputSchema: { id: z.string().optional(), model: z.any() }
    },
    async ({ id, model }) => {
      const diagramId = id || randomUUID();
      onActivity?.(diagramId);
      const parsed = modelSchema.safeParse(hydrateIcons(model));
      if (!parsed.success) return errorResult(`Invalid diagram model:\n${parsed.error.message}`);
      await storage.create(diagramId, parsed.data);
      return jsonResult(summarize(diagramId, parsed.data));
    }
  );

  server.registerTool(
    'update_diagram',
    {
      description:
        'Replace an existing Isenax diagram with a new Model JSON object (full replace, validated). Same ' +
        'zone-rectangle and connector-label support as create_diagram — see its description. Returns a summary ' +
        '(item/view/connector/rectangle counts), not the full model.',
      inputSchema: { id: z.string(), model: z.any() }
    },
    async ({ id, model }) => {
      onActivity?.(id);
      const parsed = modelSchema.safeParse(hydrateIcons(model));
      if (!parsed.success) return errorResult(`Invalid diagram model:\n${parsed.error.message}`);
      await storage.update(id, parsed.data);
      return jsonResult(summarize(id, parsed.data));
    }
  );

  server.registerTool(
    'update_diagram_patch',
    {
      description:
        'Partially update an existing diagram WITHOUT resending the full model — merge only the fields you ' +
        'actually changed, leaving everything else on the stored diagram untouched. Much cheaper in tokens than ' +
        "update_diagram for a small change (e.g. \"just fix these connectors\"). patch shape: " +
        '{title?, description?, icons?, colors?, items?} at the top level (each replaces that whole field if ' +
        'given), plus views?: [{id, name?, items?, connectors?, rectangles?, textBoxes?}] — for a view matching ' +
        'an existing view id, only the fields you include in that view patch are replaced (whole-field, not ' +
        'per-item merge); views you omit, and fields within a matched view you omit, are left exactly as stored. ' +
        'Same icon/rectangle/label support as update_diagram. Returns the same summary shape.',
      inputSchema: { id: z.string(), patch: z.any() }
    },
    async ({ id, patch }) => {
      onActivity?.(id);
      const current = await storage.get(id);

      const merged = { ...current };
      ['title', 'description', 'icons', 'colors', 'items'].forEach((field) => {
        if (patch[field] !== undefined) merged[field] = patch[field];
      });

      if (patch.views !== undefined) {
        merged.views = current.views.map((view) => {
          const viewPatch = patch.views.find((v) => v.id === view.id);
          if (!viewPatch) return view;
          const updatedView = { ...view };
          ['name', 'items', 'connectors', 'rectangles', 'textBoxes'].forEach((field) => {
            if (viewPatch[field] !== undefined) updatedView[field] = viewPatch[field];
          });
          return updatedView;
        });
      }

      const parsed = modelSchema.safeParse(hydrateIcons(merged));
      if (!parsed.success) return errorResult(`Invalid diagram model after patch:\n${parsed.error.message}`);
      await storage.update(id, parsed.data);
      return jsonResult(summarize(id, parsed.data));
    }
  );

  server.registerTool(
    'delete_diagram',
    { description: 'Delete an Isenax diagram by id.', inputSchema: { id: z.string() } },
    async ({ id }) => {
      onActivity?.(id);
      await storage.delete(id);
      return jsonResult({ id, deleted: true });
    }
  );

  return server;
}
