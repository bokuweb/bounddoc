import { convert } from './';
import { readFileSync } from 'fs';

// const buf = readFileSync('./fixtures/word-import_issue1.docx');
const buf = readFileSync('../../../../Desktop/word-import#2.docx');
convert(buf);

