import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { makeUint32View } from '../../src/modules/buffer/buff';

test('makeUint32View returns a Uint32Array view of length 1', () => {
  const view = makeUint32View();
  assert.ok(view instanceof Uint32Array, 'should be Uint32Array');
  assert.equal(view.length, 1, 'should have one 32-bit element');
});
