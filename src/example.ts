import { convert } from './';
import { readFileSync } from 'fs';

const buf = readFileSync('./fixtures/example.docx');
convert(buf);

