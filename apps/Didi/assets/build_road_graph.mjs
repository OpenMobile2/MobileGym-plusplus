/**
 * 从 Map 应用的离线路线快照(apps/Map/data/routes.json)提取真实路网几何，
 * 生成 DiDi 算路用的紧凑路网图 apps/Didi/data/roadGraph.json。
 *
 *   node apps/Didi/assets/build_road_graph.mjs
 *
 * 快照里的 1681 条 Google 路线都是「当前位置 → 某个 POI」的放射状路径，未缝合时
 * 形成近似树的图(节点数≈边数)，任意两点算路会绕回中心且出不来第二条候选。
 * 把 STITCH_METERS 内属于不同路线的顶点缝成同一个路口后，交叉处产生环，仅靠
 * 839 条驾车折线就能全图连通并给出多条候选，所以步行几何一律不并入——否则算出
 * 来的路线会拐进人行道、过街天桥这类车开不了的路段。
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const APP_DIR = resolve(HERE, '..');
const ROUTES_PATH = resolve(APP_DIR, '../Map/data/routes.json');
const OUT_PATH = resolve(APP_DIR, 'data/roadGraph.json');
const PLACES_TS_PATH = resolve(APP_DIR, 'data/mapPlaces.ts');
const ANCHORS_PATH = resolve(APP_DIR, 'data/placeAnchors.json');
/** 云江市虚构 POI 数量。解析结果与此不符时报错，避免锚点静默漏生成。 */
const EXPECTED_FICTIONAL_PLACES = 24;
/** 两个锚点之间的最小间距，避免多个 POI collapse 到同一个路口。 */
const ANCHOR_MIN_SEPARATION_METERS = 150;

/** 节点量化精度(度)。2e-5 ≈ 2m，足以让不同路线在同一路口共用顶点。 */
const QUANT = 2e-5;
/**
 * 缝合半径：不同路线在同一路口的顶点可能相差十几米。只用驾车几何时 25m 会让
 * 24 组抽样里有 1 组出不来第二条路线，放到 40m 后全部覆盖。
 */
const STITCH_METERS = 40;
/**
 * 超过此长度的相邻点视为快照跳变，不建边。高速/环路的折线本身就有数公里的长直段，
 * 阈值给小了会切断远距离走廊，让远端 POI 掉出最大连通分量。
 */
const MAX_EDGE_METERS = 5_000;
const LAT_METERS = 111_194.9;

function decodePolyline(encoded) {
  const points = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    for (let axis = 0; axis < 2; axis += 1) {
      let shift = 0;
      let result = 0;
      let byte;
      do {
        byte = encoded.charCodeAt(index) - 63;
        index += 1;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      const delta = (result & 1) ? ~(result >> 1) : (result >> 1);
      if (axis === 0) lat += delta;
      else lng += delta;
    }
    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

function collectPolylines(snapshot) {
  const found = [];
  const visit = (node, path) => {
    if (Array.isArray(node)) {
      node.forEach((item, index) => visit(item, `${path}.${index}`));
      return;
    }
    if (!node || typeof node !== 'object') return;
    for (const [key, value] of Object.entries(node)) {
      if (key === 'encodedPolyline' && typeof value === 'string') {
        found.push({ path, encoded: value });
      } else {
        visit(value, `${path}.${key}`);
      }
    }
  };
  visit(snapshot.routes ?? snapshot, 'routes');
  return found;
}

const snapshot = JSON.parse(readFileSync(ROUTES_PATH, 'utf8'));
const center = snapshot.location;
const lngMeters = Math.cos((center.lat * Math.PI) / 180) * LAT_METERS;
const metersBetween = (a, b) => Math.hypot(
  (a[0] - b[0]) * LAT_METERS,
  (a[1] - b[1]) * lngMeters,
);

const polylines = collectPolylines(snapshot);
const isWalking = (path) => /WALK/i.test(path);

// ---- 1. 顶点去重 + 建边(只取驾车几何) ----
const nodeIndex = new Map(); // quantKey -> index
const nodeCoords = []; // [lat, lng]
const edgeMap = new Map(); // "a:b" -> { a, b }
/** 每个顶点出现在哪些折线里，缝合时用来排除同一条路自连。 */
const nodePolylines = new Map(); // nodeId -> Set<polylineId>

const quantKey = (point) => `${Math.round(point[0] / QUANT)}:${Math.round(point[1] / QUANT)}`;

function nodeIdFor(point) {
  const key = quantKey(point);
  const existing = nodeIndex.get(key);
  if (existing !== undefined) return existing;
  const id = nodeCoords.length;
  nodeIndex.set(key, id);
  nodeCoords.push(point);
  nodePolylines.set(id, new Set());
  return id;
}

function addEdge(a, b) {
  if (a === b) return;
  const key = a < b ? `${a}:${b}` : `${b}:${a}`;
  if (edgeMap.has(key)) return;
  edgeMap.set(key, { a: Math.min(a, b), b: Math.max(a, b) });
}

let drivePolylines = 0;
let walkPolylines = 0;
for (const { path, encoded } of polylines) {
  if (isWalking(path)) {
    walkPolylines += 1;
    continue;
  }
  const polylineId = drivePolylines;
  drivePolylines += 1;
  const points = decodePolyline(encoded);
  for (let i = 0; i < points.length - 1; i += 1) {
    if (metersBetween(points[i], points[i + 1]) > MAX_EDGE_METERS) continue;
    const a = nodeIdFor(points[i]);
    const b = nodeIdFor(points[i + 1]);
    nodePolylines.get(a).add(polylineId);
    nodePolylines.get(b).add(polylineId);
    addEdge(a, b);
  }
}
const geometryEdges = edgeMap.size;

// ---- 2. 缝合邻近路口 ----
// 经度方向一格恰好 STITCH_METERS，3x3 邻域必然覆盖半径内所有候选。
const CELL = STITCH_METERS / lngMeters;
const grid = new Map();
nodeCoords.forEach((coord, id) => {
  const key = `${Math.floor(coord[0] / CELL)}:${Math.floor(coord[1] / CELL)}`;
  const bucket = grid.get(key);
  if (bucket) bucket.push(id);
  else grid.set(key, [id]);
});

/** 两个顶点同属一条折线时缝合会抄掉这条路自己的弯道，直接跳过。 */
function sharesPolyline(a, b) {
  const left = nodePolylines.get(a);
  const right = nodePolylines.get(b);
  const [small, large] = left.size <= right.size ? [left, right] : [right, left];
  for (const id of small) {
    if (large.has(id)) return true;
  }
  return false;
}

for (let id = 0; id < nodeCoords.length; id += 1) {
  const coord = nodeCoords[id];
  const gi = Math.floor(coord[0] / CELL);
  const gj = Math.floor(coord[1] / CELL);
  for (let di = -1; di <= 1; di += 1) {
    for (let dj = -1; dj <= 1; dj += 1) {
      const bucket = grid.get(`${gi + di}:${gj + dj}`);
      if (!bucket) continue;
      for (const other of bucket) {
        if (other <= id) continue;
        if (metersBetween(coord, nodeCoords[other]) > STITCH_METERS) continue;
        if (sharesPolyline(id, other)) continue;
        addEdge(id, other);
      }
    }
  }
}
const stitchedEdges = edgeMap.size - geometryEdges;

// ---- 3. 只保留最大连通分量 ----
const adjacency = new Map();
for (const edge of edgeMap.values()) {
  if (!adjacency.has(edge.a)) adjacency.set(edge.a, []);
  if (!adjacency.has(edge.b)) adjacency.set(edge.b, []);
  adjacency.get(edge.a).push(edge.b);
  adjacency.get(edge.b).push(edge.a);
}

const component = new Map(); // nodeId -> componentId
let componentCount = 0;
const componentSizes = [];
for (const start of adjacency.keys()) {
  if (component.has(start)) continue;
  const id = componentCount;
  componentCount += 1;
  let size = 0;
  const stack = [start];
  while (stack.length) {
    const node = stack.pop();
    if (component.has(node)) continue;
    component.set(node, id);
    size += 1;
    for (const next of adjacency.get(node)) {
      if (!component.has(next)) stack.push(next);
    }
  }
  componentSizes.push(size);
}
const mainComponent = componentSizes.indexOf(Math.max(...componentSizes));

// ---- 4. 重编号 + 紧凑输出 ----
const remap = new Map();
const outLat = [];
const outLng = [];
for (let id = 0; id < nodeCoords.length; id += 1) {
  if (component.get(id) !== mainComponent) continue;
  remap.set(id, outLat.length);
  outLat.push(Math.round(nodeCoords[id][0] / QUANT));
  outLng.push(Math.round(nodeCoords[id][1] / QUANT));
}

const edgeA = [];
const edgeB = [];
for (const edge of edgeMap.values()) {
  const a = remap.get(edge.a);
  const b = remap.get(edge.b);
  if (a === undefined || b === undefined) continue;
  edgeA.push(a);
  edgeB.push(b);
}

/** 按索引升序做差分，绝大多数增量很小，JSON 体积随之下降。 */
function deltaEncode(values) {
  const out = new Array(values.length);
  let prev = 0;
  for (let i = 0; i < values.length; i += 1) {
    out[i] = values[i] - prev;
    prev = values[i];
  }
  return out;
}

const graph = {
  version: 2,
  source: 'apps/Map/data/routes.json',
  geometry: 'driving-only',
  center,
  quant: QUANT,
  nodeCount: outLat.length,
  edgeCount: edgeA.length,
  lat: deltaEncode(outLat),
  lng: deltaEncode(outLng),
  edgeA: deltaEncode(edgeA),
  edgeB,
};

writeFileSync(OUT_PATH, JSON.stringify(graph));
const sizeKb = Math.round(JSON.stringify(graph).length / 1024);

// ---- 5. 虚构 POI 重锚到真实路网节点 ----
// 云江市那 24 个 POI 原本只有画布像素坐标(mapX/mapY)和预置里程，两者严重不一致
// (机场声称 28.4km，像素坐标折算只有 0.47km)。这里按「预置里程 = 目标距离，
// 像素坐标方位 = 目标方位」在真实路网上挑一个节点，让地图、里程和价格口径一致。
const placesSource = readFileSync(PLACES_TS_PATH, 'utf8');
const fictionalPlaces = [...placesSource.matchAll(
  /\{[^{}]*?id:\s*'([^']+)'[^{}]*?name:\s*'([^']+)'[^{}]*?distanceKm:\s*([\d.]+)[^{}]*?mapX:\s*(-?[\d.]+),\s*mapY:\s*(-?[\d.]+)/gs,
)].map((match) => ({
  id: match[1],
  name: match[2],
  targetKm: Number(match[3]),
  mapX: Number(match[4]),
  mapY: Number(match[5]),
}));

if (fictionalPlaces.length !== EXPECTED_FICTIONAL_PLACES) {
  throw new Error(
    `mapPlaces.ts 解析到 ${fictionalPlaces.length} 个虚构 POI，预期 ${EXPECTED_FICTIONAL_PLACES}。`
    + '请同步更新 build_road_graph.mjs 的解析规则。',
  );
}

const nodeGeo = [];
for (let i = 0; i < outLat.length; i += 1) {
  const lat = outLat[i] * QUANT;
  const lng = outLng[i] * QUANT;
  const dLat = (lat - center.lat) * LAT_METERS;
  const dLng = (lng - center.lng) * lngMeters;
  nodeGeo.push({
    lat,
    lng,
    meters: Math.hypot(dLat, dLng),
    bearing: Math.atan2(dLng, dLat), // 0 = 正北，顺时针为正
  });
}
const graphRadiusMeters = Math.max(...nodeGeo.map((node) => node.meters));

const angleGap = (a, b) => {
  const diff = Math.abs(a - b) % (Math.PI * 2);
  return diff > Math.PI ? Math.PI * 2 - diff : diff;
};

const anchors = {};
const claimed = [];
// 由近到远分配：近距离 POI 的可选节点更密，先占位不会挤掉远距离目标。
for (const place of [...fictionalPlaces].sort((left, right) => left.targetKm - right.targetKm)) {
  // 画布 y 轴向下为南，取负得到「北为正」的方位。
  const targetBearing = Math.atan2(place.mapX - 426, -(place.mapY - 438));
  const targetMeters = Math.min(place.targetKm * 1000, graphRadiusMeters * 0.98);
  // 跨城 POI 的声明里程超出快照范围，此时优先「尽量远」，方位只作次要参考，
  // 否则会被拉回到二十公里出头，丢掉跨城的量级。
  const clampedTarget = place.targetKm * 1000 > graphRadiusMeters * 0.98;
  const distanceWeight = clampedTarget ? 8 : 2;
  let best = null;
  let bestScore = Infinity;
  for (let i = 0; i < nodeGeo.length; i += 1) {
    const node = nodeGeo[i];
    if (claimed.some((taken) => Math.hypot(
      (node.lat - taken.lat) * LAT_METERS,
      (node.lng - taken.lng) * lngMeters,
    ) < ANCHOR_MIN_SEPARATION_METERS)) continue;
    const distanceScore = Math.abs(node.meters - targetMeters) / Math.max(targetMeters, 500);
    const score = distanceScore * distanceWeight + angleGap(node.bearing, targetBearing);
    if (score < bestScore) {
      bestScore = score;
      best = { index: i, ...node };
    }
  }
  if (!best) throw new Error(`无法为 ${place.id} 找到锚点`);
  claimed.push(best);
  anchors[place.id] = {
    lat: Number(best.lat.toFixed(6)),
    lng: Number(best.lng.toFixed(6)),
    anchoredKm: Number((best.meters / 1000).toFixed(2)),
    targetKm: place.targetKm,
  };
}

writeFileSync(ANCHORS_PATH, `${JSON.stringify({
  version: 1,
  note: '由 apps/Didi/assets/build_road_graph.mjs 生成，请勿手改',
  center,
  graphRadiusKm: Number((graphRadiusMeters / 1000).toFixed(1)),
  anchors,
}, null, 2)}\n`);

const clamped = fictionalPlaces
  .filter((place) => place.targetKm * 1000 > graphRadiusMeters * 0.98)
  .map((place) => `${place.name}(${place.targetKm}km)`);

console.log(`polylines      ${polylines.length} (drive ${drivePolylines} used / walk ${walkPolylines} skipped)`);
console.log(`geometry edges ${geometryEdges}`);
console.log(`stitched edges ${stitchedEdges} (radius ${STITCH_METERS}m, cross-polyline only)`);
console.log(`components     ${componentCount}, largest ${Math.max(...componentSizes)}`);
console.log(`kept           ${graph.nodeCount} nodes / ${graph.edgeCount} edges`);
console.log(`written        ${OUT_PATH} (${sizeKb} KB)`);
console.log(`graph radius   ${(graphRadiusMeters / 1000).toFixed(1)} km`);
console.log(`anchors        ${Object.keys(anchors).length} places -> ${ANCHORS_PATH}`);
if (clamped.length) {
  console.log(`  clamped to graph radius: ${clamped.join(', ')}`);
}
const drift = Object.entries(anchors)
  .map(([id, a]) => ({ id, delta: Math.abs(a.anchoredKm - Math.min(a.targetKm, graphRadiusMeters / 1000)) }))
  .sort((left, right) => right.delta - left.delta)[0];
console.log(`  worst distance drift: ${drift.id} ${drift.delta.toFixed(2)} km`);
