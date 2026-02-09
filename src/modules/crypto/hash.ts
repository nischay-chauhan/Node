import { createHash, createHmac, Hash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';

export type HashAlgorithm = 'sha256' | 'sha512' | 'md5' | 'sha1';

export interface HashResult {
    algorithm: HashAlgorithm;
    digest: string;
    encoding: 'hex' | 'base64';
}

export function hashString(
    data: string,
    algorithm: HashAlgorithm = 'sha256',
    encoding: 'hex' | 'base64' = 'hex'
): HashResult {
    const hash = createHash(algorithm);
    hash.update(data);
    return {
        algorithm,
        digest: hash.digest(encoding),
        encoding
    };
}

export function hashBuffer(
    data: Buffer | Uint8Array,
    algorithm: HashAlgorithm = 'sha256',
    encoding: 'hex' | 'base64' = 'hex'
): HashResult {
    const hash = createHash(algorithm);
    hash.update(new Uint8Array(data));
    return {
        algorithm,
        digest: hash.digest(encoding),
        encoding
    };
}

export async function hashFile(
    filePath: string,
    algorithm: HashAlgorithm = 'sha256',
    encoding: 'hex' | 'base64' = 'hex'
): Promise<HashResult> {
    const hash = createHash(algorithm);
    const stream = createReadStream(filePath);

    await pipeline(stream, hash);

    return {
        algorithm,
        digest: hash.digest(encoding),
        encoding
    };
}

export function createHmacSignature(
    data: string,
    secret: string,
    algorithm: HashAlgorithm = 'sha256',
    encoding: 'hex' | 'base64' = 'hex'
): string {
    const hmac = createHmac(algorithm, secret);
    hmac.update(data);
    return hmac.digest(encoding);
}

export function verifyHmacSignature(
    data: string,
    secret: string,
    signature: string,
    algorithm: HashAlgorithm = 'sha256',
    encoding: 'hex' | 'base64' = 'hex'
): boolean {
    const expected = createHmacSignature(data, secret, algorithm, encoding);
    if (expected.length !== signature.length) {
        return false;
    }
    let result = 0;
    for (let i = 0; i < expected.length; i++) {
        result |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
    }
    return result === 0;
}

export function createStreamingHash(algorithm: HashAlgorithm = 'sha256'): Hash {
    return createHash(algorithm);
}
