import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import {
    gzipBuffer,
    gunzipBuffer,
    deflateBuffer,
    inflateBuffer,
    gzipFile,
    gunzipFile
} from '../../src/modules/zlib/compress';

function tmpFilePath(prefix: string): string {
    const id = Math.random().toString(36).slice(2);
    return path.join(os.tmpdir(), `${prefix}-${id}`);
}

test('gzipBuffer and gunzipBuffer round-trip preserves data', async () => {
    const original = Buffer.from('hello world, this is test data for compression');

    const compressed = await gzipBuffer(original);
    const decompressed = await gunzipBuffer(compressed);

    assert.deepEqual(decompressed, original);
});

test('gzipBuffer produces smaller output for compressible data', async () => {
    const original = Buffer.from('a'.repeat(1000));

    const compressed = await gzipBuffer(original);

    assert.ok(compressed.length < original.length);
});

test('deflateBuffer and inflateBuffer round-trip preserves data', async () => {
    const original = Buffer.from('deflate test data with some content');

    const compressed = await deflateBuffer(original);
    const decompressed = await inflateBuffer(compressed);

    assert.deepEqual(decompressed, original);
});

test('gzipFile compresses file and returns stats', async () => {
    const inputPath = tmpFilePath('gzip-input.txt');
    const outputPath = tmpFilePath('gzip-output.gz');
    const content = 'x'.repeat(500);

    fs.writeFileSync(inputPath, content);

    try {
        const result = await gzipFile(inputPath, outputPath);

        assert.equal(result.originalSize, content.length);
        assert.ok(result.compressedSize > 0);
        assert.ok(result.compressedSize < result.originalSize);
        assert.ok(result.compressionRatio < 1);
        assert.ok(fs.existsSync(outputPath));
    } finally {
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    }
});

test('gunzipFile decompresses file and returns stats', async () => {
    const originalPath = tmpFilePath('original.txt');
    const compressedPath = tmpFilePath('compressed.gz');
    const decompressedPath = tmpFilePath('decompressed.txt');
    const content = 'decompression test content repeated '.repeat(20);

    fs.writeFileSync(originalPath, content);

    try {
        await gzipFile(originalPath, compressedPath);
        const result = await gunzipFile(compressedPath, decompressedPath);

        assert.ok(result.originalSize > 0);
        assert.ok(result.compressedSize > 0);

        const decompressedContent = fs.readFileSync(decompressedPath, 'utf8');
        assert.equal(decompressedContent, content);
    } finally {
        if (fs.existsSync(originalPath)) fs.unlinkSync(originalPath);
        if (fs.existsSync(compressedPath)) fs.unlinkSync(compressedPath);
        if (fs.existsSync(decompressedPath)) fs.unlinkSync(decompressedPath);
    }
});

test('gzipBuffer handles empty input', async () => {
    const original = Buffer.alloc(0);

    const compressed = await gzipBuffer(original);
    const decompressed = await gunzipBuffer(compressed);

    assert.deepEqual(decompressed, original);
});

test('gzipBuffer handles binary data', async () => {
    const original = Buffer.from([0x00, 0xff, 0x7f, 0x80, 0x01, 0xfe]);

    const compressed = await gzipBuffer(original);
    const decompressed = await gunzipBuffer(compressed);

    assert.deepEqual(decompressed, original);
});
