// Run: node scripts/compile.test.js "<developer tools>/code/package.nw/node_modules/wcc-exec"
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const compilerDir = process.argv[2];
if (!compilerDir) throw new Error('请提供包含 wcc.exe 和 wcsc.exe 的目录');
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(item => {
    const file = path.join(dir, item.name);
    return item.isDirectory() ? walk(file) : [file];
  });
}
const files = walk(root);
for (const [compiler, extension] of [['wcc', '.wxml'], ['wcsc', '.wxss']]) {
  const inputs = files.filter(file => file.endsWith(extension));
  const args = compiler === 'wcsc' ? ['-pc', String(inputs.length), ...inputs] : inputs;
  const result = spawnSync(path.join(compilerDir, compiler + '.exe'), args, {
    cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, windowsHide: true
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || '编译失败');
  console.log(`PASS: ${compiler} compiled ${inputs.length} ${extension} files`);
}
