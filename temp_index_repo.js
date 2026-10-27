const ctx = require('context-mode');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve('.');

function shouldIndex(file) {
  const rel = path.relative(repoRoot, file);
  const parts = rel.split(path.sep);
  for (const part of parts) {
    if (['node_modules', 'dist', 'build', 'coverage', '.git'].includes(part)) return false;
  }
  const ext = path.extname(rel).toLowerCase();
  const priorityFiles = ['package.json', 'tsconfig.json', 'opencode.json', 'AGENTS.md', 'README.md'];
  const isPriority = parts[0] === 'src' || parts[0] === 'docs' || priorityFiles.includes(path.basename(rel));
  const isTargetExt = ['.ts', '.tsx', '.js', '.jsx', '.json', '.md'].includes(ext);
  if (isPriority) return true;
  if (isTargetExt) return true;
  return false;
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (shouldIndex(full)) {
      const content = fs.readFileSync(full, 'utf8');
      ctx.ctx_index({ content, source: full });
      console.log('Indexed', full);
    }
  }
}

walk(repoRoot);
console.log('Indexing done');