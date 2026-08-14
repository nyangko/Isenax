// Native CompressionStream/DecompressionStream (browser + Node 18+) — no
// dependency needed. gzip is opaque to a downstream LLM's context window, so
// this is for human-facing file export/import only, never MCP responses.
const GZIP_MAGIC = [0x1f, 0x8b];

// Blob.prototype.stream() isn't universally implemented (notably jsdom, our
// own test environment) — going through arrayBuffer() + a manually built
// ReadableStream sidesteps that instead of depending on it.
const bytesToStream = (bytes: Uint8Array): ReadableStream<Uint8Array> =>
  new ReadableStream({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    }
  });

// Draining via a reader (rather than wrapping in a Fetch API Response) keeps
// this to ReadableStream + Text(En|De)coder — no fetch/Response polyfill
// needed in environments (our own jsdom test env included) missing that.
const streamToBytes = async (stream: ReadableStream<Uint8Array>): Promise<Uint8Array> => {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    length += value.length;
  }

  const result = new Uint8Array(length);
  let offset = 0;
  chunks.forEach((chunk) => {
    result.set(chunk, offset);
    offset += chunk.length;
  });
  return result;
};

// @types/node's global CompressionStream/DecompressionStream declarations
// (BufferSource-based) don't line up with lib.dom's ReadableStream<Uint8Array>
// generic, so pipeThrough's types clash here even though both actually work
// at runtime — this cast target keeps the Uint8Array typing on the result
// instead of losing it repo-wide.
const asBytePipe = (stream: CompressionStream | DecompressionStream) =>
  stream as unknown as ReadableWritablePair<Uint8Array, Uint8Array>;

export const compressTextToBlob = async (text: string, mimeType: string): Promise<Blob> => {
  const stream = bytesToStream(new TextEncoder().encode(text)).pipeThrough(asBytePipe(new CompressionStream('gzip')));
  const compressed = await streamToBytes(stream);
  // TS 5.7's stricter Uint8Array<ArrayBufferLike> vs <ArrayBuffer> split
  // rejects this even though it's exactly what Blob's constructor expects.
  return new Blob([compressed as unknown as BlobPart], { type: mimeType });
};

export const isGzip = (bytes: Uint8Array): boolean =>
  bytes[0] === GZIP_MAGIC[0] && bytes[1] === GZIP_MAGIC[1];

export const decompressBlobToText = async (blob: Blob): Promise<string> => {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const stream = bytesToStream(bytes).pipeThrough(asBytePipe(new DecompressionStream('gzip')));
  const decompressed = await streamToBytes(stream);
  return new TextDecoder().decode(decompressed);
};

// Reads a File/Blob that may or may not be gzip-compressed (sniffed by magic
// bytes, not filename — a renamed .json.gz should still open) and returns
// its decoded text either way.
export const readPossiblyGzippedFile = async (file: Blob): Promise<string> => {
  const head = new Uint8Array(await file.slice(0, 2).arrayBuffer());
  if (isGzip(head)) return decompressBlobToText(file);
  return file.text();
};
