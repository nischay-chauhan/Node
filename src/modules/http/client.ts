import { request, RequestOptions, IncomingMessage } from 'node:http';

export interface HttpResponse {
    statusCode: number;
    headers: Record<string, string | string[] | undefined>;
    body: string;
}

export interface RequestConfig {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    timeout?: number;
}

function parseUrl(url: string): { hostname: string; port: number; path: string } {
    const parsed = new URL(url);
    return {
        hostname: parsed.hostname,
        port: parseInt(parsed.port, 10) || 80,
        path: parsed.pathname + parsed.search
    };
}

export function httpRequest(url: string, config: RequestConfig = {}): Promise<HttpResponse> {
    return new Promise((resolve, reject) => {
        const { hostname, port, path } = parseUrl(url);

        const options: RequestOptions = {
            hostname,
            port,
            path,
            method: config.method || 'GET',
            headers: config.headers || {},
            timeout: config.timeout || 30000
        };

        const req = request(options, (res: IncomingMessage) => {
            const chunks: Uint8Array[] = [];

            res.on('data', (chunk: Buffer) => chunks.push(new Uint8Array(chunk)));
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode || 0,
                    headers: res.headers as Record<string, string | string[] | undefined>,
                    body: Buffer.concat(chunks).toString('utf8')
                });
            });
        });

        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        if (config.body) {
            req.write(config.body);
        }

        req.end();
    });
}

export function httpGet(url: string, headers?: Record<string, string>): Promise<HttpResponse> {
    return httpRequest(url, { method: 'GET', headers });
}

export function httpPost(
    url: string,
    body: string,
    headers?: Record<string, string>
): Promise<HttpResponse> {
    return httpRequest(url, { method: 'POST', body, headers });
}

export function httpPut(
    url: string,
    body: string,
    headers?: Record<string, string>
): Promise<HttpResponse> {
    return httpRequest(url, { method: 'PUT', body, headers });
}

export function httpDelete(url: string, headers?: Record<string, string>): Promise<HttpResponse> {
    return httpRequest(url, { method: 'DELETE', headers });
}

export async function fetchJson<T>(url: string): Promise<T> {
    const response = await httpGet(url, { 'Accept': 'application/json' });
    return JSON.parse(response.body) as T;
}

export async function postJson<T, R>(url: string, data: T): Promise<R> {
    const response = await httpPost(url, JSON.stringify(data), {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    });
    return JSON.parse(response.body) as R;
}
