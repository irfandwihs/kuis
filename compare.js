const fs = require('fs');
const path = require('path');

function getFiles(dir, fileList = [], baseDir = dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (!['node_modules', '.git', '.next', 'repo_clone'].includes(file)) {
        getFiles(fullPath, fileList, baseDir);
      }
    } else {
      fileList.push(fullPath.replace(baseDir + '/', ''));
    }
  }
  return fileList;
}

const repoFiles = getFiles('/repo_clone');
const appFiles = getFiles('/');

const repoMap = new Map(repoFiles.map(f => [f, path.join('/repo_clone', f)]));
const appMap = new Map(appFiles.map(f => [f, path.join('/', f)]));

const changedFiles = [];
const newFiles = [];

for (const [relPath, repoPath] of repoMap.entries()) {
  if (appMap.has(relPath)) {
    const repoContent = fs.readFileSync(repoPath, 'utf8');
    const appContent = fs.readFileSync(appMap.get(relPath), 'utf8');
    if (repoContent !== appContent) {
      changedFiles.push(relPath);
    }
  } else {
    newFiles.push(relPath);
  }
}

console.log("Changed files:");
console.log(changedFiles.join('\n'));
console.log("\nNew files:");
console.log(newFiles.join('\n'));
