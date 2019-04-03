import * as zip from './zip';
import { xmlFileReader } from './xml-reader';

const fallbackContentTypes = {
  png: 'png',
  gif: 'gif',
  jpeg: 'jpeg',
  jpg: 'jpeg',
  tif: 'tiff',
  tiff: 'tiff',
  bmp: 'bmp',
};

export async function readContentTypes(file: zip.Zip) {
  const elements = await xmlFileReader(file, '[Content_Types].xml');
  const extensionDefaults: { [key: string]: string } = {};
  const overrides: { [key: string]: string } = {};
  elements.children.forEach(child => {
    if (child.name === 'content-types:Default') {
      extensionDefaults[child.attributes.Extension] = child.attributes.ContentType;
    }
    if (child.name === 'content-types:Override') {
      let name = child.attributes.PartName;
      if (name.charAt(0) === '/') {
        name = name.substring(1);
      }
      overrides[name] = child.attributes.ContentType;
    }
  });
  return { overrides, extensionDefaults };
}
