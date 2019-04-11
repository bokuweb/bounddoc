import * as zip from './zip';
import flatten from 'lodash/flatten';
import { OOElement } from './xml/nodes';

const xml = require('./xml');

const xmlNamespaceMap = {
  'http://schemas.openxmlformats.org/wordprocessingml/2006/main': 'w',
  'http://schemas.openxmlformats.org/officeDocument/2006/relationships': 'r',
  'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing': 'wp',
  'http://schemas.openxmlformats.org/drawingml/2006/main': 'a',
  'http://schemas.openxmlformats.org/drawingml/2006/picture': 'pic',
  'http://schemas.openxmlformats.org/package/2006/content-types': 'content-types',
  'urn:schemas-microsoft-com:vml': 'v',
  'http://schemas.openxmlformats.org/markup-compatibility/2006': 'mc',
  'urn:schemas-microsoft-com:office:word': 'office-word',
};

export async function xmlFileReader(file: zip.Zip, filename: string): Promise<OOElement | null> {
  const xml = await parseXML(file, filename);
  return xml;
}

async function parse(xmlString: string) {
  const doc = await xml.parseXML(xmlString, xmlNamespaceMap);
  const collapsed = collapseAlternateContent(doc);
  // console.log(collapsed[0], 'asdasd');
  return collapsed[0];
}

export async function parseXML(file: zip.Zip, path: string) {
  if (!zip.exists(file, path)) return null;
  const txt = await zip.readAsUTF8(file, path);
  return await parse(stripUTF8BOM(txt));
}

function stripUTF8BOM(txt: string) {
  return txt.replace(/^\uFEFF/g, '');
}

function collapseAlternateContent(el: OOElement) {
  // console.log('collapseAlternateContent')
  if (el.type === 'element') {
    if (el.name === 'mc:AlternateContent') {
      // console.log(collapseAlternateContent);
      const n = el.first('mc:Fallback');
      if (!n) return [el];
      return n.children;
    } else {
      // console.log('else');
      el.children = flatten(el.children.map(c => collapseAlternateContent(c), true));
      return [el];
    }
  }
  // console.log('sdasds');
  return [el];
}
