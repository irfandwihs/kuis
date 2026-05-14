const fs = require('fs');
fs.copyFileSync('repo_clone/app/room/siswa/[roomCode]/page.tsx', 'app/room/siswa/[roomCode]/page.tsx');
fs.copyFileSync('repo_clone/app/guru/page.tsx', 'app/guru/page.tsx');
fs.copyFileSync('repo_clone/app/siswa/page.tsx', 'app/siswa/page.tsx');
fs.copyFileSync('repo_clone/contexts/AuthContext.tsx', 'contexts/AuthContext.tsx');
console.log('Files copied successfully');
