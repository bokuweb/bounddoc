import * as zip from './zip';

export async function open(buf: ArrayBuffer) {
  return await zip.createZip(buf);
}
