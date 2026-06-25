#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const root = join(process.cwd(), 'apps');
const errors = [];
const warnings = [];

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) {
      out.push(...walk(p));
    } else {
      out.push(p);
    }
  }
  return out;
}

const files = walk(root).filter((f) => /\.(ts|tsx|js|jsx)$/.test(f));

const secretPatterns = [
  /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/i,
  /secret\s*[:=]\s*['"][^'"]+['"]/i,
  /token\s*[:=]\s*['"][^'"]+['"]/i,
  /password\s*[:=]\s*['"][^'"]+['"]/i,
];

for (const file of files) {
  const c = readFileSync(file, 'utf-8');

  if (/dangerouslySetInnerHTML/.test(c) && !/DOMPurify/.test(c)) {
    errors.push(`${file}: dangerouslySetInnerHTML without DOMPurify`);
  }
  if (/localStorage\.(setItem|getItem)/.test(c) && /token|accessToken|idToken/i.test(c)) {
    errors.push(`${file}: token usage in localStorage`);
  }
  if (/\bfetch\(/.test(c) && /apps\/tenant-ksa/.test(file.replace(/\\/g, '/'))) {
    warnings.push(`${file}: raw fetch in tenant app`);
  }
  if (/console\.log\(/.test(c) && /token|password|secret/i.test(c)) {
    errors.push(`${file}: possible sensitive logging`);
  }
  for (const p of secretPatterns) {
    if (p.test(c)) {
      warnings.push(`${file}: potential hardcoded credential pattern`);
      break;
    }
  }
}

console.log('== security-review validate ==');
if (errors.length) {
  console.log('BLOCKERS');
  errors.forEach((e) => console.log(`- ${e}`));
}
if (warnings.length) {
  console.log('WARNINGS');
  warnings.forEach((w) => console.log(`- ${w}`));
}
if (!errors.length && !warnings.length) {
  console.log('PASSED');
}
process.exit(errors.length ? 1 : 0);
