import sax from 'sax';
import { OOElement } from './nodes';

const nodes = require('./nodes');

export function parseXML(xml: string, namespaceMap: { [key: string]: string } = {}): Promise<Node> {
  return new Promise((resolve, reject) => {
    let finished = false;
    let parser = sax.parser(true, { xmlns: true, position: false });

    const rootElement = { children: [] };
    const stack: OOElement[] = [];
    let currentElement: any = rootElement;

    parser.onopentag = function(node) {
      const attributes = mapObject(
        node.attributes,
        (attribute: sax.QualifiedAttribute) => {
          return attribute.value;
        },
        mapName,
      );
      const element = new OOElement(mapName(node as any), 'element', '', attributes, []);
      currentElement.children.push(element);
      stack.push(currentElement);
      currentElement = element;
    };

    function mapName(node: { [key: string]: string }) {
      if (node.uri) {
        let mappedPrefix = namespaceMap[node.uri];
        let prefix;
        if (mappedPrefix) {
          prefix = mappedPrefix + ':';
        } else {
          prefix = '{' + node.uri + '}';
        }
        return prefix + node.local;
      } else {
        return node.local;
      }
    }

    parser.onclosetag = function(node) {
      currentElement = stack.pop();
    };

    parser.ontext = function(text) {
      if (currentElement !== rootElement) {
        currentElement.children.push(nodes.createTextNode(text));
      }
    };

    parser.onend = function() {
      if (!finished) {
        finished = true;
        resolve(rootElement.children[0]);
      }
    };

    parser.onerror = function(error) {
      if (!finished) {
        finished = true;
        reject(error);
      }
    };

    parser.write(xml).close();
  });
}

function mapObject(
  input: any,
  valueFunc: (attribute: sax.QualifiedAttribute) => string,
  keyFunc: (node: { [key: string]: string }) => string,
) {
  return Object.keys(input).reduce(
    (result, key) => {
      const value = input[key];
      let mappedKey = keyFunc(value);
      result[mappedKey] = valueFunc(value);
      return result;
    },
    {} as { [key: string]: string },
  );
}
