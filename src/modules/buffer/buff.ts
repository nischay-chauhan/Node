import { Buffer } from 'node:buffer';

export function makeUint32View(): Uint32Array {
  const buf = Buffer.from([1, 2, 3, 4]);
  const view = new Uint32Array(buf.buffer, buf.byteOffset, Math.floor(buf.byteLength / 4));
  return view;
}

const uint32array = makeUint32View();
console.log(uint32array);

