import { OOElement } from './xml/nodes';

import { Styles } from './style';
import { Numberings } from './numbering';
import { readElement, Result } from './element-reader';

export function resolve(el: OOElement, numbering: Numberings | null, styles: Styles | null): Result[] {
  const body = el.first('w:body');
  if (!body) throw new Error('Can not find body in main document');
  const rows = body.children.map(row => readElement(row, numbering, styles));
  // console.log(JSON.stringify(rows, null, '  '));
  return rows;
}
