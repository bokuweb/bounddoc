import { open } from './unzip';
import { read } from './docx-reader';

export { OONode, Run, NodeType, Spacing, Indent, NumberingProperty } from './element-reader';

export async function convert(buf: ArrayBuffer /*, options */) {
  const file = await open(buf);
  const res = await read(file);
  // require('fs').writeFileSync('out.json', JSON.stringify(res, null, 2));
  return res;
}
