import { join, dirname, basename } from 'path';
import * as zip from './zip';
import { xmlFileReader } from './xml-reader';
import { findPartPath } from './relationship';

export type RelationShip = {
  relationshipId: string; // i.e. rId1
  target: string; // i.e  word/document.xml
  type: string; // i.e. http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"
};

// If main document path equals /word/document.xml
// Part-relationship item path should equals /word/_rels/document.xml.rels
function getPartRelationshipsFilename(filename: string) {
  const dir = dirname(filename);
  const base = basename(filename);
  return join(dir, '_rels', base + '.rels');
}

function findPart(name: string, file: zip.Zip, rels: RelationShip[], mainDocumentPath: string) {
  return (
    findPartPath(file, {
      relationships: rels,
      targetType: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/' + name,
      basePath: basename(mainDocumentPath),
    }) || 'word/' + name + '.xml'
  );
}

export async function readPartRelationships(file: zip.Zip, mainDocumentPath: string) {
  const path = getPartRelationshipsFilename(mainDocumentPath);
  const element = await xmlFileReader(file, path);
  const rels = element.children
    .map(child => {
      if (child.name === '{http://schemas.openxmlformats.org/package/2006/relationships}Relationship') {
        return {
          relationshipId: child.attributes.Id,
          target: child.attributes.Target,
          type: child.attributes.Type,
        };
      }
    })
    .filter(e => !!e) as RelationShip[];
  return {
    // TODO: Implement later
    // comments: findPart('comments'),
    // endnotes: findPart('endnotes'),
    // footnotes: findPart('footnotes'),
    numbering: findPart('numbering', file, rels, mainDocumentPath),
    styles: findPart('styles', file, rels, mainDocumentPath),
  };
}
