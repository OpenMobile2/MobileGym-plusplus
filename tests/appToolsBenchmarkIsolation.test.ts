import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

describe('App Tools benchmark isolation', () => {
  it('loads only passive definitions at production bootstrap', () => {
    const source = fs.readFileSync(path.join(root, 'app_tools/bootstrap.ts'), 'utf8');
    const staticAppImports = source
      .split('\n')
      .filter((line) => line.startsWith('import ') && line.includes("from './apps/"));

    expect(staticAppImports).toHaveLength(19);
    expect(staticAppImports.every((line) => line.includes('/definitions'))).toBe(true);
    expect(source.match(/await import\('\.\/apps\//g)).toHaveLength(19);
    expect(source).not.toMatch(/import \{ register\w+Tools \}/);
  });

  it('does not import the browser smoke validator from the production entry', () => {
    const entry = fs.readFileSync(path.join(root, 'index.tsx'), 'utf8');
    expect(entry).toContain("import './app_tools/bootstrap';");
    expect(entry).not.toContain('browser_smoke');
  });
});
