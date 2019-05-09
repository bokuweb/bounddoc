import * as zip from './zip';
import * as constants from './constants';

// OOXML parts readers
import { readContentTypes } from './content-type';
import { readRelationships, RelationShip, findPartPath } from './relationship';
import { readPartRelationships } from './part-relationship';
import { readStyles } from './style';
import { readNumberings } from './numbering';
import { readMain } from './main-document';

import { resolve } from './resolver';

export async function read(file: zip.Zip /*, input = {}*/) {
  // First, the content type for relationship parts and the Main Document part
  // (the only required part) must be defined (physically located at /[Content_Types].xml in the package)
  const contentTypes = await readContentTypes(file);
  // Next, the single required relationship (the package-level relationship to the Main Document part)
  //  must be defined (physically located at /_rels/.rels in the package)
  const relationships = await readRelationships(file);
  const params = { relationships, targetType: constants.DOC_RELATIONSHIP_TYPE, basePath: '' };
  // Finally, the minimum content for the Main Document part must be defined
  // (physically located at /document.xml in the package):
  const mainDocumentPath = findPartPath(file, params) || '';
  if (!zip.exists(file, mainDocumentPath)) throw new Error('Can not find document file.');
  const partRelPaths = await readPartRelationships(file, mainDocumentPath);
  const styles = await readStyles(file, partRelPaths.styles);
  const numberings = await readNumberings(file, partRelPaths.numbering);
  const main = await readMain(file, mainDocumentPath);
  if (!main) throw new Error('Failed to open docx file, this is because can not find document file');
  // require('fs').writeFileSync('nda2_.json', JSON.stringify(main, null, 2));
  return resolve(main, numberings, styles);
}
