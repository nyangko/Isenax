import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createServer } from './src/server.js';

const storagePath = await fs.mkdtemp(path.join(os.tmpdir(), 'isenax-mcp-test-'));
process.env.ISENAX_STORAGE = 'fs';
process.env.STORAGE_PATH = storagePath;

const activity = [];
const server = createServer({ onActivity: (id) => activity.push(id) });
const tool = (name) => server._registeredTools[name].handler;

const model = {
  title: 'Self Check',
  items: [{ id: 'a', name: 'Server' }],
  views: [{ id: 'v1', name: 'Main', items: [{ id: 'a', tile: { x: 0, y: 0 } }], connectors: [], rectangles: [], textBoxes: [] }],
  icons: [],
  colors: [{ id: 'c1', value: '#a5b8f3' }]
};

const invalidModel = { title: 'x' };

const rejected = await tool('create_diagram')({ id: 'bad', model: invalidModel }, {});
assert.equal(rejected.isError, true, 'invalid model should be rejected');

const created = await tool('create_diagram')({ id: 'ok', model }, {});
assert.equal(created.isError, undefined, 'valid model should be created');
const createdSummary = JSON.parse(created.content[0].text);
assert.equal(createdSummary.id, 'ok');
assert.equal(createdSummary.itemCount, 1, 'create_diagram should return a summary, not the full model');
assert.equal(createdSummary.views[0].itemCount, 1);
assert.deepEqual(activity, ['bad', 'ok'], 'onActivity should fire before each write attempt, valid or not');

const listed = await tool('list_diagrams')({}, {});
assert.ok(JSON.parse(listed.content[0].text).some((d) => d.id === 'ok'), 'created diagram should be listed');

const fetched = await tool('get_diagram')({ id: 'ok' }, {});
assert.equal(JSON.parse(fetched.content[0].text).title, 'Self Check', 'get_diagram should return the saved model');

const deleted = await tool('delete_diagram')({ id: 'ok' }, {});
assert.equal(deleted.isError, undefined, 'delete should succeed');

await assert.rejects(() => tool('get_diagram')({ id: 'ok' }, {}), 'deleted diagram should no longer be found');

// Built-in icon: id-only in, id-only (no base64 url) out.
const modelWithBuiltinIcon = {
  ...model,
  items: [{ id: 'a', name: 'Server', icon: 'storage' }],
  icons: [{ id: 'storage', name: 'Storage' }]
};

const iconCreated = await tool('create_diagram')({ id: 'with-icon', model: modelWithBuiltinIcon }, {});
assert.equal(iconCreated.isError, undefined, 'model with id-only builtin icon should validate (server hydrates the url)');

const iconFetched = await tool('get_diagram')({ id: 'with-icon' }, {});
const iconModel = JSON.parse(iconFetched.content[0].text);
assert.equal(iconModel.icons[0].url, undefined, 'get_diagram should strip the builtin icon url back out');
assert.equal(iconModel.icons[0].id, 'storage', 'icon id should survive the round trip');

await tool('delete_diagram')({ id: 'with-icon' }, {});

// update_diagram_patch: only the given fields change, everything else —
// including fields *within* a matched view that weren't mentioned — is
// left exactly as stored.
const patchBase = {
  title: 'Patch Base',
  description: 'original description',
  items: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }],
  views: [{
    id: 'v1', name: 'Main',
    items: [{ id: 'a', tile: { x: 0, y: 0 } }, { id: 'b', tile: { x: 2, y: 0 } }],
    connectors: [],
    rectangles: [{ id: 'r1', customColor: 'rgba(0,0,0,0.1)', from: { x: -1, y: -1 }, to: { x: 3, y: 1 } }],
    textBoxes: []
  }],
  icons: [],
  colors: [{ id: 'c1', value: '#a5b8f3' }]
};
await tool('create_diagram')({ id: 'patch-test', model: patchBase }, {});

const patched = await tool('update_diagram_patch')({
  id: 'patch-test',
  patch: {
    // title omitted — must survive untouched
    views: [{
      id: 'v1',
      connectors: [{
        id: 'conn1', color: 'c1', width: 10, style: 'SOLID',
        anchors: [{ id: 'a1', ref: { item: 'a' } }, { id: 'a2', ref: { item: 'b' } }]
      }]
      // items/rectangles/textBoxes omitted — must survive untouched
    }]
  }
}, {});
assert.equal(patched.isError, undefined, 'patch should apply cleanly');

const afterPatch = JSON.parse((await tool('get_diagram')({ id: 'patch-test' }, {})).content[0].text);
assert.equal(afterPatch.title, 'Patch Base', 'unpatched top-level field should be untouched');
assert.equal(afterPatch.description, 'original description', 'unpatched description should be untouched');
assert.equal(afterPatch.views[0].connectors.length, 1, 'patched field should apply');
assert.equal(afterPatch.views[0].items.length, 2, 'unpatched view field (items) should be untouched');
assert.equal(afterPatch.views[0].rectangles.length, 1, 'unpatched view field (rectangles) should be untouched');

const badPatch = await tool('update_diagram_patch')({
  id: 'patch-test',
  patch: { views: [{ id: 'v1', connectors: [{ id: 'bad-conn', anchors: [{ id: 'a1', ref: { item: 'does-not-exist' } }] }] }] }
}, {});
assert.equal(badPatch.isError, true, 'a patch producing an invalid model should still be rejected');

await tool('delete_diagram')({ id: 'patch-test' }, {});

await fs.rm(storagePath, { recursive: true, force: true });
console.log('isenax-mcp self-check passed');
