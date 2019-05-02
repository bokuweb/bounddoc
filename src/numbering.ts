import * as zip from './zip';
import { xmlFileReader } from './xml-reader';
import { OOElement } from './xml/nodes';
import { Styles } from './style';

export async function readNumberings(file: zip.Zip, path: string): Promise<Numberings | null> {
  const element = await xmlFileReader(file, path);
  if (!element) return null;
  const n = readNumberingsXML(element);
  return n;
}

export type Numberings = {
  nums: NumIds;
  abstractNums: AbstractNums;
};

// See ECMA-376 p691~
function readNumberingsXML(el: OOElement): Numberings {
  const abstractNums = readAbstractNums(el);
  const nums = readNums(el);
  return { nums, abstractNums };
}

export type NumIds = {
  [key: string]: { abstractNumId: string };
};

function readNums(el: OOElement): NumIds {
  return el.getElementsByTagName('w:num').reduce(
    (acc: NumIds, el: OOElement) => {
      const numId = el.attributes['w:numId'];
      const a = el.first('w:abstractNumId');
      const abstractNumId = (a && a.attributes['w:val']) || '';
      acc[numId] = { abstractNumId };
      return acc;
    },
    {} as NumIds,
  );
}

export type NumberingLevel = {
  numFmt: string;
  lvlText: string;
  lvlJc: string;
  pStyle: string;
  level: string;
};

export type Levels = {
  [key: string]: NumberingLevel;
};

export type AbstractNums = {
  [key: string]: {
    levels: Levels;
    numStyleLink: string | null;
  };
};

function readAbstractNums(el: OOElement) {
  return el.getElementsByTagName('w:abstractNum').reduce(
    (acc: AbstractNums, element: OOElement) => {
      const id = element.attributes['w:abstractNumId'];
      acc[id] = readAbstractNum(element);
      return acc;
    },
    {} as AbstractNums,
  );
}

function readAbstractNum(el: OOElement) {
  const levels = el.getElementsByTagName('w:lvl').reduce(
    (acc: Levels, el: OOElement) => {
      const numFmt = el.findValueOf('w:numFmt') || '';
      const lvlText = el.findValueOf('w:lvlText') || '';
      const lvlJc = el.findValueOf('w:lvlJc') || '';
      const pStyle = el.findValueOf('w:pStyle') || '';
      const level = el.attributes['w:ilvl'];
      acc[level] = { numFmt, lvlText, pStyle, level, lvlJc };
      return acc;
    },
    {} as Levels,
  );
  const link = el.first('w:numStyleLink');
  const numStyleLink = (link && link.attributes['w:val']) || '';
  return { levels, numStyleLink };
}

export function findLevel(numId: string, level: string, numbering: Numberings, styles: Styles | null) {
  const num = numbering.nums[numId];
  if (!num) return null;
  const abstractNum = numbering.abstractNums[num.abstractNumId];
  if (!abstractNum) return null;
  return abstractNum.levels[level];
  // if (!abstractNum.numStyleLink) return this.abstractNums[num.abstractNumId].levels[level];
  // const style = this.styles[abstractNum.numStyleLink];
  // return this.findLevel(style.numId, level);
}
