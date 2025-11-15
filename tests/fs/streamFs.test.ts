import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { streamWriteFile } from '../../src/modules/fs/streamFs';

function withPatchedConsole<T>(fn: () => Promise<T> | T) {
  const originalLog = console.log;
  const originalError = console.error;
  const logs: string[] = [];
  const errors: string[] = [];
  console.log = (...args: any[]) => {
    logs.push(args.map(String).join(' '));
  };
  console.error = (...args: any[]) => {
    errors.push(args.map(String).join(' '));
  };

  const restore = () => {
    console.log = originalLog;
    console.error = originalError;
  };

  const result = Promise.resolve()
    .then(fn)
    .finally(restore)
    .then((value) => ({ value, logs, errors }));

  return result;
}

function tmpFilePath(prefix: string) {
  const id = Math.random().toString(36).slice(2);
  return path.join(os.tmpdir(), `${prefix}-${id}.txt`);
}

test('streamWriteFile writes data and streamReadFile logs words then finishes', async () => {
  const file = tmpFilePath('streamFs');
  const data = 'hello world\nfoo';

  const { logs } = await withPatchedConsole(async () => {
    try { fs.unlinkSync(file); } catch {}

    await new Promise<void>((resolve, reject) => {
      const checkDone = (msg: string) => {
        if (msg.includes('Finished reading file.')) {
          resolve();
        }
      };

      const originalLog = console.log;
      console.log = (...args: any[]) => {
        const msg = args.map(String).join(' ');
        try { checkDone(msg); } catch {}
        originalLog.apply(console, args);
      };

      try {
        streamWriteFile(file, data);
      } catch (e) {
        reject(e);
      }
    });
  });

  // Expectations: write finished, then words, then read finished
  assert.ok(logs.some(l => l.includes('Finished writing to file.')), 'should log write finish');
  assert.ok(logs.some(l => l.includes('Read word: hello')), 'should log first word');
  assert.ok(logs.some(l => l.includes('Read word: world')), 'should log second word');
  assert.ok(logs.some(l => l.includes('Read word: foo')), 'should log third word');
  assert.ok(logs.some(l => l.includes('Finished reading file.')), 'should log read finish');

  // Clean up
  try { fs.unlinkSync(file); } catch {}
});
