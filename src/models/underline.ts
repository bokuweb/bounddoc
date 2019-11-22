import { OOElement } from '../xml/nodes';

export type Underline = {
  type: string;
};

export function createUnderline(el: OOElement): Underline | null {
  const val = el.findValueOf('w:u') || null;
  if (!val) return null;
  return {
    type: val,
  };
}
