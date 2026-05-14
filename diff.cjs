const fs = require('fs');
const diff = require('diff');

const file1 = process.argv[2];
const file2 = process.argv[3];

const content1 = fs.readFileSync(file1, 'utf8');
const content2 = fs.readFileSync(file2, 'utf8');

const differences = diff.diffLines(content1, content2);

differences.forEach((part) => {
  if (part.added) {
    console.log('\x1b[32m%s\x1b[0m', '+ ' + part.value);
  } else if (part.removed) {
    console.log('\x1b[31m%s\x1b[0m', '- ' + part.value);
  }
});
