// Static privacy gate for DiDi source, documentation, generated reports, and local evidence.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../../../../..');
const APP = path.join(REPO, 'trial_apps/mobilegym/apps/Didi');
const DOCS = path.join(REPO, 'docs/didi-replication');
const failures = [];

function filesUnder(root, extensions) {
  const files = [];
  if (!fs.existsSync(root)) return files;
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...filesUnder(target, extensions));
    else if (extensions.has(path.extname(entry.name))) files.push(target);
  }
  return files;
}

function checkTextFiles() {
  const files = [
    ...filesUnder(APP, new Set(['.ts', '.tsx', '.json', '.py', '.mjs', '.md'])),
    ...filesUnder(DOCS, new Set(['.md', '.json', '.html', '.py'])),
  ];
  const validChinesePlate = /[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼][A-Z][A-Z0-9]{5,6}/g;
  const fullPhone = /(?<!\d)(?:\+?86[- ]?)?1[3-9]\d{9}(?!\d)/g;
  const secret = /(?:AIza[0-9A-Za-z_-]{30,}|sk-[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/g;

  for (const file of files) {
    if (file.endsWith('privacy_regression.mjs')) continue;
    const source = fs.readFileSync(file, 'utf8');
    for (const [label, pattern] of [
      ['valid-format Chinese plate', validChinesePlate],
      ['full phone number', fullPhone],
      ['hard-coded credential', secret],
    ]) {
      pattern.lastIndex = 0;
      if (pattern.test(source)) failures.push(`${label}: ${path.relative(REPO, file)}`);
    }
  }

  for (const report of [
    path.join(DOCS, 'review.html'),
    path.join(DOCS, 'visual-diff/index.html'),
  ]) {
    const html = fs.readFileSync(report, 'utf8');
    if (html.includes('didi_images/evidence')) {
      failures.push(`raw evidence reference remains: ${path.relative(REPO, report)}`);
    }
    if (!html.includes('data-privacy-sanitized="true"')) {
      failures.push(`privacy marker missing: ${path.relative(REPO, report)}`);
    }
  }
}

function checkSeedData() {
  const defaults = JSON.parse(fs.readFileSync(path.join(APP, 'data/defaults.json'), 'utf8'));
  if (defaults.user.name !== '演示乘客' || defaults.user.phone !== '1**********') {
    failures.push('seed user is not explicitly synthetic');
  }
  for (const [index, chat] of defaults.driverChats.entries()) {
    if (!/^演示司机\d{2}$/.test(chat.driver) || !/^测试·A\d{3}$/.test(chat.plate)) {
      failures.push(`driverChats[${index}] is not explicitly synthetic`);
    }
  }
}

function checkPermissions() {
  const privateTargets = [path.join(REPO, '.env')];
  const sourceRoot = path.join(REPO, 'didi_images');
  if (fs.existsSync(sourceRoot)) {
    privateTargets.push(sourceRoot);
    const visit = (root) => {
      for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
        const target = path.join(root, entry.name);
        privateTargets.push(target);
        if (entry.isDirectory()) visit(target);
      }
    };
    visit(sourceRoot);
  }

  for (const target of privateTargets) {
    if (!fs.existsSync(target)) continue;
    const mode = fs.lstatSync(target).mode & 0o777;
    if ((mode & 0o077) !== 0) {
      failures.push(`private path is group/world accessible: ${path.relative(REPO, target)} (${mode.toString(8)})`);
    }
  }
}

checkTextFiles();
checkSeedData();
checkPermissions();

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('DiDi privacy regression passed.');
