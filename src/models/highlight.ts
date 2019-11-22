import { OOElement } from '../xml/nodes';

export type Highlight = {
  color: string;
};

export function createHighlight(el: OOElement): Highlight | null {
  const val = el.findValueOf('w:highlight') || null;
  if (!val) return null;
  return {
    color: val,
  };
}
