// Verify that DiDi's frozen spec and executable transition/action IDs stay in sync.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(HERE, '..');
const MOBILEGYM = path.resolve(APP, '../..');
const SPEC_PATH = path.resolve(APP, '../../../../docs/didi-replication/spec.json');
const spec = JSON.parse(fs.readFileSync(SPEC_PATH, 'utf8'));

const platformChecker = spawnSync(
  process.execPath,
  ['scripts/check_navigation_declaration_consistency.mjs', 'Didi', '--actions'],
  { cwd: MOBILEGYM, encoding: 'utf8' },
);
if (platformChecker.stdout) process.stdout.write(platformChecker.stdout);
if (platformChecker.stderr) process.stderr.write(platformChecker.stderr);
if (platformChecker.status !== 0) process.exit(platformChecker.status ?? 1);

const declaredTransitions = new Set();
const declaredActions = new Set();
for (const node of [...(spec.chrome ?? []), ...(spec.nodes ?? [])]) {
  for (const interaction of node.interactions ?? []) {
    if (interaction.effect === 'nav' && interaction.transitionId !== 'system.back') {
      declaredTransitions.add(interaction.transitionId);
    }
    if (interaction.effect === 'state') declaredActions.add(interaction.actionId);
  }
}

function sourceFiles(root) {
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'assets') files.push(...sourceFiles(target));
      continue;
    }
    if (
      (target.endsWith('.ts') || target.endsWith('.tsx'))
      && !target.endsWith('navigation.declaration.ts')
      && !target.endsWith('routes.generated.tsx')
    ) {
      files.push(target);
    }
  }
  return files;
}

const usedTransitions = new Set();
const usedActions = new Set();
for (const file of sourceFiles(APP)) {
  const source = fs.readFileSync(file, 'utf8');
  for (const pattern of [
    /\bbindTap(?:<[^>]+>)?\(\s*['"]([^'"]+)['"]/g,
    /\bgo\(\s*['"]([^'"]+)['"]/g,
    /data-trigger=["']([^"']+)["']/g,
  ]) {
    for (const match of source.matchAll(pattern)) {
      if (match[1] !== 'system.back') usedTransitions.add(match[1]);
    }
  }
  for (const pattern of [
    /kind:\s*['"]action['"]\s*,\s*id:\s*['"]([^'"]+)['"]/g,
    /data-action=["']([^"']+)["']/g,
  ]) {
    for (const match of source.matchAll(pattern)) usedActions.add(match[1]);
  }
  for (const match of source.matchAll(
    /kind:\s*['"]action['"]\s*,\s*id:\s*[^?\n]+\?\s*['"]([^'"]+)['"]\s*:\s*['"]([^'"]+)['"]/g,
  )) {
    usedActions.add(match[1]);
    usedActions.add(match[2]);
  }
}

const difference = (left, right) => [...left].filter((id) => !right.has(id)).sort();
const report = {
  specVersion: spec.specVersion,
  transitionsDeclared: declaredTransitions.size,
  transitionsUsedInCode: usedTransitions.size,
  missingTransitions: difference(usedTransitions, declaredTransitions),
  unusedTransitions: difference(declaredTransitions, usedTransitions),
  actionsDeclared: declaredActions.size,
  actionsUsedInCode: usedActions.size,
  missingActions: difference(usedActions, declaredActions),
  unusedActions: difference(declaredActions, usedActions),
};

console.log(JSON.stringify(report, null, 2));
if (
  report.missingTransitions.length
  || report.unusedTransitions.length
  || report.missingActions.length
  || report.unusedActions.length
) {
  process.exit(1);
}
