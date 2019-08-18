import { OOElement } from '../xml/nodes';

export type Indent = Record<'start' | 'end' | 'firstLine' | 'hanging', string | null>;

// ind (Paragraph Indentation)
// This element specifies the set of indentation properties applied to the current paragraph.
export function createParagraphIndent(el: OOElement): Indent | null {
  const indent = el.first('w:ind');
  if (!indent) return null;
  return {
    start: indent.attributes['w:start'] || indent.attributes['w:left'] || null,
    end: indent.attributes['w:end'] || indent.attributes['w:right'] || null,
    firstLine: indent.attributes['w:firstLine'] || null,
    hanging: indent.attributes['w:hanging'] || null,
  };
}
