require('@testing-library/jest-dom');

// jsdom doesn't implement these — Node's own (used by src/utils/compression.ts).
const { TextEncoder, TextDecoder } = require('util');
if (typeof global.TextEncoder === 'undefined') global.TextEncoder = TextEncoder;
if (typeof global.TextDecoder === 'undefined') global.TextDecoder = TextDecoder;

const streamWeb = require('stream/web');
if (typeof global.ReadableStream === 'undefined') global.ReadableStream = streamWeb.ReadableStream;
if (typeof global.WritableStream === 'undefined') global.WritableStream = streamWeb.WritableStream;
if (typeof global.TransformStream === 'undefined') global.TransformStream = streamWeb.TransformStream;
if (typeof global.CompressionStream === 'undefined') global.CompressionStream = streamWeb.CompressionStream;
if (typeof global.DecompressionStream === 'undefined') global.DecompressionStream = streamWeb.DecompressionStream;

// jsdom's own Blob is missing arrayBuffer()/stream() entirely — swap in
// Node's full one.
global.Blob = require('buffer').Blob;
