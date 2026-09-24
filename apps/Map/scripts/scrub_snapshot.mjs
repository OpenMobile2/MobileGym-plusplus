#!/usr/bin/env node
/**
 * 一次性清洗 apps/Map/sw/ 下的快照：从 URL 和响应体里抹掉 Google Maps API key。
 *
 * 来源：snapshot_map_assets.mjs 早期版本直接落盘了 puppeteer 抓到的完整 URL
 *      （含 ?key=...）和响应体（Google bootstrap JS 里把 key 烧成字符串常量），
 *      导致 git/disk 上能直接读到真 key。本脚本扫描所有文件，按通用 pattern
 *      AIzaSy[A-Za-z0-9_-]{33} 抹掉所有匹配。
 *
 * 用法：node apps/Map/scripts/scrub_snapshot.mjs
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_DIR = resolve(__dirname, '..');
const SW_DIR = resolve(APP_DIR, 'sw');
const FILES_DIR = resolve(SW_DIR, 'files');
const MANIFEST_PATH = resolve(SW_DIR, 'manifest.json');
const SW_PATH = resolve(SW_DIR, 'map-sw.js');

const KEY_PATTERN = /AIzaSy[A-Za-z0-9_-]{33}/g;
const REDACTED = '';

function stripKeyFromUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    u.searchParams.delete('key');
    return u.toString();
  } catch {
    // 兜底：原文本里手工删除 key=...&
    return rawUrl.replace(/([?&])key=[^&#]*(&?)/, (_, lead, trail) => (trail ? lead : ''));
  }
}

function scrubManifest() {
  if (!(statSync(MANIFEST_PATH, { throwIfNoEntry: false }))) {
    console.log('  manifest.json 不存在，跳过');
    return 0;
  }
  const m = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
  let touched = 0;
  for (const entry of m.entries || []) {
    const before = entry.url;
    entry.url = stripKeyFromUrl(before);
    if (before !== entry.url) touched++;
  }
  writeFileSync(MANIFEST_PATH, JSON.stringify(m, null, 2));
  console.log(`  manifest.json: 抹掉 ${touched} 个 URL 里的 key`);
  return touched;
}

function scrubFile(filePath) {
  // 不要读二进制文件去做 string 替换，否则可能破坏图片/字体。先看几个字节决定。
  const buf = readFileSync(filePath);
  // 简单嗅探：包含 NUL 字节就当作二进制，跳过
  for (let i = 0; i < Math.min(buf.length, 512); i++) {
    if (buf[i] === 0) return 0;
  }
  const text = buf.toString('utf-8');
  let count = 0;
  const cleaned = text.replace(KEY_PATTERN, () => { count++; return REDACTED; });
  if (count > 0) {
    writeFileSync(filePath, cleaned, 'utf-8');
    console.log(`  ${filePath.replace(SW_DIR, 'sw')}: 替换 ${count} 处`);
  }
  return count;
}

function scrubFilesDir() {
  if (!statSync(FILES_DIR, { throwIfNoEntry: false })) {
    console.log('  files/ 不存在，跳过');
    return 0;
  }
  let total = 0;
  for (const name of readdirSync(FILES_DIR)) {
    if (name === '.gitkeep') continue;
    const filePath = resolve(FILES_DIR, name);
    if (!statSync(filePath).isFile()) continue;
    total += scrubFile(filePath);
  }
  return total;
}

function makeSnapshotCacheName(entries) {
  const seed = entries
    .map((entry) => [
      entry.url,
      entry.file,
      entry.status,
      entry.size,
      entry.bodyHash,
    ].join('\t'))
    .join('\n');
  const hash = createHash('sha1').update(seed).digest('hex').slice(0, 12);
  return `map-cache-${hash}`;
}

function updateMapSwCacheName(cacheName) {
  if (!statSync(SW_PATH, { throwIfNoEntry: false })) {
    console.log('  map-sw.js 不存在，跳过 CACHE_NAME 同步');
    return;
  }
  const src = readFileSync(SW_PATH, 'utf-8');
  const next = src.replace(
    /const CACHE_NAME = 'map-cache-[^']+';/,
    `const CACHE_NAME = '${cacheName}';`,
  );
  if (next === src) {
    console.log('  map-sw.js 未找到 CACHE_NAME，跳过同步');
    return;
  }
  writeFileSync(SW_PATH, next);
  console.log(`  map-sw.js: CACHE_NAME -> ${cacheName}`);
}

function syncManifestHashesAndCacheName() {
  if (!statSync(MANIFEST_PATH, { throwIfNoEntry: false })) return;
  const m = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
  const entries = Array.isArray(m.entries) ? m.entries : [];
  for (const entry of entries) {
    if (!entry?.file) continue;
    const filePath = resolve(FILES_DIR, entry.file);
    if (!statSync(filePath, { throwIfNoEntry: false })) continue;
    const buf = readFileSync(filePath);
    entry.size = buf.length;
    entry.bodyHash = createHash('sha1').update(buf).digest('hex');
  }
  entries.sort((a, b) => String(a.url || '').localeCompare(String(b.url || '')));
  const cacheName = makeSnapshotCacheName(entries);
  m.cacheName = cacheName;
  m.entries = entries;
  writeFileSync(MANIFEST_PATH, JSON.stringify(m, null, 2));
  updateMapSwCacheName(cacheName);
}

console.log('[scrub] 清洗 manifest.json...');
const m = scrubManifest();
console.log('[scrub] 清洗 files/...');
const f = scrubFilesDir();
console.log('[scrub] 同步 manifest hash 与 SW cache name...');
syncManifestHashesAndCacheName();
console.log(`\n[scrub] 完成。manifest URL 修改 ${m} 处，files 内容修改 ${f} 处。`);
