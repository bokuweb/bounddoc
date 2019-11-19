import JSZip from 'jszip';

export type Zip = JSZip;

export function exists(zip: JSZip, name: string) {
  return zip.file(name) !== null;
}

export async function readAsBuf(zip: JSZip, name: string) {
  const array = await zip.file(name).async('uint8array');
  const buf = Buffer.from(array);
  return buf;
}

export async function readAsUTF8(zip: JSZip, name: string) {
  const array = await zip.file(name).async('uint8array');
  const buf = Buffer.from(array);
  return buf.toString('utf-8');
}

export async function createZip(buf: ArrayBuffer) {
  const zip = new JSZip();
  const z = await zip.loadAsync(buf);
  return z;
}
