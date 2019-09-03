import flatten from 'lodash/flatten';
import extend from 'lodash/extend';

export type Attribute = {
  [key: string]: string;
};

export class OOElement {
  type: 'element' | 'text' = 'element';
  name: string;
  value = '';
  attributes: Attribute = {};
  children: OOElement[] = [];

  constructor(name: string, type: 'element' | 'text', value: string, attributes: Attribute, children: OOElement[]) {
    this.name = name || '';
    this.type = type;
    this.value = value || '';
    this.attributes = attributes || {};
    this.children = children || [];
  }

  first(name: string) {
    return this.children.find(child => child.name === name);
  }

  findValueOf(name: string, valueName = 'w:val') {
    const v = this.first(name);
    if (!v) return null;
    return v.attributes[valueName] || null;
  }

  getElementByTagName(name: string): OOElement | undefined {
    return this.children.find(child => {
      return child.name === name;
    });
  }

  getElementsByTagName(name: string): OOElement[] {
    const elements = this.children.filter(child => {
      return child.name === name;
    });
    return toElementList(elements);
  }

  text() {
    if (this.children.length === 0) {
      return '';
    } else if (this.children.length !== 1 || this.children[0].type !== 'text') {
      throw new Error('Can not find text in this element');
    }
    return (this.children[0] && this.children[0].value) || '';
  }
}

function toElementList(array: any[]) {
  return extend(array, {
    getElementsByTagName: function(name: string): any {
      return toElementList(
        flatten(
          (this as any).map(function(element: OOElement) {
            return element.getElementsByTagName(name);
          }, true),
        ),
      );
    },
  });
}

export function createTextNode(text: string) {
  return new OOElement('', 'text', text, {}, []);
}
