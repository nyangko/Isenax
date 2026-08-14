import { compressTextToBlob, decompressBlobToText, isGzip, readPossiblyGzippedFile } from '../compression';

describe('compression', () => {
  test('compressTextToBlob then decompressBlobToText round-trips the original text', async () => {
    const original = JSON.stringify({ title: 'test'.repeat(200), items: [] });

    const compressed = await compressTextToBlob(original, 'application/gzip');
    const restored = await decompressBlobToText(compressed);

    expect(restored).toBe(original);
  });

  test('compressTextToBlob actually shrinks repetitive text', async () => {
    const original = JSON.stringify({ padding: 'a'.repeat(10_000) });

    const compressed = await compressTextToBlob(original, 'application/gzip');

    expect(compressed.size).toBeLessThan(original.length / 10);
  });

  test('isGzip detects the gzip magic bytes, rejects plain text', () => {
    expect(isGzip(new Uint8Array([0x1f, 0x8b, 0x08]))).toBe(true);
    expect(isGzip(new Uint8Array([0x7b, 0x22]))).toBe(false); // '{"'
  });

  test('readPossiblyGzippedFile transparently reads both gzip and plain blobs', async () => {
    const original = JSON.stringify({ title: 'plain vs gzip' });
    const gzipBlob = await compressTextToBlob(original, 'application/gzip');
    const plainBlob = new Blob([original], { type: 'application/json' });

    expect(await readPossiblyGzippedFile(gzipBlob)).toBe(original);
    expect(await readPossiblyGzippedFile(plainBlob)).toBe(original);
  });
});
