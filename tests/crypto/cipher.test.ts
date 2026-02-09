import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import {
    encrypt,
    decrypt,
    generateRandomBytes,
    generateRandomHex,
    generateSecureToken
} from '../../src/modules/crypto/cipher';

test('encrypt and decrypt round-trip preserves plaintext', () => {
    const plaintext = 'secret message to encrypt';
    const password = 'strong-password-123';

    const encrypted = encrypt(plaintext, password);
    const decrypted = decrypt(encrypted, password);

    assert.equal(decrypted, plaintext);
});

test('encrypt produces different output each time due to random salt/iv', () => {
    const plaintext = 'same message';
    const password = 'password';

    const enc1 = encrypt(plaintext, password);
    const enc2 = encrypt(plaintext, password);

    assert.notEqual(enc1.ciphertext, enc2.ciphertext);
    assert.notEqual(enc1.iv, enc2.iv);
    assert.notEqual(enc1.salt, enc2.salt);
});

test('decrypt with wrong password throws error', () => {
    const encrypted = encrypt('secret', 'correct-password');

    assert.throws(() => {
        decrypt(encrypted, 'wrong-password');
    });
});

test('decrypt with tampered ciphertext throws error', () => {
    const encrypted = encrypt('secret', 'password');
    encrypted.ciphertext = 'tampered' + encrypted.ciphertext.slice(8);

    assert.throws(() => {
        decrypt(encrypted, 'password');
    });
});

test('decrypt with tampered authTag throws error', () => {
    const encrypted = encrypt('secret', 'password');
    encrypted.authTag = '00'.repeat(16);

    assert.throws(() => {
        decrypt(encrypted, 'password');
    });
});

test('generateRandomBytes returns buffer of specified length', () => {
    const bytes = generateRandomBytes(32);
    assert.ok(Buffer.isBuffer(bytes));
    assert.equal(bytes.length, 32);
});

test('generateRandomBytes produces different output each call', () => {
    const b1 = generateRandomBytes(16);
    const b2 = generateRandomBytes(16);
    assert.notEqual(b1.toString('hex'), b2.toString('hex'));
});

test('generateRandomHex returns hex string of specified length', () => {
    const hex = generateRandomHex(64);
    assert.equal(hex.length, 64);
    assert.match(hex, /^[0-9a-f]+$/);
});

test('generateSecureToken returns base64url string', () => {
    const token = generateSecureToken(32);
    assert.ok(token.length > 0);
    assert.match(token, /^[A-Za-z0-9_-]+$/);
});

test('generateSecureToken produces different tokens each call', () => {
    const t1 = generateSecureToken();
    const t2 = generateSecureToken();
    assert.notEqual(t1, t2);
});
