import { open } from './unzip';
import { read } from './docx-reader';

export async function convert(buf: ArrayBuffer /*, options */) {
  const file = await open(buf);
  const res = await read(file);
}
