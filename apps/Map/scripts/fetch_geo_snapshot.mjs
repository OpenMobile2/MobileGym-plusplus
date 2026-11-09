#!/usr/bin/env node
/**
 * Map App 的可选地理信息快照生成工具。
 * 调用 Google Maps API，刷新 apps/Map/data/places.json 和 routes.json。
 *
 * 四个阶段独立控制：搜索 (search) → 搜索提示 (autocomplete) → 详情 (details) → 路线 (routes)
 * 默认：增量（只处理缺失项）。可用 --full 指定全量重建某阶段、--skip 跳过。
 *
 * Usage:
 *   node apps/Map/scripts/fetch_geo_snapshot.mjs                              # 增量：补齐所有阶段
 *   node apps/Map/scripts/fetch_geo_snapshot.mjs --full search                # 全量搜索 + 增量详情 + 增量路线
 *   node apps/Map/scripts/fetch_geo_snapshot.mjs --full autocomplete          # 增量搜索 + 全量搜索提示 + 增量详情 + 增量路线
 *   node apps/Map/scripts/fetch_geo_snapshot.mjs --full details               # 增量搜索 + 全量详情 + 增量路线
 *   node apps/Map/scripts/fetch_geo_snapshot.mjs --full routes                # 增量搜索 + 增量详情 + 全量路线
 *   node apps/Map/scripts/fetch_geo_snapshot.mjs --full all                   # 全量搜索 + 全量详情 + 全量路线
 *   node apps/Map/scripts/fetch_geo_snapshot.mjs --skip details               # 增量搜索 + 跳过详情 + 增量路线
 *   node apps/Map/scripts/fetch_geo_snapshot.mjs --skip details,routes        # 增量搜索 + 跳过详情和路线
 *   node apps/Map/scripts/fetch_geo_snapshot.mjs --full search --skip routes  # 全量搜索 + 增量详情 + 跳过路线
 *
 * 语义：
 *   搜索全量 — search_index 精确重建（关键词集对齐 tasks.py，旧 key 删除，结果覆盖）。places 冗余保留。
 *   搜索提示全量 — autocomplete_index 覆盖所有任务完整搜索词，结果来自 Maps JS SDK AutocompleteService（与 App 在线路径一致）。
 *   详情全量 — 对 places 中所有 POI 重新拉取详情，覆盖旧值；autocomplete 中缺失的 place_id 会先补成 POI。
 *   路线全量 — 对所有应存在的 route key 重新计算，覆盖旧值。冗余路线保留。
 *
 * 兼容旧 CLI：--patch（等价于默认增量）、--full-search、--skip-details、--skip-routes
 *
 * 输出: apps/Map/data/places.json, routes.json
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'fs';
import { spawn } from 'child_process';
import { createServer } from 'http';
import { tmpdir } from 'os';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_DIR = resolve(__dirname, '..');
const ROOT = resolve(APP_DIR, '../..');
const OUT_DIR = resolve(APP_DIR, 'data');
const PLACES_PATH = resolve(OUT_DIR, 'places.json');
const ROUTES_PATH = resolve(OUT_DIR, 'routes.json');

// ─── 常量 ────────────────────────────────────────────────────────────────────

const SEARCH_RADIUS = 5000;
const CATEGORY_PAGE_SIZE = 20;
const PLACE_PAGE_SIZE = 10;
const MAX_PAGES = 3;
const MAX_POI_DISTANCE_KM = 100;

const PLACE_FIELDS = 'places.id,places.displayName,places.location,places.rating,places.userRatingCount,places.types,places.primaryType,places.formattedAddress,places.internationalPhoneNumber';
const SEARCH_FIELDS = PLACE_FIELDS + ',nextPageToken';

/**
 * Places API v1 GET `places/{placeId}` 的 X-Goog-FieldMask 必须使用 **REST JSON 字段名**。
 * 与 JS SDK `Place.fetchFields` 不同：REST 为 dineIn / takeout / restroom…，SDK 为 hasDineIn / hasTakeout / hasRestroom…
 * 误用 SDK 字段名会导致 INVALID_ARGUMENT: Request contains an invalid argument.
 * @see https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places
 */
const PLACE_DETAIL_FIELD_MASK = [
  'displayName', 'formattedAddress', 'location', 'rating', 'userRatingCount',
  'businessStatus', 'types', 'primaryType', 'primaryTypeDisplayName',
  'internationalPhoneNumber', 'nationalPhoneNumber', 'websiteUri',
  'regularOpeningHours', 'currentOpeningHours', 'editorialSummary',
  'plusCode', 'accessibilityOptions', 'paymentOptions', 'parkingOptions',
  'dineIn', 'takeout', 'delivery', 'reservable',
  'servesBreakfast', 'servesLunch', 'servesDinner', 'servesBrunch',
  'servesBeer', 'servesWine', 'servesCocktails', 'servesCoffee',
  'servesDessert', 'servesVegetarianFood',
  'restroom', 'allowsDogs', 'outdoorSeating', 'liveMusic',
  'menuForChildren', 'goodForChildren', 'goodForGroups', 'goodForWatchingSports',
].join(',');

const ROUTES_FIELD_MASK = [
  'routes.legs.duration', 'routes.legs.distanceMeters',
  'routes.legs.steps.navigationInstruction', 'routes.legs.steps.distanceMeters',
  'routes.distanceMeters', 'routes.legs.localizedValues',
  'routes.polyline.encodedPolyline', 'routes.legs.endLocation', 'routes.routeLabels',
].join(',');

// ─── 读取配置 ────────────────────────────────────────────────────────────────

function parseEnvValue(raw) {
  const value = String(raw ?? '').trim();
  if (!value) return '';
  const quote = value[0];
  if ((quote === '"' || quote === "'") && value.endsWith(quote)) {
    return value.slice(1, -1);
  }
  return value.replace(/\s+#.*$/, '').trim();
}

function loadRootEnvFiles() {
  const env = {};
  for (const name of ['.env', '.env.local']) {
    const envPath = resolve(ROOT, name);
    if (!existsSync(envPath)) continue;
    for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
      const m = line.match(/^\s*(?:export\s+)?([\w.]+)\s*=\s*(.*)$/);
      if (m) env[m[1]] = parseEnvValue(m[2]);
    }
  }
  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadRootEnvFiles();

const AUTOCOMPLETE_LIMIT = 10;
const USE_CURL_FETCH = Boolean(
  process.env.HTTPS_PROXY ||
  process.env.HTTP_PROXY ||
  process.env.ALL_PROXY ||
  process.env.https_proxy ||
  process.env.http_proxy ||
  process.env.all_proxy,
);

function readApiKey() {
  const key = process.env.VITE_GOOGLE_MAPS_API_KEY?.trim();
  if (!key) {
    throw new Error('未找到 VITE_GOOGLE_MAPS_API_KEY，请在 .env.local 或 .env 中设置');
  }
  return key;
}

function readSimulatedLocation() {
  const content = readFileSync(resolve(ROOT, 'os/data/simulatorConfig.ts'), 'utf-8');
  const lat = content.match(/latitude:\s*([\d.]+)/);
  const lng = content.match(/longitude:\s*([\d.]+)/);
  if (!lat || !lng) throw new Error('simulatorConfig.ts 中未找到 simulatedLocation');
  return { latitude: parseFloat(lat[1]), longitude: parseFloat(lng[1]) };
}

// ─── 从 tasks.py 提取查询 ───────────────────────────────────────────────────

function extractQueriesFromTasks() {
  const appPy = readFileSync(resolve(ROOT, 'bench_env/task/map/app.py'), 'utf-8');
  const tasksPy = readFileSync(resolve(ROOT, 'bench_env/task/map/tasks.py'), 'utf-8');

  const addBoth = (set, a, b) => {
    if (a && String(a).trim()) set.add(String(a).trim());
    if (b && String(b).trim()) set.add(String(b).trim());
  };

  const catBlock = appPy.match(/CATEGORY_PARAM\s*=\s*\{[\s\S]*?"values":\s*\{([\s\S]*?)\}/);
  const categoryTypes = new Map();
  if (catBlock) {
    for (const m of catBlock[1].matchAll(/"([^"]+)":\s*"([^"]+)"/g)) {
      categoryTypes.set(m[2], m[1]);
    }
  }

  const placeBlock = appPy.match(/PLACE_PARAM\s*=\s*\{[\s\S]*?"values":\s*\{([\s\S]*?)\}/);
  const placeQueries = new Set();
  if (placeBlock) {
    for (const m of placeBlock[1].matchAll(/"([^"]+?)":\s*"([^"]+)"/g)) {
      addBoth(placeQueries, m[1], m[2]);
    }
  }

  const restaurantBlock = appPy.match(/RESTAURANT_PARAM\s*=\s*\{[\s\S]*?"values":\s*\{([\s\S]*?)\}/);
  if (restaurantBlock) {
    for (const m of restaurantBlock[1].matchAll(/"([^"]+?)":\s*"([^"]+)"/g)) {
      addBoth(placeQueries, m[1], m[2]);
    }
  }

  const routePairs = [];
  for (const block of tasksPy.matchAll(/parameters\s*=\s*\{([\s\S]*?)\n    \}/g)) {
    const text = block[1];
    for (const m of text.matchAll(/"(place|restaurant)":\s*\{[^}]*?"default":\s*"([^"]+)"/g)) {
      placeQueries.add(m[2]);
    }
    const originM = text.match(/"origin":\s*\{[^}]*?"default":\s*"([^"]+)"/);
    const destM = text.match(/"destination":\s*\{[^}]*?"default":\s*"([^"]+)"/);
    if (originM) placeQueries.add(originM[1]);
    if (destM) placeQueries.add(destM[1]);
    if (originM && destM) routePairs.push([originM[1], destM[1]]);
  }

  const aliasIdx = appPy.indexOf('PLACE_QUERY_ALIASES');
  if (aliasIdx >= 0) {
    const aliasSlice = appPy.slice(aliasIdx, appPy.indexOf('DRIVING_OD_PAIRS', aliasIdx));
    for (const m of aliasSlice.matchAll(/"([^"]+)":\s*\(([^)]*)\)/g)) {
      placeQueries.add(m[1]);
      for (const am of m[2].matchAll(/"([^"]+)"/g)) {
        placeQueries.add(am[1]);
      }
    }
  }

  const drivingPairsIdx = appPy.indexOf('DRIVING_OD_PAIRS');
  if (drivingPairsIdx >= 0) {
    const pairSlice = appPy.slice(drivingPairsIdx, drivingPairsIdx + 2000);
    for (const m of pairSlice.matchAll(/\(\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\)/g)) {
      addBoth(placeQueries, m[1], m[2]);
      routePairs.push([m[1], m[2]]);
    }
  }

  // CheckRouteSuccess：_CHECK_ROUTE_OD_PAIRS（origin_id, dest_id, origin_hint, dest_hint）
  const odIdx = tasksPy.indexOf('_CHECK_ROUTE_OD_PAIRS');
  if (odIdx >= 0) {
    const odSlice = tasksPy.slice(odIdx, odIdx + 6000);
    const odRe =
      /\(\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\)/g;
    for (const m of odSlice.matchAll(odRe)) {
      routePairs.push([m[3], m[4]]);
    }
  }

  const autocompleteTerms = new Set([...categoryTypes.values(), ...placeQueries]);
  const autocompleteInputs = new Set(
    [...autocompleteTerms]
      .map((term) => String(term || '').trim())
      .filter(Boolean),
  );

  return {
    categoryTypes,
    placeQueries: [...placeQueries],
    routePairs,
    autocompleteTerms: [...autocompleteTerms],
    autocompleteInputs: [...autocompleteInputs],
  };
}

// ─── 工具 ────────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function curlConfigQuote(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function requestJsonWithCurl(url, options = {}) {
  return new Promise((resolveJson, rejectJson) => {
    const dir = mkdtempSync(resolve(tmpdir(), 'map-geo-'));
    const configPath = resolve(dir, 'curl.conf');
    const bodyPath = resolve(dir, 'body.json');
    const config = [
      'silent',
      'show-error',
      'location',
      'compressed',
      'max-time = 60',
      `url = "${curlConfigQuote(url)}"`,
    ];

    const method = String(options.method || 'GET').toUpperCase();
    if (method !== 'GET') {
      config.push(`request = "${curlConfigQuote(method)}"`);
    }

    for (const [name, value] of Object.entries(options.headers || {})) {
      config.push(`header = "${curlConfigQuote(`${name}: ${value}`)}"`);
    }

    if (options.body != null) {
      writeFileSync(bodyPath, String(options.body), 'utf-8');
      config.push(`data-binary = "@${curlConfigQuote(bodyPath)}"`);
    }

    writeFileSync(configPath, config.join('\n') + '\n', 'utf-8');

    const child = spawn('curl', ['--config', configPath], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf-8');
    child.stderr.setEncoding('utf-8');
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', (error) => {
      rmSync(dir, { recursive: true, force: true });
      rejectJson(error);
    });
    child.on('close', (code) => {
      rmSync(dir, { recursive: true, force: true });
      if (code !== 0) {
        rejectJson(new Error(stderr.trim() || `curl exited with code ${code}`));
        return;
      }
      try {
        resolveJson(JSON.parse(stdout || '{}'));
      } catch (error) {
        rejectJson(new Error(`curl returned non-JSON response: ${String(error.message || error)}`));
      }
    });
  });
}

async function requestJson(url, options = {}) {
  if (USE_CURL_FETCH) {
    return requestJsonWithCurl(url, options);
  }
  const res = await fetch(url, options);
  return res.json();
}

const MAX_RETRIES = 3;
async function withRetry(fn, label) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const result = await fn();
    if (result !== null) return result;
    if (attempt < MAX_RETRIES) {
      const wait = 1000 * 2 ** attempt;
      console.error(`  ↻ ${label} 重试 ${attempt + 1}/${MAX_RETRIES}（${wait / 1000}s 后）`);
      await sleep(wait);
    }
  }
  return null;
}

const CONCURRENCY = 5;
async function runConcurrent(tasks, concurrency = CONCURRENCY) {
  let idx = 0;
  let completed = 0;
  const total = tasks.length;
  async function worker() {
    while (idx < total) {
      const i = idx++;
      await tasks[i]();
      completed++;
      if (completed % 20 === 0 || completed === total) {
        process.stdout.write(`  进度: ${completed}/${total}\r`);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, total) }, () => worker()));
}

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = x => x * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── 数据解析 ────────────────────────────────────────────────────────────────

/** 与运行时 PlaceSearchResult 字段对齐 */
function parsePlaces(json, centerLat, centerLng) {
  return (json.places || []).filter(p => p.id && p.location).map(p => ({
    placeId: p.id,
    name: p.displayName?.text || '',
    lat: p.location.latitude,
    lng: p.location.longitude,
    rating: p.rating ?? undefined,
    userRatingCount: p.userRatingCount ?? undefined,
    types: p.types || [],
    primaryType: p.primaryType || undefined,
    formattedAddress: p.formattedAddress || '',
    internationalPhoneNumber: p.internationalPhoneNumber ?? undefined,
    distanceMeters: Math.round(haversineDistance(centerLat, centerLng, p.location.latitude, p.location.longitude)),
  }));
}

function printResults(label, results) {
  console.log(`\n  ┌─ ${label} (${results.length} 条)`);
  for (let i = 0; i < results.length; i++) {
    const p = results[i];
    const dist = p.distanceMeters != null
      ? (p.distanceMeters < 1000 ? `${p.distanceMeters}m` : `${(p.distanceMeters / 1000).toFixed(1)}km`)
      : '?';
    const rating = p.rating != null ? `${p.rating}★(${p.userRatingCount || 0})` : '无评分';
    const type = p.primaryType || p.types?.[0] || '';
    console.log(`  │ ${String(i + 1).padStart(2)}. ${p.name}  ${rating}  ${type}  ${dist}`);
  }
  console.log('  └─');
}

function collectAutocompletePlaceIds(snapshot) {
  const ids = new Set();
  for (const predictions of Object.values(snapshot.autocompleteIndex || {})) {
    for (const prediction of predictions || []) {
      if (prediction?.kind === 'place' && prediction.place_id) {
        ids.add(String(prediction.place_id));
      }
    }
  }
  return ids;
}

function findAutocompletePrediction(snapshot, placeId) {
  for (const predictions of Object.values(snapshot.autocompleteIndex || {})) {
    for (const prediction of predictions || []) {
      if (prediction?.kind === 'place' && prediction.place_id === placeId) {
        return prediction;
      }
    }
  }
  return null;
}

function placeRowFromDetail(placeId, detail, loc, prediction) {
  const lat = detail?.location?.latitude;
  const lng = detail?.location?.longitude;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return {
    placeId,
    name: detail.displayName ?? prediction?.main_text ?? prediction?.description ?? placeId,
    lat,
    lng,
    rating: detail.rating ?? undefined,
    userRatingCount: detail.userRatingCount ?? undefined,
    types: detail.types || [],
    primaryType: detail.primaryType || undefined,
    formattedAddress: detail.formattedAddress ?? prediction?.secondary_text ?? '',
    internationalPhoneNumber: detail.internationalPhoneNumber ?? undefined,
    distanceMeters: Math.round(haversineDistance(loc.latitude, loc.longitude, lat, lng)),
    details: detail,
  };
}

// ─── BiText 工具 ─────────────────────────────────────────────────────────────

/** 将 REST 详情 JSON 对齐为与 extractPlaceAboutData / 运行时一致（含 websiteURI） */
function normalizePlaceDetailForSnapshot(rest) {
  if (!rest || typeof rest !== 'object') return rest;
  return {
    ...rest,
    websiteURI: rest.websiteURI ?? rest.websiteUri,
    hasDineIn: rest.hasDineIn ?? rest.dineIn,
    hasTakeout: rest.hasTakeout ?? rest.takeout,
    hasDelivery: rest.hasDelivery ?? rest.delivery,
    isReservable: rest.isReservable ?? rest.reservable,
    hasRestroom: rest.hasRestroom ?? rest.restroom,
    hasOutdoorSeating: rest.hasOutdoorSeating ?? rest.outdoorSeating,
    hasLiveMusic: rest.hasLiveMusic ?? rest.liveMusic,
    hasMenuForChildren: rest.hasMenuForChildren ?? rest.menuForChildren,
    isGoodForChildren: rest.isGoodForChildren ?? rest.goodForChildren,
    isGoodForGroups: rest.isGoodForGroups ?? rest.goodForGroups,
    isGoodForWatchingSports: rest.isGoodForWatchingSports ?? rest.goodForWatchingSports,
  };
}

/** 从 REST displayName/editorialSummary 等提取纯文本 */
function extractText(v) {
  if (v == null) return undefined;
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && 'text' in v) return v.text ?? '';
  return undefined;
}

/** 构造 {zh, en} 对；单语言缺失时整个字段设为有值的那一份 */
function biText(zhVal, enVal) {
  const zh = extractText(zhVal);
  const en = extractText(enVal);
  if (zh == null && en == null) return undefined;
  if (zh == null) return en;
  if (en == null) return zh;
  if (zh === en) return zh;
  return { zh, en };
}

function biArr(zhArr, enArr) {
  if (!Array.isArray(zhArr) && !Array.isArray(enArr)) return undefined;
  const zh = Array.isArray(zhArr) ? zhArr : [];
  const en = Array.isArray(enArr) ? enArr : [];
  if (zh.length === 0 && en.length === 0) return undefined;
  if (JSON.stringify(zh) === JSON.stringify(en)) return zh;
  return { zh, en };
}

// ─── Places Detail API ──────────────────────────────────────────────────────

async function fetchPlaceDetailOneLang(apiKey, placeId, lang) {
  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=${lang}`;
  try {
    const json = await requestJson(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': PLACE_DETAIL_FIELD_MASK,
      },
    });
    if (json.error) {
      console.error(`  ⚠ place detail(${lang}) ${placeId.slice(0, 12)}...: ${json.error.message?.slice(0, 80)}`);
      return null;
    }
    return json;
  } catch (e) {
    console.error(`  ⚠ place detail(${lang}) ${placeId}: ${e.message?.slice(0, 80)}`);
    return null;
  }
}

/**
 * 并行拉取 zh-CN + en 详情，语言相关字段合并为 BiText，其余取中文版
 */
async function fetchPlaceDetailREST(apiKey, placeId) {
  const [zhRaw, enRaw] = await Promise.all([
    fetchPlaceDetailOneLang(apiKey, placeId, 'zh-CN'),
    fetchPlaceDetailOneLang(apiKey, placeId, 'en'),
  ]);
  if (!zhRaw && !enRaw) return null;
  const zh = normalizePlaceDetailForSnapshot(zhRaw || enRaw);
  const en = enRaw ? normalizePlaceDetailForSnapshot(enRaw) : null;

  zh.displayName = biText(zh.displayName, en?.displayName);
  zh.formattedAddress = biText(zh.formattedAddress, en?.formattedAddress);
  zh.editorialSummary = biText(zh.editorialSummary, en?.editorialSummary);
  zh.primaryTypeDisplayName = biText(zh.primaryTypeDisplayName, en?.primaryTypeDisplayName);

  const zhHrs = zh.regularOpeningHours;
  const enHrs = en?.regularOpeningHours;
  if (zhHrs && typeof zhHrs === 'object') {
    const merged = biArr(zhHrs.weekdayDescriptions, enHrs?.weekdayDescriptions);
    if (merged) zhHrs.weekdayDescriptions = merged;
  }
  const zhCurHrs = zh.currentOpeningHours;
  const enCurHrs = en?.currentOpeningHours;
  if (zhCurHrs && typeof zhCurHrs === 'object') {
    const merged = biArr(zhCurHrs.weekdayDescriptions, enCurHrs?.weekdayDescriptions);
    if (merged) zhCurHrs.weekdayDescriptions = merged;
  }

  return zh;
}

// ─── Places Search API ──────────────────────────────────────────────────────

async function searchTextOnePage(apiKey, query, includedType, pageSize, centerLat, centerLng, pageToken) {
  const body = {
    textQuery: query,
    locationBias: {
      circle: { center: { latitude: centerLat, longitude: centerLng }, radius: SEARCH_RADIUS },
    },
    pageSize,
    languageCode: 'zh-CN',
  };
  if (includedType) body.includedType = includedType;
  if (pageToken) body.pageToken = pageToken;
  try {
    const json = await requestJson('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': SEARCH_FIELDS },
      body: JSON.stringify(body),
    });
    if (json.error) { console.error(`  ⚠ searchText("${query}") error: ${json.error.message?.slice(0, 120)}`); return { places: [], nextPageToken: null }; }
    return { places: parsePlaces(json, centerLat, centerLng), nextPageToken: json.nextPageToken || null };
  } catch (e) {
    console.error(`  ⚠ searchText("${query}") 错误: ${e.message?.slice(0, 120)}`);
    return { places: [], nextPageToken: null };
  }
}

async function searchTextAllPages(apiKey, query, includedType, pageSize, centerLat, centerLng) {
  const all = [];
  let pageToken = null;
  for (let page = 0; page < MAX_PAGES; page++) {
    const { places, nextPageToken } = await searchTextOnePage(apiKey, query, includedType, pageSize, centerLat, centerLng, pageToken);
    all.push(...places);
    if (!nextPageToken) break;
    pageToken = nextPageToken;
    console.log(`    第 ${page + 2} 页...`);
    await sleep(300);
  }
  return all;
}

function getQueryPredictionMainText(prediction) {
  return prediction.terms?.[0]?.value ?? prediction.description ?? '';
}

function getQueryPredictionSecondaryText(prediction) {
  return (prediction.terms || []).slice(1).map((term) => term.value).join(' ');
}

function startLocalSdkHost() {
  const html = '<!doctype html><html><head><meta charset="utf-8"><title>Map SDK Snapshot</title></head><body></body></html>';
  const server = createServer((_, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    res.end(html);
  });
  return new Promise((resolveHost, rejectHost) => {
    server.once('error', rejectHost);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string') {
        rejectHost(new Error('无法启动本地 JS SDK host'));
        return;
      }
      resolveHost({
        url: `http://127.0.0.1:${addr.port}/`,
        close: () => new Promise((resolveClose) => server.close(resolveClose)),
      });
    });
  });
}

async function createJsSdkAutocompleteClient(apiKey, loc) {
  const { default: puppeteer } = await import('puppeteer');
  const host = await startLocalSdkHost();
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  page.on('console', (msg) => {
    const text = msg.text();
    if (text.startsWith('[JS SDK autocomplete]')) console.log(`  ${text}`);
  });

  try {
    await page.goto(host.url, { waitUntil: 'domcontentloaded' });
    await page.evaluate((key) => new Promise((resolveReady, rejectReady) => {
      if (window.google?.maps?.places?.AutocompleteService) {
        resolveReady(true);
        return;
      }
      window.__mapSdkSnapshotReady = () => resolveReady(true);
      const script = document.createElement('script');
      const params = new URLSearchParams({
        key,
        libraries: 'places',
        language: 'zh-CN',
        region: 'CN',
        v: 'weekly',
        loading: 'async',
        callback: '__mapSdkSnapshotReady',
      });
      script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
      script.async = true;
      script.onerror = () => rejectReady(new Error('Google Maps JS SDK 加载失败'));
      document.head.appendChild(script);
    }), apiKey);
    await page.waitForFunction(
      () => Boolean(window.google?.maps?.places?.AutocompleteService),
      { timeout: 20000 },
    );

    await page.evaluate(({ lat, lng, radius, limit }) => {
      const service = new google.maps.places.AutocompleteService();
      const center = new google.maps.LatLng(lat, lng);
      const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
      const queryMain = (prediction) => prediction.terms?.[0]?.value ?? prediction.description ?? '';
      const querySecondary = (prediction) =>
        (prediction.terms || []).slice(1).map((term) => term.value).join(' ');

      const queryOne = (input) => new Promise((resolveOne) => {
        service.getQueryPredictions(
          {
            input,
            locationBias: { center, radius },
          },
          (results, status) => {
            if (status !== google.maps.places.PlacesServiceStatus.OK || !results) {
              resolveOne([]);
              return;
            }
            const q = input.trim();
            resolveOne(
              results
                .filter((r) => !r.place_id || queryMain(r) === q)
                .map((r) => ({
                  kind: 'query',
                  place_id: '',
                  description: r.description ?? '',
                  main_text: queryMain(r),
                  secondary_text: querySecondary(r),
                  distance_meters: undefined,
                })),
            );
          },
        );
      });

      const placeOne = (input) => new Promise((resolveOne) => {
        service.getPlacePredictions(
          {
            input,
            language: 'zh-CN',
            locationBias: { center, radius },
            origin: center,
          },
          (results, status) => {
            if (status !== google.maps.places.PlacesServiceStatus.OK || !results) {
              resolveOne([]);
              return;
            }
            resolveOne(
              results
                .map((r) => ({
                  kind: 'place',
                  place_id: r.place_id,
                  description: r.description ?? '',
                  main_text: r.structured_formatting?.main_text ?? r.description ?? '',
                  secondary_text: r.structured_formatting?.secondary_text ?? '',
                  distance_meters: r.distance_meters ?? undefined,
                }))
                .filter((p) => p.place_id && p.main_text),
            );
          },
        );
      });

      window.__mapFetchAutocompleteBatch = async (inputs) => {
        const out = {};
        for (let i = 0; i < inputs.length; i += 1) {
          const input = inputs[i];
          const [rawQueryPreds, placePreds] = await Promise.all([queryOne(input), placeOne(input)]);
          const seen = new Set();
          const queryPreds = rawQueryPreds.filter((p) => {
            if (!p.main_text || seen.has(p.main_text)) return false;
            seen.add(p.main_text);
            return true;
          });
          out[input] = [...queryPreds, ...placePreds].slice(0, limit);
          if ((i + 1) % 20 === 0 || i + 1 === inputs.length) {
            console.log(`[JS SDK autocomplete] ${i + 1}/${inputs.length}`);
          }
          await sleep(40);
        }
        return out;
      };
    }, {
      lat: loc.latitude,
      lng: loc.longitude,
      radius: SEARCH_RADIUS,
      limit: AUTOCOMPLETE_LIMIT,
    });

    return {
      fetchBatch: (inputs) => page.evaluate((items) => window.__mapFetchAutocompleteBatch(items), inputs),
      close: async () => {
        await browser.close();
        await host.close();
      },
    };
  } catch (error) {
    await browser.close().catch(() => {});
    await host.close().catch(() => {});
    throw error;
  }
}

// ─── Routes API ─────────────────────────────────────────────────────────────

function parseEndLocation(leg) {
  const el = leg?.endLocation;
  const ll = el?.latLng || el?.location?.latLng;
  if (!ll) return null;
  const lat = ll.latitude ?? ll.lat;
  const lng = ll.longitude ?? ll.lng;
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  return { lat, lng };
}

async function computeRouteOneLang(apiKey, oLat, oLng, dLat, dLng, mode, lang) {
  const body = {
    origin: { location: { latLng: { latitude: oLat, longitude: oLng } } },
    destination: { location: { latLng: { latitude: dLat, longitude: dLng } } },
    travelMode: mode,
    computeAlternativeRoutes: false,
    languageCode: lang,
  };
  try {
    const json = await requestJson('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': ROUTES_FIELD_MASK,
      },
      body: JSON.stringify(body),
    });
    if (json.error) return null;
    const route = json.routes?.[0];
    const leg = route?.legs?.[0];
    if (!leg) return null;
    const durationSec = parseFloat(leg.duration?.replace('s', '') || '0');
    const durationText = leg.localizedValues?.duration?.text
      || `${Math.round(durationSec / 60)} ${lang === 'en' ? 'min' : '分钟'}`;
    const distanceMeters = leg.distanceMeters ?? route?.distanceMeters;
    let distanceText = leg.localizedValues?.distance?.text || '';
    if (!distanceText && distanceMeters != null) {
      const dm = Number(distanceMeters);
      if (lang === 'en') {
        distanceText = dm < 1000 ? `${Math.round(dm)} m` : `${(dm / 1000).toFixed(1)} km`;
      } else {
        distanceText = dm < 1000 ? `${Math.round(dm)} 米` : `${(dm / 1000).toFixed(1)} 公里`;
      }
    }
    const encodedPolyline = route?.polyline?.encodedPolyline || null;
    const endLocation = parseEndLocation(leg);
    const routeLabels = route?.routeLabels || undefined;
    const steps = (leg.steps || []).map(s => ({
      instruction: s.navigationInstruction?.instructions || '',
      distance: s.distanceMeters != null ? `${s.distanceMeters} m` : '',
      distanceMeters: s.distanceMeters ?? 0,
      maneuver: s.navigationInstruction?.maneuver || undefined,
    }));
    return { durationSec, durationText, distanceMeters, distanceText, encodedPolyline, endLocation, routeLabels, steps };
  } catch (e) {
    console.error(`  ⚠ computeRoutes(${mode}, ${lang}): ${e.message?.slice(0, 100)}`);
    return null;
  }
}

async function computeRoute(apiKey, oLat, oLng, dLat, dLng, mode) {
  const [zh, en] = await Promise.all([
    computeRouteOneLang(apiKey, oLat, oLng, dLat, dLng, mode, 'zh-CN'),
    computeRouteOneLang(apiKey, oLat, oLng, dLat, dLng, mode, 'en'),
  ]);
  if (!zh && !en) return null;
  const primary = zh || en;
  const modeKey = mode === 'WALK' ? 'WALKING' : 'DRIVING';
  return {
    mode: modeKey,
    duration: biText(zh?.durationText, en?.durationText) || primary.durationText,
    distance: biText(zh?.distanceText, en?.distanceText) || primary.distanceText,
    distance_meters: primary.distanceMeters,
    duration_seconds: primary.durationSec,
    encodedPolyline: primary.encodedPolyline,
    endLocation: primary.endLocation,
    routeLabels: primary.routeLabels,
    steps: (primary.steps || []).map((s, i) => {
      const enStep = en?.steps?.[i];
      return {
        instruction: biText(zh?.steps?.[i]?.instruction, enStep?.instruction) || s.instruction,
        distance: biText(zh?.steps?.[i]?.distance, enStep?.distance) || s.distance,
        distanceMeters: s.distanceMeters,
        maneuver: s.maneuver,
      };
    }),
  };
}

// ─── 数据层 ──────────────────────────────────────────────────────────────────

function loadSnapshot(loc) {
  const snapshot = {
    location: { lat: loc.latitude, lng: loc.longitude },
    places: {},
    searchIndex: {},
    autocompleteIndex: {},
    routes: {},
  };

  try {
    if (existsSync(PLACES_PATH)) {
      const pd = JSON.parse(readFileSync(PLACES_PATH, 'utf-8'));
      snapshot.places = pd.places || {};
      snapshot.searchIndex = pd.search_index || {};
      snapshot.autocompleteIndex = pd.autocomplete_index || {};
    }
  } catch (e) {
    console.warn('  ⚠ 读取 places.json 失败，从空开始:', e.message);
  }

  try {
    if (existsSync(ROUTES_PATH)) {
      const rd = JSON.parse(readFileSync(ROUTES_PATH, 'utf-8'));
      snapshot.routes = rd.routes || {};
    }
  } catch (e) {
    console.warn('  ⚠ 读取 routes.json 失败，从空开始:', e.message);
  }

  return snapshot;
}

function saveSnapshot(snapshot) {
  mkdirSync(OUT_DIR, { recursive: true });
  const now = new Date().toISOString();

  const placesData = {
    location: snapshot.location,
    generated_at: now,
    places: snapshot.places,
    search_index: snapshot.searchIndex,
    autocomplete_index: snapshot.autocompleteIndex,
  };
  const routesData = {
    location: snapshot.location,
    generated_at: now,
    routes: snapshot.routes,
  };

  writeFileSync(PLACES_PATH, JSON.stringify(placesData, null, 2) + '\n', 'utf-8');
  writeFileSync(ROUTES_PATH, JSON.stringify(routesData, null, 2) + '\n', 'utf-8');

  const pSize = Buffer.byteLength(JSON.stringify(placesData));
  const rSize = Buffer.byteLength(JSON.stringify(routesData));
  console.log(`  ✓ places.json (${pSize.toLocaleString()} bytes, ${Object.keys(snapshot.places).length} POI)`);
  console.log(`  ✓ routes.json (${rSize.toLocaleString()} bytes, ${Object.keys(snapshot.routes).length} 路线)`);
}

function pruneDistantPlaces(snapshot, loc) {
  const maxM = MAX_POI_DISTANCE_KM * 1000;
  const farIds = [];
  for (const [pid, poi] of Object.entries(snapshot.places)) {
    const dm = poi.distanceMeters ?? haversineDistance(loc.latitude, loc.longitude, poi.lat, poi.lng);
    if (dm > maxM) farIds.push(pid);
  }
  if (!farIds.length) return;

  console.log(`  清理超远 POI (>${MAX_POI_DISTANCE_KM}km): ${farIds.length} 条`);
  for (const pid of farIds) {
    console.log(`    移除: ${extractText(snapshot.places[pid]?.name) || pid}`);
    delete snapshot.places[pid];
  }
  for (const [key, ids] of Object.entries(snapshot.searchIndex)) {
    const filtered = ids.filter(id => !farIds.includes(id));
    if (filtered.length !== ids.length) snapshot.searchIndex[key] = filtered;
  }
}

// ─── 阶段一：搜索 ───────────────────────────────────────────────────────────

async function runSearch(snapshot, queries, apiKey, loc, { full }) {
  const { categoryTypes, placeQueries } = queries;
  const maxM = MAX_POI_DISTANCE_KM * 1000;

  let catsToSearch, queriesToSearch;

  if (full) {
    catsToSearch = [...categoryTypes.entries()];
    queriesToSearch = [...placeQueries];
    const newKeys = new Set([...categoryTypes.values(), ...placeQueries]);
    for (const k of Object.keys(snapshot.searchIndex)) {
      if (!newKeys.has(k)) delete snapshot.searchIndex[k];
    }
    console.log(`  全量: ${catsToSearch.length} 个分类, ${queriesToSearch.length} 个地名`);
  } else {
    const existingKeys = new Set(Object.keys(snapshot.searchIndex));
    catsToSearch = [...categoryTypes.entries()].filter(([, kw]) => !existingKeys.has(kw));
    queriesToSearch = placeQueries.filter(q => !existingKeys.has(q));
    console.log(`  增量: ${catsToSearch.length} 个新分类, ${queriesToSearch.length} 个新地名`);
  }

  if (!catsToSearch.length && !queriesToSearch.length) {
    console.log('  所有关键词已覆盖，跳过');
    return;
  }

  let newPoiCount = 0;

  function addResults(key, results) {
    const ids = [];
    for (const poi of results) {
      if (!poi.placeId) continue;
      if (poi.distanceMeters != null && poi.distanceMeters > maxM) continue;
      if (!snapshot.places[poi.placeId]) {
        snapshot.places[poi.placeId] = poi;
        newPoiCount++;
      }
      ids.push(poi.placeId);
    }
    snapshot.searchIndex[key] = ids;
  }

  for (const [, keyword] of catsToSearch) {
    console.log(`  搜索分类: "${keyword}"`);
    const results = await searchTextAllPages(apiKey, keyword, null, CATEGORY_PAGE_SIZE, loc.latitude, loc.longitude);
    addResults(keyword, results);
    printResults(`"${keyword}"`, results);
    await sleep(300);
  }

  for (const query of queriesToSearch) {
    console.log(`  搜索地名: "${query}"`);
    const results = await searchTextAllPages(apiKey, query, null, PLACE_PAGE_SIZE, loc.latitude, loc.longitude);
    addResults(query, results);
    printResults(`"${query}"`, results);
    await sleep(300);
  }

  console.log(`  ✓ 搜索完成，新增 ${newPoiCount} 个 POI，共 ${Object.keys(snapshot.places).length} 个`);
}

// ─── 阶段二：搜索提示 ───────────────────────────────────────────────────────

async function runAutocomplete(snapshot, queries, apiKey, loc, { full }) {
  let inputs = queries.autocompleteInputs || [];
  if (!full) {
    inputs = inputs.filter((q) => !snapshot.autocompleteIndex[q]);
  }

  console.log(`  ${full ? '全量' : '增量'}: ${inputs.length} 个完整搜索词`);
  if (!inputs.length) {
    console.log('  所有搜索提示已覆盖，跳过');
    return;
  }

  const client = await createJsSdkAutocompleteClient(apiKey, loc);
  try {
    const results = await client.fetchBatch(inputs);
    const nextIndex = full ? {} : snapshot.autocompleteIndex;
    let fixed = 0;
    for (const input of inputs) {
      nextIndex[input] = results[input] || [];
      fixed++;
    }
    if (full) snapshot.autocompleteIndex = nextIndex;
    console.log(`\n  ✓ 搜索提示完成 ${fixed}/${inputs.length}，共 ${Object.keys(snapshot.autocompleteIndex).length} 个输入`);
  } finally {
    await client.close();
  }
}

// ─── 阶段三：详情 ───────────────────────────────────────────────────────────

async function runDetails(snapshot, apiKey, loc, { full }) {
  /** REST 原始格式 displayName 为 {text: "...", languageCode: "..."}，处理后为纯字符串或 {zh, en} */
  function needsBiTextUpgrade(detail) {
    if (!detail?.displayName) return false;
    const dn = detail.displayName;
    return typeof dn === 'object' && 'text' in dn;
  }

  let targets;
  const autocompleteMissing = [...collectAutocompletePlaceIds(snapshot)]
    .filter((pid) => !snapshot.places[pid])
    .map((pid) => [pid, null]);
  if (full) {
    targets = [...Object.entries(snapshot.places), ...autocompleteMissing];
    console.log(`  全量: ${Object.keys(snapshot.places).length} 个已有 POI, autocomplete 新增 ${autocompleteMissing.length} 个`);
  } else {
    const missing = Object.entries(snapshot.places)
      .filter(([, p]) => !p.details || Object.keys(p.details).length === 0);
    const needsUpgrade = Object.entries(snapshot.places)
      .filter(([, p]) => p.details && Object.keys(p.details).length > 0 && needsBiTextUpgrade(p.details));
    targets = [...autocompleteMissing, ...missing, ...needsUpgrade];
    console.log(`  增量: autocomplete 新增 ${autocompleteMissing.length} 条, 缺 ${missing.length} 条, 需升级 ${needsUpgrade.length} 条`);
  }

  if (!targets.length) {
    console.log('  所有详情已完备，跳过');
    return;
  }

  let fixed = 0;
  const tasks = targets.map(([pid, row]) => async () => {
    const detail = await withRetry(() => fetchPlaceDetailREST(apiKey, pid), `detail(${pid.slice(0, 12)})`);
    if (detail) {
      const targetRow = row || snapshot.places[pid];
      if (targetRow) {
        targetRow.details = detail;
        if (detail.displayName) targetRow.name = detail.displayName;
        if (detail.formattedAddress) targetRow.formattedAddress = detail.formattedAddress;
      } else {
        const prediction = findAutocompletePrediction(snapshot, pid);
        const newRow = placeRowFromDetail(pid, detail, loc, prediction);
        if (!newRow) {
          console.warn(`  ⚠ autocomplete place ${pid.slice(0, 12)}... 缺少 location，跳过`);
          return;
        }
        snapshot.places[pid] = newRow;
      }
      fixed++;
    }
  });

  console.log(`  需拉取: ${tasks.length}`);
  await runConcurrent(tasks);
  console.log(`\n  ✓ 详情完成 ${fixed}/${tasks.length}`);
}

// ─── 阶段四：路线 ───────────────────────────────────────────────────────────

async function runRoutes(snapshot, queries, apiKey, loc, { full }) {
  const modes = ['WALK', 'DRIVE'];
  const pending = [];

  for (const [pid, poi] of Object.entries(snapshot.places)) {
    if (poi.lat == null || poi.lng == null) continue;
    for (const mode of modes) {
      const modeKey = mode === 'WALK' ? 'WALKING' : 'DRIVING';
      const rk = `current>${pid}>${modeKey}`;
      if (!full && snapshot.routes[rk]) continue;
      pending.push({ key: rk, oLat: loc.latitude, oLng: loc.longitude, dLat: poi.lat, dLng: poi.lng, mode });
    }
  }

  for (const [originName, destName] of queries.routePairs) {
    const oId = snapshot.searchIndex[originName]?.[0];
    const dId = snapshot.searchIndex[destName]?.[0];
    if (!oId || !dId) {
      console.warn(`  ⚠ 路线对 "${originName}" → "${destName}" 缺少搜索结果，跳过`);
      continue;
    }
    const o = snapshot.places[oId];
    const d = snapshot.places[dId];
    if (!o || !d) continue;
    for (const mode of modes) {
      const modeKey = mode === 'WALK' ? 'WALKING' : 'DRIVING';
      const rk = `${oId}>${dId}>${modeKey}`;
      if (!full && snapshot.routes[rk]) continue;
      if (pending.some(p => p.key === rk)) continue;
      pending.push({ key: rk, oLat: o.lat, oLng: o.lng, dLat: d.lat, dLng: d.lng, mode });
    }
  }

  const label = full ? '全量' : '增量';
  console.log(`  ${label}: ${pending.length} 条需计算`);

  if (!pending.length) {
    console.log('  所有路线已完备，跳过');
    return;
  }

  let fixed = 0;
  const tasks = pending.map(({ key, oLat, oLng, dLat, dLng, mode }) => async () => {
    const r = await withRetry(() => computeRoute(apiKey, oLat, oLng, dLat, dLng, mode), `route(${key.slice(0, 40)})`);
    if (r) { snapshot.routes[key] = r; fixed++; }
  });

  await runConcurrent(tasks);
  console.log(`\n  ✓ 路线完成 ${fixed}/${pending.length}，共 ${Object.keys(snapshot.routes).length} 条`);
}

// ─── CLI 解析 ────────────────────────────────────────────────────────────────

function parseArgs() {
  const argv = process.argv.slice(2);
  const full = new Set();
  const skip = new Set();

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--full' && argv[i + 1]) {
      for (const s of argv[++i].split(',')) {
        if (s === 'all') { full.add('search'); full.add('autocomplete'); full.add('details'); full.add('routes'); }
        else full.add(s);
      }
    } else if (argv[i] === '--skip' && argv[i + 1]) {
      for (const s of argv[++i].split(',')) skip.add(s);
    }
    // 兼容旧 CLI
    else if (argv[i] === '--patch') { /* noop — 增量已是默认行为 */ }
    else if (argv[i] === '--full-search') { full.add('search'); }
    else if (argv[i] === '--skip-details') { skip.add('details'); }
    else if (argv[i] === '--skip-routes') { skip.add('routes'); }
  }

  return { full, skip };
}

// ─── 主入口 ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(60));
  console.log('Map 地理信息快照生成器');
  console.log('='.repeat(60));

  const args = parseArgs();
  const apiKey = readApiKey();
  const loc = readSimulatedLocation();
  console.log('\nAPI Key: configured');
  console.log(`当前模拟位置: (${loc.latitude}, ${loc.longitude})`);

  const stages = ['search', 'autocomplete', 'details', 'routes'];
  const modeDesc = stages.map(s => {
    if (args.skip.has(s)) return `${s}:跳过`;
    if (args.full.has(s)) return `${s}:全量`;
    return `${s}:增量`;
  });
  console.log(`模式: ${modeDesc.join(' | ')}`);

  console.log('\n[1] 从 tasks.py 提取搜索查询...');
  const queries = extractQueriesFromTasks();
  console.log(`  分类: ${[...queries.categoryTypes.values()].join(', ')}`);
  console.log(`  地名: ${queries.placeQueries.join(', ')}`);
  console.log(`  搜索提示输入: ${queries.autocompleteInputs.length} 个`);
  console.log(`  路线: ${queries.routePairs.map(([o, d]) => `${o}→${d}`).join(', ') || '无'}`);

  console.log('\n[2] 加载现有快照...');
  const snapshot = loadSnapshot(loc);
  console.log(`  已有 ${Object.keys(snapshot.places).length} POI, ${Object.keys(snapshot.searchIndex).length} 搜索索引, ${Object.keys(snapshot.autocompleteIndex).length} 搜索提示, ${Object.keys(snapshot.routes).length} 路线`);
  pruneDistantPlaces(snapshot, loc);

  if (!args.skip.has('search')) {
    console.log('\n[3] 搜索...');
    await runSearch(snapshot, queries, apiKey, loc, { full: args.full.has('search') });
    saveSnapshot(snapshot);
  } else {
    console.log('\n[3] 跳过搜索');
  }

  if (!args.skip.has('autocomplete')) {
    console.log('\n[4] 搜索提示...');
    await runAutocomplete(snapshot, queries, apiKey, loc, { full: args.full.has('autocomplete') });
    saveSnapshot(snapshot);
  } else {
    console.log('\n[4] 跳过搜索提示');
  }

  if (!args.skip.has('details')) {
    console.log('\n[5] 详情...');
    await runDetails(snapshot, apiKey, loc, { full: args.full.has('details') });
    saveSnapshot(snapshot);
  } else {
    console.log('\n[5] 跳过详情');
  }

  if (!args.skip.has('routes')) {
    console.log('\n[6] 路线...');
    await runRoutes(snapshot, queries, apiKey, loc, { full: args.full.has('routes') });
    saveSnapshot(snapshot);
  } else {
    console.log('\n[6] 跳过路线');
  }

  console.log('\n' + '='.repeat(60));
}

main().catch(e => { console.error('致命错误:', e); process.exit(1); });
