import {
    createCipheriv,
    createDecipheriv,
    randomBytes,
    scryptSync,
    CipherGCMTypes
} from 'node:crypto';

export interface EncryptedData {
    ciphertext: string;
    iv: string;
    authTag: string;
    salt: string;
}

const ALGORITHM: CipherGCMTypes = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const AUTH_TAG_LENGTH = 16;

function deriveKey(password: string, salt: Uint8Array): Uint8Array {
    return new Uint8Array(scryptSync(password, salt, KEY_LENGTH));
}

export function encrypt(plaintext: string, password: string): EncryptedData {
    const salt = new Uint8Array(randomBytes(SALT_LENGTH));
    const key = deriveKey(password, salt);
    const iv = new Uint8Array(randomBytes(IV_LENGTH));

    const cipher = createCipheriv(ALGORITHM, key, iv, {
        authTagLength: AUTH_TAG_LENGTH
    });

    let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
    ciphertext += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
        ciphertext,
        iv: Buffer.from(iv).toString('hex'),
        authTag: authTag.toString('hex'),
        salt: Buffer.from(salt).toString('hex')
    };
}

export function decrypt(encrypted: EncryptedData, password: string): string {
    const salt = new Uint8Array(Buffer.from(encrypted.salt, 'hex'));
    const key = deriveKey(password, salt);
    const iv = new Uint8Array(Buffer.from(encrypted.iv, 'hex'));
    const authTag = new Uint8Array(Buffer.from(encrypted.authTag, 'hex'));

    const decipher = createDecipheriv(ALGORITHM, key, iv, {
        authTagLength: AUTH_TAG_LENGTH
    });

    decipher.setAuthTag(authTag);

    let plaintext = decipher.update(encrypted.ciphertext, 'hex', 'utf8');
    plaintext += decipher.final('utf8');

    return plaintext;
}

export function generateRandomBytes(length: number): Buffer {
    return randomBytes(length);
}

export function generateRandomHex(length: number): string {
    return randomBytes(Math.ceil(length / 2))
        .toString('hex')
        .slice(0, length);
}

export function generateSecureToken(length: number = 32): string {
    return randomBytes(length).toString('base64url');
}
