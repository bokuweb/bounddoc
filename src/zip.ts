import Zip from 'jszip';

export type Zip = Zip;

export function exists(zip: Zip, name: string) {
  return zip.file(name) !== null;
}

export async function readAsBuf(zip: Zip, name: string) {
  const array = await zip.file(name).async('uint8array');
  const buf = Buffer.from(array);
  return buf;
}

export async function readAsUTF8(zip: Zip, name: string) {
  const array = await zip.file(name).async('uint8array');
  const buf = Buffer.from(array);
  return buf.toString('utf-8');
}

export async function createZip(buf: ArrayBuffer) {
  const zip = new Zip();
  const z = await zip.loadAsync(buf);
  return z;
}
