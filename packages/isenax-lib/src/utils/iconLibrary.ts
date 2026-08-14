// Pure data — no React/DOM imports — so this is safe to pull into the
// Node-safe standalone bundle (isenax-mcp) as well as the browser bundle.
// Deliberately independent of examples/initialData.ts, which imports
// src/Isoflow (a real component) for types and isn't safe outside a bundler
// that tree-shakes type-only imports.
import { flattenCollections } from '@isoflow/isopacks/dist/utils';
import isoflowIsopack from '@isoflow/isopacks/dist/isoflow';
import awsIsopack from '@isoflow/isopacks/dist/aws';
import gcpIsopack from '@isoflow/isopacks/dist/gcp';
import azureIsopack from '@isoflow/isopacks/dist/azure';
import kubernetesIsopack from '@isoflow/isopacks/dist/kubernetes';

const BUILTIN_ICONS = flattenCollections([
  isoflowIsopack,
  awsIsopack,
  gcpIsopack,
  azureIsopack,
  kubernetesIsopack
]);

const builtinIconsById = new Map(BUILTIN_ICONS.map((icon) => [icon.id, icon]));

export const getBuiltinIcon = (id: string) => builtinIconsById.get(id);

// Export encoding: built-in icons need only their id to be reconstructed, so
// export/MCP payloads can drop the (often large, always-identical) base64
// `url` for any icon that matches the bundled packs by id.
export const stripBuiltinIconUrls = <T extends { id: string; url?: string }>(
  icons: T[]
): T[] =>
  icons.map((icon) =>
    getBuiltinIcon(icon.id) ? ({ ...icon, url: undefined } as T) : icon
  );

// Import decoding: fill back in any icon missing a `url` (our own exports,
// or hand-authored/AI-authored models that only reference an icon by id)
// from the bundled packs. Icons that already have a url (custom uploads,
// older exports) or that don't match any known id pass through unchanged —
// an unresolvable missing url is left as-is for modelSchema to reject.
export const hydrateBuiltinIconUrls = <T extends { id: string; url?: string }>(
  icons: T[]
): T[] =>
  icons.map((icon) => (icon.url ? icon : { ...icon, url: getBuiltinIcon(icon.id)?.url ?? icon.url }));
