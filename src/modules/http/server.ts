import { createServer, IncomingMessage, ServerResponse, Server } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { extname } from 'node:path';

export interface ServerConfig {
    port: number;
    host?: string;
}

export interface RouteHandler {
    (req: IncomingMessage, res: ServerResponse): void | Promise<void>;
}

export interface Router {
    routes: Map<string, Map<string, RouteHandler>>;
    get(path: string, handler: RouteHandler): void;
    post(path: string, handler: RouteHandler): void;
    put(path: string, handler: RouteHandler): void;
    delete(path: string, handler: RouteHandler): void;
    handle(req: IncomingMessage, res: ServerResponse): Promise<void>;
}

const MIME_TYPES: Record<string, string> = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain',
    '.pdf': 'application/pdf'
};

export function createRouter(): Router {
    const routes = new Map<string, Map<string, RouteHandler>>();

    function addRoute(method: string, path: string, handler: RouteHandler): void {
        if (!routes.has(method)) {
            routes.set(method, new Map());
        }
        routes.get(method)!.set(path, handler);
    }

    return {
        routes,
        get(path: string, handler: RouteHandler): void {
            addRoute('GET', path, handler);
        },
        post(path: string, handler: RouteHandler): void {
            addRoute('POST', path, handler);
        },
        put(path: string, handler: RouteHandler): void {
            addRoute('PUT', path, handler);
        },
        delete(path: string, handler: RouteHandler): void {
            addRoute('DELETE', path, handler);
        },
        async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
            const method = req.method || 'GET';
            const url = req.url || '/';
            const pathname = new URL(url, `http://${req.headers.host}`).pathname;

            const methodRoutes = routes.get(method);
            if (methodRoutes && methodRoutes.has(pathname)) {
                const handler = methodRoutes.get(pathname)!;
                await handler(req, res);
            } else {
                res.statusCode = 404;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Not Found' }));
            }
        }
    };
}

export function parseBody(req: IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
        const chunks: Uint8Array[] = [];
        req.on('data', (chunk: Buffer) => chunks.push(new Uint8Array(chunk)));
        req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        req.on('error', reject);
    });
}

export function parseJsonBody<T>(req: IncomingMessage): Promise<T> {
    return parseBody(req).then((body) => JSON.parse(body) as T);
}

export function sendJson(res: ServerResponse, data: unknown, statusCode: number = 200): void {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
}

export function sendText(res: ServerResponse, text: string, statusCode: number = 200): void {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'text/plain');
    res.end(text);
}

export function sendFile(res: ServerResponse, filePath: string): void {
    try {
        const stat = statSync(filePath);
        const ext = extname(filePath);
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.statusCode = 200;
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', stat.size);

        const stream = createReadStream(filePath);
        stream.pipe(res);
        stream.on('error', () => {
            res.statusCode = 500;
            res.end('Internal Server Error');
        });
    } catch {
        res.statusCode = 404;
        res.end('File Not Found');
    }
}

export function sendFileWithRange(
    req: IncomingMessage,
    res: ServerResponse,
    filePath: string
): void {
    try {
        const stat = statSync(filePath);
        const fileSize = stat.size;
        const ext = extname(filePath);
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        const range = req.headers.range;

        if (range) {
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunkSize = end - start + 1;

            res.statusCode = 206;
            res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
            res.setHeader('Accept-Ranges', 'bytes');
            res.setHeader('Content-Length', chunkSize);
            res.setHeader('Content-Type', contentType);

            const stream = createReadStream(filePath, { start, end });
            stream.pipe(res);
        } else {
            res.statusCode = 200;
            res.setHeader('Content-Length', fileSize);
            res.setHeader('Content-Type', contentType);
            res.setHeader('Accept-Ranges', 'bytes');

            const stream = createReadStream(filePath);
            stream.pipe(res);
        }
    } catch {
        res.statusCode = 404;
        res.end('File Not Found');
    }
}

export function startServer(config: ServerConfig, router: Router): Server {
    const server = createServer(async (req, res) => {
        try {
            await router.handle(req, res);
        } catch {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Internal Server Error' }));
        }
    });

    server.listen(config.port, config.host || '127.0.0.1');
    return server;
}

export function stopServer(server: Server): Promise<void> {
    return new Promise((resolve, reject) => {
        server.close((err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}
