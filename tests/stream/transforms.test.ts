import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { Readable } from 'node:stream';

import {
    UpperCaseTransform,
    LowerCaseTransform,
    LineTransform,
    JsonParseTransform,
    JsonStringifyTransform,
    FilterTransform,
    MapTransform,
    BatchTransform,
    collectStream
} from '../../src/modules/stream/transforms';

async function transformString(input: string, transform: NodeJS.ReadWriteStream): Promise<string> {
    const chunks: Uint8Array[] = [];
    const readable = Readable.from(Buffer.from(input));

    return new Promise((resolve, reject) => {
        readable.pipe(transform);
        transform.on('data', (chunk) => chunks.push(new Uint8Array(Buffer.from(chunk))));
        transform.on('end', () => resolve(Buffer.concat(chunks).toString()));
        transform.on('error', reject);
    });
}

test('UpperCaseTransform converts text to uppercase', async () => {
    const transform = new UpperCaseTransform();
    const result = await transformString('hello world', transform);
    assert.equal(result, 'HELLO WORLD');
});

test('LowerCaseTransform converts text to lowercase', async () => {
    const transform = new LowerCaseTransform();
    const result = await transformString('HELLO WORLD', transform);
    assert.equal(result, 'hello world');
});

test('LineTransform splits input into lines', async () => {
    const transform = new LineTransform();
    const readable = Readable.from(Buffer.from('line1\nline2\nline3'));
    readable.pipe(transform);

    const lines = await collectStream<string>(transform);
    assert.deepEqual(lines, ['line1', 'line2', 'line3']);
});

test('JsonParseTransform parses JSON strings', async () => {
    const transform = new JsonParseTransform();
    const readable = Readable.from(['{"name":"test"}']);
    readable.pipe(transform);

    const items = await collectStream<{ name: string }>(transform);
    assert.equal(items.length, 1);
    assert.equal(items[0].name, 'test');
});

test('JsonStringifyTransform converts objects to JSON', async () => {
    const transform = new JsonStringifyTransform();
    const readable = Readable.from([{ id: 1 }, { id: 2 }]);
    readable.pipe(transform);

    const items = await collectStream<string>(transform);
    assert.equal(items.length, 2);
    assert.equal(items[0].trim(), '{"id":1}');
    assert.equal(items[1].trim(), '{"id":2}');
});

test('FilterTransform filters items based on predicate', async () => {
    const transform = new FilterTransform<number>((n) => n > 5);
    const readable = Readable.from([1, 3, 7, 2, 9, 4]);
    readable.pipe(transform);

    const items = await collectStream<number>(transform);
    assert.deepEqual(items, [7, 9]);
});

test('MapTransform maps items using mapper function', async () => {
    const transform = new MapTransform<number, number>((n) => n * 2);
    const readable = Readable.from([1, 2, 3]);
    readable.pipe(transform);

    const items = await collectStream<number>(transform);
    assert.deepEqual(items, [2, 4, 6]);
});

test('BatchTransform groups items into batches', async () => {
    const transform = new BatchTransform<number>(3);
    const readable = Readable.from([1, 2, 3, 4, 5, 6, 7]);
    readable.pipe(transform);

    const batches = await collectStream<number[]>(transform);
    assert.equal(batches.length, 3);
    assert.deepEqual(batches[0], [1, 2, 3]);
    assert.deepEqual(batches[1], [4, 5, 6]);
    assert.deepEqual(batches[2], [7]);
});

test('collectStream collects all items from stream', async () => {
    const readable = Readable.from(['a', 'b', 'c']);
    const items = await collectStream<string>(readable);
    assert.deepEqual(items, ['a', 'b', 'c']);
});

test('transforms can be chained', async () => {
    const upper = new UpperCaseTransform();
    const readable = Readable.from(Buffer.from('hello'));

    const result = await transformString('hello', upper);
    assert.equal(result, 'HELLO');
});
