const fs = require('fs');
const path = require('path');

function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      if (!['node_modules', '.git', '.next'].includes(file)) {
        getFiles(path.join(dir, file), fileList);
      }
    } else {
      fileList.push(path.join(dir, file));
    }
  }
  return fileList;
}

const repoFiles = getFiles('/tmp/kuis_repo');
const appFiles = getFiles('/app/applet');

const repoMap = new Map(repoFiles.map(f => [f.replace('/tmp/kuis_repo/', ''), f]));
const appMap = new Map(appFiles.map(f => [f.replace('/app/applet/', ''), f]));

const changedFiles = [];
for (const [relPath, repoPath] of repoMap.entries()) {
  if (appMap.has(relPath)) {
    const repoContent = fs.readFileSync(repoPath, 'utf8');
    const appContent = fs.readFileSync(appMap.get(relPath), 'utf8');
    if (repoContent !== appContent) {
      changedFiles.push(relPath);
    }
  } else {
    changedFiles.push(relPath); // New file
  }
}

console.log("Changed/New files in repo:");
console.log(changedFiles.join('\n'));
