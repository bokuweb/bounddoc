import * as zip from './zip';
import { xmlFileReader } from './xml-reader';
import { OOElement } from './xml/nodes';

import * as reader from './element-reader';
import { element } from './xml';

export async function readMain(file: zip.Zip, path: string) {
  return await xmlFileReader(file, path);
}
