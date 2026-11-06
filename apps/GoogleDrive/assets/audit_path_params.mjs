// 审计：每个 bindTap/bindLongPress 绑定点是否给足了目标路由的路径参数。
//
// 缺参数时 go() 会抛 Missing param "x" for path "..."，表现为「点了毫无反应」——
// 而声明一致性检查只比对 ID 是否对得上，不看参数，这类问题它查不出来。
// 用法：node apps/GoogleDrive/assets/audit_path_params.mjs
import fs from 'node:fs';
import path from 'node:path';

const APP_DIR = path.resolve(import.meta.dirname, '..');
const decl = fs.readFileSync(path.join(APP_DIR, 'navigation.declaration.ts'), 'utf8');

// 从声明里抽出 id → to
const toById = new Map();
for (const m of decl.matchAll(/\{ id: '([^']+)',\s*\n\s*from:[\s\S]*?to: '([^']+)'/g)) {
  toById.set(m[1], m[2]);
}

const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'assets') walk(p); }
    else if (/\.tsx?$/.test(e.name) && !e.name.endsWith('navigation.declaration.ts')) files.push(p);
  }
})(APP_DIR);

const problems = [];
const dynamic = [];
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const lines = src.split('\n');
  for (const m of src.matchAll(/bind(?:Tap|LongPress|DoubleTap)\(\s*'([^']+)'\s*(,\s*\{([\s\S]*?)\})?\s*\)/g)) {
    const [, id, , optsRaw] = m;
    if (id === 'system.back') continue;
    const to = toById.get(id);
    if (!to) continue;
    const needed = [...to.matchAll(/:(\w+)/g)].map(x => x[1]);
    if (needed.length === 0) continue;

    const opts = optsRaw ?? '';
    const line = src.slice(0, m.index).split('\n').length;
    const at = { file: path.relative(APP_DIR, file), line, id, to, code: lines[line - 1].trim().slice(0, 90) };

    // params 传的是变量或简写（{ params } / params: someVar）时无法静态判定
    const paramsLiteral = /params\s*:\s*\{([\s\S]*?)\}/.exec(opts);
    const paramsDynamic = /\bparams\b/.test(opts) && !paramsLiteral;
    if (paramsDynamic) { dynamic.push(at); continue; }

    const inner = paramsLiteral?.[1] ?? '';
    const missing = needed.filter(k => !new RegExp(`\\b${k}\\b\\s*[,:}]|\\b${k}\\b\\s*$`).test(inner));
    if (missing.length) problems.push({ ...at, missing });
  }
}

console.log(`扫描 ${files.length} 个文件，声明里 ${toById.size} 条 transition`);
if (dynamic.length) {
  console.log(`\nℹ ${dynamic.length} 处用变量传参，需人工确认（当前均由 useCurrentPathParams() 提供 :id）：`);
  for (const d of dynamic) console.log(`  ${d.file}:${d.line}  ${d.id} → ${d.to}`);
}
if (!problems.length) {
  console.log('\n✅ 字面量传参的绑定点都给足了路径参数');
  process.exit(0);
}
console.log(`\n❌ ${problems.length} 处缺少路径参数：`);
for (const p of problems) {
  console.log(`  ${p.file}:${p.line}  ${p.id} → ${p.to}  缺 ${p.missing.join(',')}`);
  console.log(`      ${p.code}`);
}
process.exit(1);
