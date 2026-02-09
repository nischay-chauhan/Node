import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import {
    hashString,
    hashBuffer,
    hashFile,
    createHmacSignature,
    verifyHmacSignature
} from '../../src/modules/crypto/hash';

function tmpFilePath(prefix: string): string {
    const id = Math.random().toString(36).slice(2);
    return path.join(os.tmpdir(), `${prefix}-${id}.txt`);
}

test('hashString returns correct SHA256 hex digest', () => {
    const result = hashString('hello world');
    assert.equal(result.algorithm, 'sha256');
    assert.equal(result.encoding, 'hex');
    assert.equal(
        result.digest,
        'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9'
    );
});

test('hashString with MD5 returns correct digest', () => {
    const result = hashString('hello world', 'md5');
    assert.equal(result.algorithm, 'md5');
    assert.equal(result.digest, '5eb63bbbe01eeed093cb22bb8f5acdc3');
});

test('hashString with base64 encoding', () => {
    const result = hashString('test', 'sha256', 'base64');
    assert.equal(result.encoding, 'base64');
    assert.ok(result.digest.length > 0);
});

test('hashBuffer returns same result as hashString for same input', () => {
    const data = 'test data';
    const stringResult = hashString(data);
    const bufferResult = hashBuffer(Buffer.from(data));
    assert.equal(stringResult.digest, bufferResult.digest);
});

test('hashFile computes correct hash for file content', async () => {
    const filePath = tmpFilePath('hash-test');
    const content = 'file content for hashing';

    fs.writeFileSync(filePath, content);

    try {
        const fileResult = await hashFile(filePath);
        const stringResult = hashString(content);
        assert.equal(fileResult.digest, stringResult.digest);
    } finally {
        fs.unlinkSync(filePath);
    }
});

test('createHmacSignature generates consistent signatures', () => {
    const data = 'message to sign';
    const secret = 'secret-key';

    const sig1 = createHmacSignature(data, secret);
    const sig2 = createHmacSignature(data, secret);

    assert.equal(sig1, sig2);
});

test('createHmacSignature differs with different secrets', () => {
    const data = 'message';

    const sig1 = createHmacSignature(data, 'secret1');
    const sig2 = createHmacSignature(data, 'secret2');

    assert.notEqual(sig1, sig2);
});

test('verifyHmacSignature returns true for valid signature', () => {
    const data = 'verify this';
    const secret = 'my-secret';

    const signature = createHmacSignature(data, secret);
    const isValid = verifyHmacSignature(data, secret, signature);

    assert.equal(isValid, true);
});

test('verifyHmacSignature returns false for invalid signature', () => {
    const data = 'verify this';
    const secret = 'my-secret';

    const isValid = verifyHmacSignature(data, secret, 'invalid-signature');

    assert.equal(isValid, false);
});

test('verifyHmacSignature returns false for tampered data', () => {
    const secret = 'my-secret';

    const signature = createHmacSignature('original', secret);
    const isValid = verifyHmacSignature('tampered', secret, signature);

    assert.equal(isValid, false);
});
