import * as zip from './zip';
import { xmlFileReader } from './xml-reader';
import { OOElement } from './xml/nodes';

export async function readStyles(file: zip.Zip, path: string) {
  const element = await xmlFileReader(file, path);
  if (!element) return null;
  return readStylesXml(element);
}

// See ECMA-376 p644
// type (Style Type)
// Specifies the type of style definition defined by this element.
// WordprocessingML supports six types of style definitions:
// Paragraph styles
// Character styles
// Table styles
// Numbering styles
// Linked styles (paragraph + character)
// Default paragraph + character properties
//
// [Example: Consider a style defined as follows:
//     <w:style w:type="paragraph" ... > <w:name w:val="My Paragraph Style"/> <w:rPr>
//           <w:b/>
//         </w:rPr>
//     </w:style>
//
export type StyleType = 'character' | 'paragraph' | 'table' | 'numbering' | 'linked' | 'none';

export type Style = {
  type: StyleType;
  styleId: string;
  name: string;
  property: {
    alignment: string | null;
  };
};

export type Styles = {
  [key: string]: Style;
};

function readStylesXml(el: OOElement): Styles {
  return el.getElementsByTagName('w:style').reduce(
    (acc: Styles, el: OOElement) => {
      const style = readStyleElement(el);
      acc[style.styleId] = style;
      return acc;
    },
    {} as Styles,
  );
}

function readStyleElement(styleElement: OOElement) {
  const type = (styleElement.attributes['w:type'] || 'none') as StyleType;
  const styleId = styleElement.attributes['w:styleId'];
  const name = styleName(styleElement);
  const pPr = styleElement.first('w:pPr');
  let alignment: string | null = null;
  if (pPr) {
    alignment = pPr.findValueOf('w:jc') || null;
  }
  return {
    type,
    styleId,
    name,
    property: {
      alignment,
    },
  };
}

function styleName(styleElement: OOElement) {
  const nameElement = styleElement.first('w:name');
  return nameElement ? nameElement.attributes['w:val'] : '';
}

// function readNumberingStyleElement(styleElement: OOElement) {
//   var numId = styleElement
//     .firstOrEmpty('w:pPr')
//     .firstOrEmpty('w:numPr')
//     .firstOrEmpty('w:numId').attributes['w:val'];
//   return { numId: numId };
// }
