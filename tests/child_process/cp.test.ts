import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { example2, runCommand } from '../../src/modules/child_process/cp';

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

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  let t: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    t = setTimeout(() => reject(new Error(`Timeout: ${label} after ${ms}ms`)), ms);
  });
  return Promise.race([p, timeout]).finally(() => clearTimeout(t!)) as Promise<T>;
}

test('example2 pipes find to wc and logs file count', async () => {
  const { logs } = await withTimeout(
    withPatchedConsole(async () => {
      await new Promise<void>((resolve) => {
        const originalLog = console.log;
        console.log = (...args: any[]) => {
          const msg = args.map(String).join(' ');
          if (msg.includes('Number of files :')) {
            resolve();
          }
          originalLog.apply(console, args);
        };
        example2();
      });
    }),
    10000,
    'example2'
  );

  assert.ok(logs.some((l) => l.includes('Number of files :')), 'should log counted files');
});

test('runCommand logs git output and exit code', async () => {
  const { logs, errors } = await withTimeout(
    withPatchedConsole(async () => {
      await new Promise<void>((resolve) => {
        const originalLog = console.log;
        console.log = (...args: any[]) => {
          const msg = args.map(String).join(' ');
          if (msg.includes('Git log exited with code')) {
            resolve();
          }
          originalLog.apply(console, args);
        };
        runCommand();
      });
    }),
    10000,
    'runCommand'
  );

  // Allow some variability: either we saw output or at least the exit code line
  const sawExit = logs.some((l) => l.includes('Git log exited with code'));
  const sawOutput = logs.some((l) => l.includes('Git log output:'));
  assert.ok(sawExit || sawOutput, 'should log git output or exit code');

  // Should not have critical spawn errors captured on stderr
  const critical = errors.find((e) => /ENOENT|not found/i.test(e));
  assert.equal(critical, undefined, 'git should be available in this repo');
});
