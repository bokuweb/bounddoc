import _ from 'lodash';
import { OOElement } from './xml/nodes';

import { Styles, Style } from './style';
import { Numberings, findLevel, NumberingLevel } from './numbering';

export type NodeType = 'Paragraph' | 'Run' | 'Text';

export type NumberingProperty = { numId: string } & NumberingLevel;

export type ParagraphAttributes = {
  styleId: string | null;
  styleName: string | null;
  alignment: string | null;
  numbering: NumberingProperty | null;
  indent: ReturnType<typeof readParagraphIndent> | null;
  spacing: ReturnType<typeof readSpacingProperty> | null;
};

export type Paragraph = ParagraphAttributes & {
  type: 'Paragraph';
  children: Run[];
};

export type ParagraphProperty = ParagraphAttributes & {
  type: 'ParagraphProperty';
};

export type Run = {
  type: 'Run';
  children: Array<Text | Break>;
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
  hasPict: boolean;
};

export type RunProperty = {
  type: 'RunProperty';
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

export type Tab = {
  type: 'Tab';
};

export type Break = {
  type: 'Break';
  breakType: 'Page' | 'Column' | 'Line';
};

export type Table = {
  type: 'Table';
  children: any[];
};

export type Unknown = {
  type: 'Unknown';
};

export type Result = Paragraph | Run | Text | Tab | Break | Table | Unknown;

export function readElement(el: OOElement, numbering: Numberings | null, styles: Styles | null): Result {
  if (el.type !== 'element') return { type: 'Unknown' };
  return handleElement(el, numbering, styles);
}

function handleElement(el: OOElement, numbering: Numberings | null, styles: Styles | null): Result {
  switch (el.name) {
    case 'w:p':
      return readParagraph(el, numbering, styles);
    case 'w:t':
      return readText(el);
    case 'w:tab':
      return readTab(el);
    case 'w:br':
      return readBreak(el);
    case 'w:r':
      return readTextRun(el, numbering, styles);
    case 'w:tbl':
      return { type: 'Table', children: [] };
    default:
      console.warn(`unhandled element name ${el.name} detected.`);
      return { type: 'Unknown' };
  }
}

function handlePropertyElement(el: OOElement, numbering: Numberings | null, styles: Styles | null) {
  switch (el.name) {
    case 'w:pPr':
      return readParagraphProperty(el, numbering, styles);
    case 'w:rPr':
      return readTextRunProperty(el, styles);
    default:
      return handleElement(el, numbering, styles);
  }
}

// p (Paragraph)
// This element specifies a paragraph of content in the document.
// The contents of a paragraph in a WordprocessingML document shall consist of any combination of the following four kinds of content:
// - Paragraph properties
// - Annotations (bookmarks, comments, revisions)
// - Custom markup
// - Run level content (fields, hyperlinks, runs)
function readParagraph(el: OOElement, numbering: Numberings | null, styles: Styles | null): Paragraph {
  const children = el.children.map(child => handlePropertyElement(child, numbering, styles));
  const index = children.findIndex(c => (c && c.type) === 'ParagraphProperty');
  const property = children[index] as ParagraphProperty;
  if (index > 0) {
    children.splice(index, 1);
  }
  return { ...property, type: 'Paragraph', children: children as Run[] };
}

// pPr (Paragraph Properties)
// This element specifies a paragraph of content in the document.
// The contents of a paragraph in a WordprocessingML document shall consist of any combination of the following four kinds of content:
// - Paragraph properties
// - Annotations (bookmarks, comments, revisions)
// - Custom markup
// - Run level content (fields, hyperlinks, runs)
function readParagraphProperty(el: OOElement, numbering: Numberings | null, styles: Styles | null): ParagraphProperty {
  const style = readStyle(el, 'w:pStyle', styles);
  const numberPropertyEl = el.first('w:numPr');
  const spacingEl = el.first('w:spacing');
  const styleId = (style && style.styleId) || null;
  const styleName = (style && style.name) || null;
  let num = numberPropertyEl ? readNumberingProperty(numberPropertyEl, numbering, styles) : null;
  if (num === null && styleId && numbering) {
    // Try to find numbering from styleId
    // See, https://github.com/mwilliamson/mammoth.js/pull/184
    num = findNumberingByStyleId(numbering, styleId);
  }
  return {
    type: 'ParagraphProperty',
    styleId,
    styleName,
    alignment: el.findValueOf('w:jc') || null,
    numbering: num,
    indent: readParagraphIndent(el),
    spacing: spacingEl ? readSpacingProperty(spacingEl) : null,
  };
}

function findNumberingByStyleId(numbering: Numberings, styleId: string) {
  for (const id of Object.keys(numbering.abstractNums)) {
    for (const level of Object.keys(numbering.abstractNums[id].levels)) {
      if (numbering.abstractNums[id].levels[level].pStyle === styleId) {
        const num = numbering.abstractNums[id].levels[level];
        return { numId: '', ...num };
      }
    }
  }
  return null;
}

// numPr (Numbering Definition Instance Reference)
// This element specifies that the current paragraph uses numbering information
// that is defined by a particular numbering definition instance.
function readNumberingProperty(el: OOElement, numbering: Numberings | null, styles: Styles | null) {
  if (!numbering) return null;
  const level = el.findValueOf('w:ilvl');
  const numId = el.findValueOf('w:numId');
  if (level === null || numId === null) return null;
  const found = findLevel(numId, level, numbering, styles);
  if (!found) return null;
  return { numId, ...found };
}

// spacing (Spacing Between Lines and Above/Below Paragraph)
// This element specifies the inter-line and inter-paragraph spacing
// which shall be applied to the contents of this paragraph when it is displayed by a consumer.
function readSpacingProperty(el: OOElement) {
  return {
    after: el.attributes['w:after'],
    afterAutospacing: el.attributes['w:afterAutospacing'],
    afterLines: el.attributes['w:afterLines'],
    before: el.attributes['w:before'],
    beforeAutospacing: el.attributes['w:beforeAutospacing'],
    line: el.attributes['w:line'],
    lineRule: el.attributes['w:lineRule'],
    beforeLines: el.attributes['w:beforeLines'],
  };
}

// rPr (Run Properties for the Paragraph Mark)
// This element specifies the set of run properties applied to the glyph used to represent
// the physical location of the paragraph mark for this paragraph. This paragraph mark
// being a physical character in the document, can be formatted
// and therefore shall be capable of representing this formatting like any other character in the document
function readTextRunProperty(el: OOElement, styles: Styles | null) {
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
  if (!indent) return null;
  return {
    start: indent.attributes['w:start'] || indent.attributes['w:left'],
    end: indent.attributes['w:end'] || indent.attributes['w:right'],
    firstLine: indent.attributes['w:firstLine'],
    hanging: indent.attributes['w:hanging'],
  };
}

function toBoolean(v: string | null) {
  return !!v && v !== 'false' && v !== '0';
}

// This element specifies that this run contains literal text which shall be displayed in the document. The t element shall be used for all text runs which are not:
// Part of a region of text that is contained in a deleted region using the del element (§17.13.5.14)
// Part of a region of text that is contained within a field code
function readText(el: OOElement): Text {
  return { type: 'Text', value: el.text() };
}

//This element specifies a single custom tab stop defined within a set of paragraph properties in a document.
// A tab stop location shall always be measured relative to the leading edge of the paragraph in which it is used
// (that is, the left edge for a left-to-right paragraph, and the right edge for a right-to-left paragraph).
function readTab(el: OOElement): Tab {
  return { type: 'Tab' };
}

// br (Break)
// This element specifies that a break shall be placed at the current location in the run content.
// A break is a special character which is used to override the normal line breaking that would be performed
// based on the normal layout of the document’s contents.
function readBreak(el: OOElement): Break {
  const breakType = el.attributes['w:type'];
  if (breakType === 'page') {
    return { type: 'Break', breakType: 'Page' };
  } else if (breakType === 'column') {
    return { type: 'Break', breakType: 'Column' };
  } else {
    return { type: 'Break', breakType: 'Line' };
  }
}

// r (Text Run)
// This element specifies a run of content in the parent field, hyperlink,
// custom XML element, structured document tag, smart tag, or paragraph.
function readTextRun(el: OOElement, numbering: Numberings | null, styles: Styles | null): Run {
  const children = el.children.map(child => handlePropertyElement(child, numbering, styles));
  const index = children.findIndex(c => (c && c.type) === 'RunProperty');
  const property = children[index] as RunProperty;
  const hasPict = !!el.attributes['w:pict'];
  if (index > 0) {
    children.splice(index, 1);
  }
  return { ...property, type: 'Run', children: children as Array<Break | Text>, hasPict };
}

function readStyle(el: OOElement, styleName: string, styles: Styles | null): Style | null {
  const styleEl = el.first(styleName);
  if (!styleEl) return null;
  const styleId = styleEl.attributes['w:val'];
  if (!styleId) return null;
  const style = styles && styles[styleId];
  if (!style) return null;
  return style;
}
