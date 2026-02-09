import { Transform, TransformCallback, TransformOptions, Readable, Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

export class UpperCaseTransform extends Transform {
    constructor(options?: TransformOptions) {
        super(options);
    }

    _transform(chunk: Buffer, _encoding: string, callback: TransformCallback): void {
        const upper = chunk.toString().toUpperCase();
        this.push(Buffer.from(upper));
        callback();
    }
}

export class LowerCaseTransform extends Transform {
    constructor(options?: TransformOptions) {
        super(options);
    }

    _transform(chunk: Buffer, _encoding: string, callback: TransformCallback): void {
        const lower = chunk.toString().toLowerCase();
        this.push(Buffer.from(lower));
        callback();
    }
}

export class LineTransform extends Transform {
    private buffer: string = '';

    constructor(options?: TransformOptions) {
        super({ ...options, objectMode: true });
    }

    _transform(chunk: Buffer, _encoding: string, callback: TransformCallback): void {
        this.buffer += chunk.toString();
        const lines = this.buffer.split('\n');
        this.buffer = lines.pop() || '';

        for (const line of lines) {
            this.push(line);
        }
        callback();
    }

    _flush(callback: TransformCallback): void {
        if (this.buffer.length > 0) {
            this.push(this.buffer);
        }
        callback();
    }
}

export class JsonParseTransform extends Transform {
    constructor(options?: TransformOptions) {
        super({ ...options, objectMode: true });
    }

    _transform(chunk: Buffer | string, _encoding: string, callback: TransformCallback): void {
        try {
            const data = typeof chunk === 'string' ? chunk : chunk.toString();
            const parsed = JSON.parse(data);
            this.push(parsed);
            callback();
        } catch (err) {
            callback(err as Error);
        }
    }
}

export class JsonStringifyTransform extends Transform {
    constructor(options?: TransformOptions) {
        super({ ...options, objectMode: true, writableObjectMode: true });
    }

    _transform(chunk: unknown, _encoding: string, callback: TransformCallback): void {
        try {
            const json = JSON.stringify(chunk);
            this.push(json + '\n');
            callback();
        } catch (err) {
            callback(err as Error);
        }
    }
}

export class FilterTransform<T> extends Transform {
    private predicate: (item: T) => boolean;

    constructor(predicate: (item: T) => boolean, options?: TransformOptions) {
        super({ ...options, objectMode: true });
        this.predicate = predicate;
    }

    _transform(chunk: T, _encoding: string, callback: TransformCallback): void {
        if (this.predicate(chunk)) {
            this.push(chunk);
        }
        callback();
    }
}

export class MapTransform<T, R> extends Transform {
    private mapper: (item: T) => R;

    constructor(mapper: (item: T) => R, options?: TransformOptions) {
        super({ ...options, objectMode: true });
        this.mapper = mapper;
    }

    _transform(chunk: T, _encoding: string, callback: TransformCallback): void {
        try {
            const result = this.mapper(chunk);
            this.push(result);
            callback();
        } catch (err) {
            callback(err as Error);
        }
    }
}

export class BatchTransform<T> extends Transform {
    private batch: T[] = [];
    private batchSize: number;

    constructor(batchSize: number, options?: TransformOptions) {
        super({ ...options, objectMode: true });
        this.batchSize = batchSize;
    }

    _transform(chunk: T, _encoding: string, callback: TransformCallback): void {
        this.batch.push(chunk);
        if (this.batch.length >= this.batchSize) {
            this.push(this.batch);
            this.batch = [];
        }
        callback();
    }

    _flush(callback: TransformCallback): void {
        if (this.batch.length > 0) {
            this.push(this.batch);
        }
        callback();
    }
}

export class ThrottleTransform extends Transform {
    private interval: number;
    private lastTime: number = 0;

    constructor(intervalMs: number, options?: TransformOptions) {
        super(options);
        this.interval = intervalMs;
    }

    _transform(chunk: Buffer, _encoding: string, callback: TransformCallback): void {
        const now = Date.now();
        const elapsed = now - this.lastTime;
        const delay = Math.max(0, this.interval - elapsed);

        setTimeout(() => {
            this.lastTime = Date.now();
            this.push(chunk);
            callback();
        }, delay);
    }
}

export async function collectStream<T>(stream: Readable): Promise<T[]> {
    const items: T[] = [];
    for await (const chunk of stream) {
        items.push(chunk as T);
    }
    return items;
}

export async function pipelineWithTransforms(
    source: Readable,
    transforms: Transform[],
    destination: Writable
): Promise<void> {
    if (transforms.length === 0) {
        await pipeline(source, destination);
        return;
    }

    let current: Readable | Transform = source;
    for (const transform of transforms) {
        current = current.pipe(transform);
    }
    (current as Transform).pipe(destination);

    await new Promise<void>((resolve, reject) => {
        destination.on('finish', resolve);
        destination.on('error', reject);
        source.on('error', reject);
    });
}

export function createPassThroughCounter(): { transform: Transform; getCount: () => number } {
    let count = 0;
    let bytes = 0;

    const transform = new Transform({
        transform(chunk: Buffer, _encoding, callback) {
            count++;
            bytes += chunk.length;
            this.push(chunk);
            callback();
        }
    });

    return {
        transform,
        getCount: () => count
    };
}
