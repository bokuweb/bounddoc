import { convert } from './';
import { readFileSync } from 'fs';

// const buf = readFileSync('./fixtures/word-import_issue1.docx');
const buf = readFileSync('../../../../Desktop/gc.docx');
convert(buf);
