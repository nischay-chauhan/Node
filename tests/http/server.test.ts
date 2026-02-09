import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import {
    createRouter,
    startServer,
    stopServer,
    sendJson,
    sendText,
    sendFile,
    parseBody
} from '../../src/modules/http/server';

import { httpGet, httpPost } from '../../src/modules/http/client';

function tmpFilePath(prefix: string): string {
    const id = Math.random().toString(36).slice(2);
    return path.join(os.tmpdir(), `${prefix}-${id}`);
}

function getRandomPort(): number {
    return 3000 + Math.floor(Math.random() * 1000);
}

test('router handles GET request and returns JSON', async () => {
    const port = getRandomPort();
    const router = createRouter();

    router.get('/api/health', (_req, res) => {
        sendJson(res, { status: 'ok' });
    });

    const server = startServer({ port }, router);

    try {
        const response = await httpGet(`http://127.0.0.1:${port}/api/health`);
        assert.equal(response.statusCode, 200);
        const body = JSON.parse(response.body);
        assert.equal(body.status, 'ok');
    } finally {
        await stopServer(server);
    }
});

test('router handles POST request with body', async () => {
    const port = getRandomPort();
    const router = createRouter();

    router.post('/api/echo', async (req, res) => {
        const body = await parseBody(req);
        sendText(res, body);
    });

    const server = startServer({ port }, router);

    try {
        const response = await httpPost(
            `http://127.0.0.1:${port}/api/echo`,
            'hello server'
        );
        assert.equal(response.statusCode, 200);
        assert.equal(response.body, 'hello server');
    } finally {
        await stopServer(server);
    }
});

test('router returns 404 for unknown routes', async () => {
    const port = getRandomPort();
    const router = createRouter();

    router.get('/known', (_req, res) => {
        sendText(res, 'known');
    });

    const server = startServer({ port }, router);

    try {
        const response = await httpGet(`http://127.0.0.1:${port}/unknown`);
        assert.equal(response.statusCode, 404);
    } finally {
        await stopServer(server);
    }
});

test('sendFile serves file content', async () => {
    const port = getRandomPort();
    const router = createRouter();
    const filePath = tmpFilePath('serve-test.txt');
    const content = 'file content for serving';

    fs.writeFileSync(filePath, content);

    router.get('/file', (_req, res) => {
        sendFile(res, filePath);
    });

    const server = startServer({ port }, router);

    try {
        const response = await httpGet(`http://127.0.0.1:${port}/file`);
        assert.equal(response.statusCode, 200);
        assert.equal(response.body, content);
    } finally {
        await stopServer(server);
        fs.unlinkSync(filePath);
    }
});

test('router handles multiple routes', async () => {
    const port = getRandomPort();
    const router = createRouter();

    router.get('/one', (_req, res) => sendJson(res, { route: 1 }));
    router.get('/two', (_req, res) => sendJson(res, { route: 2 }));

    const server = startServer({ port }, router);

    try {
        const r1 = await httpGet(`http://127.0.0.1:${port}/one`);
        const r2 = await httpGet(`http://127.0.0.1:${port}/two`);

        assert.equal(JSON.parse(r1.body).route, 1);
        assert.equal(JSON.parse(r2.body).route, 2);
    } finally {
        await stopServer(server);
    }
});
