import _ from 'lodash';
import { OOElement } from './xml/nodes';

import { Styles, Style } from './style';
import { Numberings, findLevel, Level } from './numbering';

type $TODO = any;

export type NodeType = 'Paragraph' | 'Run' | 'Text';

export type Paragraph = {
  type: 'Paragraph';
  children: $TODO[];
  styleId: string | null;
  styleName: string | null;
  alignment: string | null;
  numbering: Level | null;
  indent: ReturnType<typeof readParagraphIndent>;
};

export type ParagraphProperty = {
  type: 'ParagraphProperty';
  styleId: string | null;
  styleName: string | null;
  alignment: string | null;
  numbering: Level | null;
  indent: ReturnType<typeof readParagraphIndent>;
};

export type Run = {
  type: 'Run';
  children: $TODO[];
  styleId: string | null;
  styleName: string | null;
  verticalAlignment: string | null;
  font: string | null;
  color: string | null;
  isBold: boolean;
  isUnderline: boolean;
  isItalic: boolean;
  isStrikethrough: boolean;
  isSmallCaps: boolean;
};

export type RunProperty = {
  type: 'RunProperty';
  children: $TODO[];
  styleId: string | null;
  styleName: string | null;
  verticalAlignment: string | null;
  font: string | null;
  color: string | null;
  isBold: boolean;
  isUnderline: boolean;
  isItalic: boolean;
  isStrikethrough: boolean;
  isSmallCaps: boolean;
};

export type Text = {
  type: 'Text';
  value: string;
};

export type Unknown = {
  type: 'Unknown';
};

export function readElement(el: OOElement, numbering: Numberings, styles: Styles) {
  if (el.type !== 'element') return null;
  return handleElement(el, numbering, styles);
}

function handleElement(el: OOElement, numbering: Numberings, styles: Styles) {
  switch (el.name) {
    case 'w:p':
      return readParagraph(el, numbering, styles);
    case 'w:pPr':
      return readParagraphProperty(el, numbering, styles);
    case 'w:t':
      return readText(el);
    case 'w:r':
      return readTextRun(el, numbering, styles);
    case 'w:rPr':
      return readTextRunProperty(el, styles);
    default:
      console.warn(`unhandled element name ${el.name} detected.`);
      return { type: 'Unknown' };
  }
}

// p (Paragraph)
// This element specifies a paragraph of content in the document.
// The contents of a paragraph in a WordprocessingML document shall consist of any combination of the following four kinds of content:
// - Paragraph properties
// - Annotations (bookmarks, comments, revisions)
// - Custom markup
// - Run level content (fields, hyperlinks, runs)
function readParagraph(el: OOElement, numbering: Numberings, styles: Styles): Paragraph {
  const children = el.children.map(child => readElement(child, numbering, styles));
  const index = children.findIndex(c => (c && c.type) === 'ParagraphProperty');
  const property = children[index] as ParagraphProperty;
  children.splice(index, 1);
  return { ...property, type: 'Paragraph', children };
}

// pPr (Paragraph Properties)
// This element specifies a paragraph of content in the document.
// The contents of a paragraph in a WordprocessingML document shall consist of any combination of the following four kinds of content:
// - Paragraph properties
// - Annotations (bookmarks, comments, revisions)
// - Custom markup
// - Run level content (fields, hyperlinks, runs)
function readParagraphProperty(el: OOElement, numbering: Numberings, styles: Styles): ParagraphProperty {
  const style = readStyle(el, 'w:pStyle', styles);
  const numberProperty = el.first('w:numPr');
  const styleId = (style && style.styleId) || null;
  const styleName = (style && style.name) || null;
  return {
    type: 'ParagraphProperty',
    styleId,
    styleName,
    alignment: el.findValueOf('w:jc') || null,
    numbering: (numberProperty && readNumberingProperty(numberProperty, numbering, styles)) || null,
    indent: readParagraphIndent(el),
  };
}

// numPr (Numbering Definition Instance Reference)
// This element specifies that the current paragraph uses numbering information
// that is defined by a particular numbering definition instance.
function readNumberingProperty(el: OOElement, numbering: Numberings, styles: Styles) {
  const level = el.findValueOf('w:ilvl');
  const numId = el.findValueOf('w:numId');
  if (level === null || numId === null) return null;
  return findLevel(numId, level, numbering, styles);
}

// rPr (Run Properties for the Paragraph Mark)
// This element specifies the set of run properties applied to the glyph used to represent
// the physical location of the paragraph mark for this paragraph. This paragraph mark
// being a physical character in the document, can be formatted
// and therefore shall be capable of representing this formatting like any other character in the document
function readTextRunProperty(el: OOElement, styles: Styles) {
  const style = readStyle(el, 'w:rStyle', styles);
  return {
    type: 'RunProperty',
    styleId: (style && style.styleId) || null,
    styleName: (style && style.name) || null,
    verticalAlignment: el.findValueOf('w:vertAlign'),
    font: el.findValueOf('w:rFonts'),
    color: el.findValueOf('w:color'),
    isBold: toBoolean(el.findValueOf('w:b')),
    isUnderline: toBoolean(el.findValueOf('w:u')),
    isItalic: toBoolean(el.findValueOf('w:i')),
    isStrikethrough: toBoolean(el.findValueOf('w:strike')),
    isSmallCaps: toBoolean(el.findValueOf('w:smallCaps')),
  };
}

// ind (Paragraph Indentation)
// This element specifies the set of indentation properties applied to the current paragraph.
function readParagraphIndent(el: OOElement) {
  const indent = el.first('w:ind');
  if (indent) return null;
  return {
    start: el.attributes['w:start'] || el.attributes['w:left'],
    end: el.attributes['w:end'] || el.attributes['w:right'],
    firstLine: el.attributes['w:firstLine'],
    hanging: el.attributes['w:hanging'],
  };
}

function toBoolean(v: string | null) {
  return !!v && v !== 'false' && v !== '0';
}

function readText(el: OOElement): Text {
  return { type: 'Text', value: el.text() };
}

// r (Text Run)
// This element specifies a run of content in the parent field, hyperlink,
// custom XML element, structured document tag, smart tag, or paragraph.
function readTextRun(el: OOElement, numbering: Numberings, styles: Styles): Run {
  const children = el.children.map(child => readElement(child, numbering, styles));
  const index = children.findIndex(c => (c && c.type) === 'RunProperty');
  const property = children[index] as RunProperty;
  children.splice(index, 1);
  return { ...property, type: 'Run', children };
}

function readStyle(el: OOElement, styleName: string, styles: Styles): Style | null {
  const styleEl = el.first(styleName);
  if (!styleEl) return null;
  const styleId = styleEl.attributes['w:val'];
  if (!styleId) return null;
  const style = styles[styleId];
  if (!style) return null;
  return style;
}
