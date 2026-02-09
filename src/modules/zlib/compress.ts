import { createGzip, createGunzip, createDeflate, createInflate } from 'node:zlib';
import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable, Writable } from 'node:stream';

export interface CompressionResult {
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
}

export async function gzipBuffer(input: Buffer): Promise<Buffer> {
    const chunks: Uint8Array[] = [];
    const gzip = createGzip();

    const readable = Readable.from(input);
    const writable = new Writable({
        write(chunk, _encoding, callback) {
            chunks.push(new Uint8Array(chunk));
            callback();
        }
    });

    await pipeline(readable, gzip, writable);
    return Buffer.concat(chunks);
}

export async function gunzipBuffer(input: Buffer): Promise<Buffer> {
    const chunks: Uint8Array[] = [];
    const gunzip = createGunzip();

    const readable = Readable.from(input);
    const writable = new Writable({
        write(chunk, _encoding, callback) {
            chunks.push(new Uint8Array(chunk));
            callback();
        }
    });

    await pipeline(readable, gunzip, writable);
    return Buffer.concat(chunks);
}

export async function deflateBuffer(input: Buffer): Promise<Buffer> {
    const chunks: Uint8Array[] = [];
    const deflate = createDeflate();

    const readable = Readable.from(input);
    const writable = new Writable({
        write(chunk, _encoding, callback) {
            chunks.push(new Uint8Array(chunk));
            callback();
        }
    });

    await pipeline(readable, deflate, writable);
    return Buffer.concat(chunks);
}

export async function inflateBuffer(input: Buffer): Promise<Buffer> {
    const chunks: Uint8Array[] = [];
    const inflate = createInflate();

    const readable = Readable.from(input);
    const writable = new Writable({
        write(chunk, _encoding, callback) {
            chunks.push(new Uint8Array(chunk));
            callback();
        }
    });

    await pipeline(readable, inflate, writable);
    return Buffer.concat(chunks);
}

export async function gzipFile(
    inputPath: string,
    outputPath: string
): Promise<CompressionResult> {
    const gzip = createGzip();
    const source = createReadStream(inputPath);
    const destination = createWriteStream(outputPath);

    let originalSize = 0;
    let compressedSize = 0;

    source.on('data', (chunk: Buffer) => {
        originalSize += chunk.length;
    });

    gzip.on('data', (chunk: Buffer) => {
        compressedSize += chunk.length;
    });

    await pipeline(source, gzip, destination);

    return {
        originalSize,
        compressedSize,
        compressionRatio: originalSize > 0 ? compressedSize / originalSize : 0
    };
}

export async function gunzipFile(
    inputPath: string,
    outputPath: string
): Promise<CompressionResult> {
    const gunzip = createGunzip();
    const source = createReadStream(inputPath);
    const destination = createWriteStream(outputPath);

    let compressedSize = 0;
    let originalSize = 0;

    source.on('data', (chunk: Buffer) => {
        compressedSize += chunk.length;
    });

    gunzip.on('data', (chunk: Buffer) => {
        originalSize += chunk.length;
    });

    await pipeline(source, gunzip, destination);

    return {
        originalSize,
        compressedSize,
        compressionRatio: originalSize > 0 ? compressedSize / originalSize : 0
    };
}

export function createGzipStream() {
    return createGzip();
}

export function createGunzipStream() {
    return createGunzip();
}
