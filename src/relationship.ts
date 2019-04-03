import { join, dirname, basename } from 'path';
import * as zip from './zip';
import { xmlFileReader } from './xml-reader';

export type RelationShip = {
  relationshipId: string; // i.e. rId1
  target: string; // i.e  word/document.xml
  type: string; // i.e. http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"
};

type FindPathOptions = {
  relationships: RelationShip[];
  targetType: string;
  basePath: string;
};

function stripPrefix(value: string, prefix: string) {
  if (value.substring(0, prefix.length) === prefix) {
    return value.substring(prefix.length);
  }
  return value;
}

export function findPartPath(file: zip.Zip, options: FindPathOptions) {
  const { relationships, targetType, basePath } = options;
  return (
    relationships
      .filter(r => r.type === targetType)
      .map(({ target }) => stripPrefix(join(basePath, target), '/'))
      .find(target => zip.exists(file, target)) || null
  );
}

export async function readRelationships(file: zip.Zip) {
  const element = await xmlFileReader(file, '_rels/.rels');
  return element.children
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
}

/*
function readRelationships(element) {
  var relationships = [];
  element.children.forEach(function(child) {
    if (child.name === '{http://schemas.openxmlformats.org/package/2006/relationships}Relationship') {
      var relationship = {
        relationshipId: child.attributes.Id,
        target: child.attributes.Target,
        type: child.attributes.Type,
      };
      relationships.push(relationship);
    }
  });
  return new Relationships(relationships);
}
*/

/*
function Relationships(relationships) {
  var targetsByRelationshipId = {};
  relationships.forEach(function(relationship) {
    targetsByRelationshipId[relationship.relationshipId] = relationship.target;
  });

  var targetsByType = {};
  relationships.forEach(function(relationship) {
    if (!targetsByType[relationship.type]) {
      targetsByType[relationship.type] = [];
    }
    targetsByType[relationship.type].push(relationship.target);
  });

  return {
    findTargetByRelationshipId: function(relationshipId) {
      return targetsByRelationshipId[relationshipId];
    },
    findTargetsByType: function(type) {
      return targetsByType[type] || [];
    },
  };
}
*/
