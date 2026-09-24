/**
 * 真实路网算路。图工件由 apps/Didi/assets/build_road_graph.mjs 从 Map 应用的离线
 * Google 路线快照生成（9.4k 节点 / 11.1k 边，覆盖中心 52km 内）。图里只有 Google
 * 驾车路线的几何，人行道、过街天桥这类步行专用路段一概不收，算出来的路车一定能走。
 *
 * 全部计算都是确定性的：同一对起终点永远得到同一组候选路线，便于自动化断言。
 */
import type { DidiLatLng, DidiRouteOption, DidiRouteLabelKey } from './types';

type RoadGraphArtifact = {
  version: number;
  center: { lat: number; lng: number };
  quant: number;
  nodeCount: number;
  edgeCount: number;
  lat: number[];
  lng: number[];
  edgeA: number[];
  edgeB: number[];
};

type RoadGraph = {
  center: DidiLatLng;
  nodeLat: Float64Array;
  nodeLng: Float64Array;
  /** CSR：offsets[i]..offsets[i+1] 为节点 i 的出边区间 */
  offsets: Int32Array;
  targets: Int32Array;
  lengths: Float32Array;
  degree: Int32Array;
  cells: Map<string, number[]>;
};

const LAT_METERS = 111_194.9;
/** 空间索引网格边长(度)，约 550m，用于就近吸附。 */
const CELL_SIZE = 0.005;

/** 长直段按干道处理的阈值，以及对应的提速系数。 */
const ARTERIAL_SEGMENT_METERS = 200;
const ARTERIAL_SPEED_FACTOR = 1.25;
/** 计红绿灯的最小间距，避免把折线顶点当成路口。 */
const TRAFFIC_LIGHT_MIN_SPACING_METERS = 250;
const TRAFFIC_LIGHT_MIN_DEGREE = 4;
const SECONDS_PER_TRAFFIC_LIGHT = 12;
/** 高速路桥费：长直段累计超过此里程才收费。 */
const TOLL_FREE_FAST_KM = 5;
const TOLL_YUAN_PER_FAST_KM = 1.2;

/** 候选路线相对首选的最大放宽倍数，超过就不是「可选方案」而是绕路。 */
const MAX_CANDIDATE_RATIO = 1.6;
/** 与已有候选的路段重合率上限，超过视为同一条路。 */
const MAX_CANDIDATE_OVERLAP = 0.8;
const MAX_ROUTE_OPTIONS = 3;

let graph: RoadGraph | null = null;
let loading: Promise<RoadGraph | null> | null = null;

function lngMetersAt(lat: number) {
  return Math.cos((lat * Math.PI) / 180) * LAT_METERS;
}

export function metersBetween(a: DidiLatLng, b: DidiLatLng) {
  return Math.hypot(
    (a.lat - b.lat) * LAT_METERS,
    (a.lng - b.lng) * lngMetersAt((a.lat + b.lat) / 2),
  );
}

function cellKey(lat: number, lng: number) {
  return `${Math.floor(lat / CELL_SIZE)}:${Math.floor(lng / CELL_SIZE)}`;
}

function buildGraph(artifact: RoadGraphArtifact): RoadGraph {
  const { nodeCount, edgeCount, quant } = artifact;
  const nodeLat = new Float64Array(nodeCount);
  const nodeLng = new Float64Array(nodeCount);
  let latAcc = 0;
  let lngAcc = 0;
  for (let i = 0; i < nodeCount; i += 1) {
    latAcc += artifact.lat[i];
    lngAcc += artifact.lng[i];
    nodeLat[i] = latAcc * quant;
    nodeLng[i] = lngAcc * quant;
  }

  const edgeA = new Int32Array(edgeCount);
  let edgeAcc = 0;
  for (let i = 0; i < edgeCount; i += 1) {
    edgeAcc += artifact.edgeA[i];
    edgeA[i] = edgeAcc;
  }
  const edgeB = Int32Array.from(artifact.edgeB);

  const degree = new Int32Array(nodeCount);
  for (let i = 0; i < edgeCount; i += 1) {
    degree[edgeA[i]] += 1;
    degree[edgeB[i]] += 1;
  }

  const offsets = new Int32Array(nodeCount + 1);
  for (let i = 0; i < nodeCount; i += 1) offsets[i + 1] = offsets[i] + degree[i];
  const cursor = Int32Array.from(offsets.subarray(0, nodeCount));
  const targets = new Int32Array(edgeCount * 2);
  const lengths = new Float32Array(edgeCount * 2);

  for (let i = 0; i < edgeCount; i += 1) {
    const a = edgeA[i];
    const b = edgeB[i];
    const meters = Math.hypot(
      (nodeLat[a] - nodeLat[b]) * LAT_METERS,
      (nodeLng[a] - nodeLng[b]) * lngMetersAt(nodeLat[a]),
    );
    const slotA = cursor[a];
    cursor[a] += 1;
    targets[slotA] = b;
    lengths[slotA] = meters;
    const slotB = cursor[b];
    cursor[b] += 1;
    targets[slotB] = a;
    lengths[slotB] = meters;
  }

  const cells = new Map<string, number[]>();
  for (let i = 0; i < nodeCount; i += 1) {
    const key = cellKey(nodeLat[i], nodeLng[i]);
    const bucket = cells.get(key);
    if (bucket) bucket.push(i);
    else cells.set(key, [i]);
  }

  return {
    center: artifact.center,
    nodeLat,
    nodeLng,
    offsets,
    targets,
    lengths,
    degree,
    cells,
  };
}

/** 预热路网图。App 挂载时调用，选完终点时算路即可同步完成。 */
export function ensureRoadNetwork(): Promise<RoadGraph | null> {
  if (graph) return Promise.resolve(graph);
  if (!loading) {
    loading = import('./data/roadGraph.json')
      .then((module) => {
        const artifact = (module.default ?? module) as unknown as RoadGraphArtifact;
        graph = buildGraph(artifact);
        return graph;
      })
      .catch((error) => {
        console.error('[DiDi] 路网图加载失败，退回直线估算', error);
        return null;
      });
  }
  return loading;
}

export function isRoadNetworkReady() {
  return graph !== null;
}

function nearestNode(target: DidiLatLng): number | null {
  if (!graph) return null;
  const baseLat = Math.floor(target.lat / CELL_SIZE);
  const baseLng = Math.floor(target.lng / CELL_SIZE);
  let best: number | null = null;
  let bestDistance = Infinity;
  // 逐环扩大搜索，找到候选后再多搜一环，避免边界上漏掉更近的节点。
  for (let ring = 0; ring <= 40; ring += 1) {
    for (let di = -ring; di <= ring; di += 1) {
      for (let dj = -ring; dj <= ring; dj += 1) {
        if (Math.max(Math.abs(di), Math.abs(dj)) !== ring) continue;
        const bucket = graph.cells.get(`${baseLat + di}:${baseLng + dj}`);
        if (!bucket) continue;
        for (const node of bucket) {
          const distance = metersBetween(target, {
            lat: graph.nodeLat[node],
            lng: graph.nodeLng[node],
          });
          if (distance < bestDistance) {
            bestDistance = distance;
            best = node;
          }
        }
      }
    }
    if (best !== null && ring >= 1) break;
  }
  return best;
}

/** 把任意坐标吸附到最近的真实道路节点。 */
export function snapToRoad(target: DidiLatLng): DidiLatLng | null {
  const node = nearestNode(target);
  if (node === null || !graph) return null;
  return { lat: graph.nodeLat[node], lng: graph.nodeLng[node] };
}

function driveSpeedMetersPerSecond(segmentMeters: number, tripEstimateMeters: number) {
  // 行程越长，走干道/环路的比例越高，平均车速也越高。
  const baseKmh = tripEstimateMeters < 8_000 ? 30 : tripEstimateMeters < 20_000 ? 38 : 45;
  const kmh = segmentMeters >= ARTERIAL_SEGMENT_METERS
    ? baseKmh * ARTERIAL_SPEED_FACTOR
    : baseKmh;
  return (kmh * 1000) / 3600;
}

class MinHeap {
  private keys: number[] = [];

  private values: number[] = [];

  get size() {
    return this.keys.length;
  }

  push(key: number, value: number) {
    this.keys.push(key);
    this.values.push(value);
    let index = this.keys.length - 1;
    while (index > 0) {
      const parent = (index - 1) >> 1;
      if (this.keys[parent] <= this.keys[index]) break;
      this.swap(parent, index);
      index = parent;
    }
  }

  pop(): number | null {
    if (!this.keys.length) return null;
    const top = this.values[0];
    const lastKey = this.keys.pop() as number;
    const lastValue = this.values.pop() as number;
    if (this.keys.length) {
      this.keys[0] = lastKey;
      this.values[0] = lastValue;
      let index = 0;
      for (;;) {
        const left = index * 2 + 1;
        const right = left + 1;
        let smallest = index;
        if (left < this.keys.length && this.keys[left] < this.keys[smallest]) smallest = left;
        if (right < this.keys.length && this.keys[right] < this.keys[smallest]) smallest = right;
        if (smallest === index) break;
        this.swap(smallest, index);
        index = smallest;
      }
    }
    return top;
  }

  private swap(a: number, b: number) {
    const key = this.keys[a];
    this.keys[a] = this.keys[b];
    this.keys[b] = key;
    const value = this.values[a];
    this.values[a] = this.values[b];
    this.values[b] = value;
  }
}

type SearchOptions = {
  metric: 'time' | 'distance';
  penalties?: Map<number, number>;
  estimateMeters: number;
};

const edgeKey = (a: number, b: number) => (a < b ? a * 1e7 + b : b * 1e7 + a);

function shortestPath(from: number, to: number, options: SearchOptions): number[] | null {
  if (!graph) return null;
  const { offsets, targets, lengths } = graph;
  const nodeCount = graph.nodeLat.length;
  const cost = new Float64Array(nodeCount).fill(Infinity);
  const previous = new Int32Array(nodeCount).fill(-1);
  const settled = new Uint8Array(nodeCount);
  cost[from] = 0;
  const heap = new MinHeap();
  heap.push(0, from);

  while (heap.size) {
    const node = heap.pop() as number;
    if (settled[node]) continue;
    settled[node] = 1;
    if (node === to) break;
    for (let slot = offsets[node]; slot < offsets[node + 1]; slot += 1) {
      const next = targets[slot];
      if (settled[next]) continue;
      const meters = lengths[slot];
      let step = options.metric === 'time'
        ? meters / driveSpeedMetersPerSecond(meters, options.estimateMeters)
        : meters;
      if (options.penalties) {
        step *= options.penalties.get(edgeKey(node, next)) ?? 1;
      }
      const candidate = cost[node] + step;
      if (candidate < cost[next]) {
        cost[next] = candidate;
        previous[next] = node;
        heap.push(candidate, next);
      }
    }
  }

  if (cost[to] === Infinity) return null;
  const path: number[] = [to];
  while (path[path.length - 1] !== from) {
    const step = previous[path[path.length - 1]];
    if (step < 0) return null;
    path.push(step);
  }
  return path.reverse();
}

type PathMetrics = {
  meters: number;
  minutes: number;
  trafficLights: number;
  tollFee: number;
};

function measurePath(path: number[], estimateMeters: number): PathMetrics {
  if (!graph) return { meters: 0, minutes: 0, trafficLights: 0, tollFee: 0 };
  const { offsets, targets, lengths, degree } = graph;
  let meters = 0;
  let seconds = 0;
  let fastMeters = 0;
  let lights = 0;
  let sinceLight = 0;

  for (let i = 0; i < path.length - 1; i += 1) {
    const node = path[i];
    const next = path[i + 1];
    let segment = 0;
    for (let slot = offsets[node]; slot < offsets[node + 1]; slot += 1) {
      if (targets[slot] !== next) continue;
      segment = lengths[slot];
      break;
    }
    meters += segment;
    seconds += segment / driveSpeedMetersPerSecond(segment, estimateMeters);
    if (segment >= ARTERIAL_SEGMENT_METERS) fastMeters += segment;
    sinceLight += segment;
    const isJunction = degree[next] >= TRAFFIC_LIGHT_MIN_DEGREE;
    if (i < path.length - 2 && isJunction && sinceLight >= TRAFFIC_LIGHT_MIN_SPACING_METERS) {
      lights += 1;
      sinceLight = 0;
    }
  }

  const fastKm = fastMeters / 1000;
  const tollFee = fastKm > TOLL_FREE_FAST_KM
    ? Math.round((fastKm - TOLL_FREE_FAST_KM) * TOLL_YUAN_PER_FAST_KM)
    : 0;

  return {
    meters,
    minutes: Math.max(1, Math.round((seconds + lights * SECONDS_PER_TRAFFIC_LIGHT) / 60)),
    trafficLights: lights,
    tollFee,
  };
}

function pathToPoints(path: number[]): DidiLatLng[] {
  if (!graph) return [];
  return path.map((node) => ({ lat: graph!.nodeLat[node], lng: graph!.nodeLng[node] }));
}

function pathEdgeSet(path: number[]) {
  const set = new Set<number>();
  for (let i = 0; i < path.length - 1; i += 1) set.add(edgeKey(path[i], path[i + 1]));
  return set;
}

const LABEL_TEXT: Record<DidiRouteLabelKey, string> = {
  fastest: '时间最短',
  shortest: '距离最短',
  noToll: '无高速路桥费',
  fewLights: '红绿灯少',
  alternate: '备选路线',
};

type Candidate = PathMetrics & { path: number[]; edges: Set<number> };

function collectCandidates(from: number, to: number, estimateMeters: number): Candidate[] {
  const primaryPath = shortestPath(from, to, { metric: 'time', estimateMeters });
  if (!primaryPath) return [];
  const primary: Candidate = {
    path: primaryPath,
    edges: pathEdgeSet(primaryPath),
    ...measurePath(primaryPath, estimateMeters),
  };
  const candidates: Candidate[] = [primary];

  const attempts: SearchOptions[] = [
    {
      metric: 'time',
      estimateMeters,
      penalties: new Map([...primary.edges].map((key) => [key, 2.5])),
    },
    { metric: 'distance', estimateMeters },
    {
      metric: 'time',
      estimateMeters,
      penalties: new Map([...primary.edges].map((key) => [key, 4])),
    },
  ];

  for (const attempt of attempts) {
    if (candidates.length >= MAX_ROUTE_OPTIONS) break;
    const path = shortestPath(from, to, attempt);
    if (!path) continue;
    const edges = pathEdgeSet(path);
    const overlapsExisting = candidates.some((existing) => {
      let shared = 0;
      edges.forEach((key) => { if (existing.edges.has(key)) shared += 1; });
      return shared / Math.max(1, edges.size) > MAX_CANDIDATE_OVERLAP;
    });
    if (overlapsExisting) continue;
    const metrics = measurePath(path, estimateMeters);
    if (metrics.meters > primary.meters * MAX_CANDIDATE_RATIO) continue;
    if (metrics.minutes > primary.minutes * MAX_CANDIDATE_RATIO) continue;
    candidates.push({ path, edges, ...metrics });
  }

  return candidates;
}

function labelCandidates(candidates: Candidate[]): DidiRouteOption[] {
  const fastest = candidates.reduce((a, b) => (a.minutes <= b.minutes ? a : b));
  const shortest = candidates.reduce((a, b) => (a.meters <= b.meters ? a : b));
  const fewestLights = candidates.reduce((a, b) => (a.trafficLights <= b.trafficLights ? a : b));
  const ordered = [fastest, ...candidates.filter((candidate) => candidate !== fastest)];

  const used = new Set<DidiRouteLabelKey>();
  return ordered.map((candidate, index) => {
    let labelKey: DidiRouteLabelKey;
    if (candidate === fastest) {
      labelKey = 'fastest';
    } else if (candidate === shortest && !used.has('shortest')) {
      labelKey = 'shortest';
    } else if (candidate.tollFee === 0 && fastest.tollFee > 0 && !used.has('noToll')) {
      labelKey = 'noToll';
    } else if (candidate === fewestLights && !used.has('fewLights')) {
      labelKey = 'fewLights';
    } else {
      labelKey = 'alternate';
    }
    used.add(labelKey);
    return {
      id: `r${index + 1}`,
      labelKey,
      label: LABEL_TEXT[labelKey],
      recommended: index === 0,
      points: pathToPoints(candidate.path),
      distanceKm: Math.round((candidate.meters / 1000) * 10) / 10,
      durationMin: candidate.minutes,
      trafficLights: candidate.trafficLights,
      tollFee: candidate.tollFee,
    };
  });
}

/**
 * 计算 origin → dest 的候选路线（含途经点则按顺序串联各段）。
 * 路网未就绪时返回空数组，调用方需要有直线估算兜底。
 */
export function computeRouteOptions(
  origin: DidiLatLng,
  dest: DidiLatLng,
  waypoints: DidiLatLng[] = [],
): DidiRouteOption[] {
  if (!graph) return [];
  const stops = [origin, ...waypoints, dest];
  const nodes = stops.map((stop) => nearestNode(stop));
  if (nodes.some((node) => node === null)) return [];
  const nodeIds = nodes as number[];
  const estimateMeters = Math.max(
    300,
    stops.slice(1).reduce(
      (total, stop, index) => total + metersBetween(stops[index], stop),
      0,
    ) * 1.4,
  );

  if (nodeIds.length === 2) {
    const [from, to] = nodeIds;
    if (from === to) return [];
    return labelCandidates(collectCandidates(from, to, estimateMeters));
  }

  // 有途经点时，逐段取首选与次选并串联，得到两条整体不同的方案。
  const legs: Candidate[][] = [];
  for (let i = 0; i < nodeIds.length - 1; i += 1) {
    if (nodeIds[i] === nodeIds[i + 1]) continue;
    const legCandidates = collectCandidates(nodeIds[i], nodeIds[i + 1], estimateMeters);
    if (!legCandidates.length) return [];
    legs.push(legCandidates);
  }
  if (!legs.length) return [];

  const variants: Candidate[] = [];
  for (let variant = 0; variant < 2; variant += 1) {
    const path: number[] = [];
    let meters = 0;
    let minutes = 0;
    let trafficLights = 0;
    let tollFee = 0;
    legs.forEach((legCandidates) => {
      const leg = legCandidates[Math.min(variant, legCandidates.length - 1)];
      path.push(...(path.length ? leg.path.slice(1) : leg.path));
      meters += leg.meters;
      minutes += leg.minutes;
      trafficLights += leg.trafficLights;
      tollFee += leg.tollFee;
    });
    const edges = pathEdgeSet(path);
    const duplicate = variants.some((existing) => {
      let shared = 0;
      edges.forEach((key) => { if (existing.edges.has(key)) shared += 1; });
      return shared / Math.max(1, edges.size) > MAX_CANDIDATE_OVERLAP;
    });
    if (duplicate) continue;
    variants.push({ path, edges, meters, minutes, trafficLights, tollFee });
  }

  return labelCandidates(variants);
}

/**
 * 接驾路径：司机从附近某处沿真实道路驶向上车点。
 * 出发点按上车点坐标确定性推导，同一个上车点每次都得到同一条接驾路线。
 */
export function buildPickupApproachRoute(
  origin: DidiLatLng,
  approachMeters = 1_400,
): DidiRouteOption | null {
  if (!graph) return null;
  // 用坐标小数位做确定性方位，避免引入随机数。
  const seed = Math.abs(Math.round(origin.lat * 1e4) * 31 + Math.round(origin.lng * 1e4) * 17);
  let fallback: DidiRouteOption | null = null;
  // 直线偏移后吸附到的道路可能被河道/高架隔开，实际要绕很远。逐个方位试，
  // 取第一条里程接近 approachMeters 的，接驾距离才和「司机就在附近」相称。
  for (let step = 0; step < 8; step += 1) {
    const bearing = (((seed + step * 45) % 360) * Math.PI) / 180;
    const snapped = snapToRoad({
      lat: origin.lat + (Math.cos(bearing) * approachMeters) / LAT_METERS,
      lng: origin.lng + (Math.sin(bearing) * approachMeters) / lngMetersAt(origin.lat),
    });
    if (!snapped) continue;
    const route = computeRouteOptions(snapped, origin)[0];
    if (!route) continue;
    if (route.distanceKm <= (approachMeters / 1000) * 1.8) return route;
    if (!fallback || route.distanceKm < fallback.distanceKm) fallback = route;
  }
  return fallback;
}

export type RoadSegment = {
  a: DidiLatLng;
  b: DidiLatLng;
  meters: number;
};

/**
 * 取视口内的道路线段，用于自绘底图。
 *
 * 离线快照里唯一的真实底图是一张 z17、约 330×680m 的静态图，画城市尺度的路线时
 * 尺度差几十倍，折线会显得在楼里穿行。路网图本身就是真实道路几何，直接拿它画底图，
 * 底图和路线共用一套坐标，任何比例尺下都对得上。
 *
 * minMeters 用来在小比例尺下丢掉细支路，否则整屏会糊成一团。
 */
export function collectRoadSegments(
  box: { south: number; north: number; west: number; east: number },
  minMeters = 0,
): RoadSegment[] {
  if (!graph) return [];
  const {
    offsets, targets, lengths, nodeLat, nodeLng,
  } = graph;
  const segments: RoadSegment[] = [];
  for (let node = 0; node < nodeLat.length; node += 1) {
    const lat = nodeLat[node];
    const lng = nodeLng[node];
    for (let slot = offsets[node]; slot < offsets[node + 1]; slot += 1) {
      const next = targets[slot];
      // CSR 里每条边存了两遍，只取一遍。
      if (next < node) continue;
      const meters = lengths[slot];
      if (meters < minMeters) continue;
      const nextLat = nodeLat[next];
      const nextLng = nodeLng[next];
      if (Math.max(lat, nextLat) < box.south || Math.min(lat, nextLat) > box.north) continue;
      if (Math.max(lng, nextLng) < box.west || Math.min(lng, nextLng) > box.east) continue;
      segments.push({
        a: { lat, lng },
        b: { lat: nextLat, lng: nextLng },
        meters,
      });
    }
  }
  return segments;
}

/** 路网不可用时的兜底：按直线距离乘城市路网绕行系数。 */
export function estimateStraightLineKm(origin: DidiLatLng, dest: DidiLatLng) {
  return Math.round((metersBetween(origin, dest) / 1000) * 1.45 * 10) / 10;
}

/** 沿折线按进度取车辆位置，同时给出已驶过的折线片段。 */
export function pointAtProgress(points: DidiLatLng[], progress: number) {
  if (!points.length) return null;
  if (points.length === 1) return { position: points[0], traveled: [points[0]] };
  const clamped = Math.max(0, Math.min(1, progress));
  const spans: number[] = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i += 1) {
    const span = metersBetween(points[i], points[i + 1]);
    spans.push(span);
    total += span;
  }
  const target = total * clamped;
  let walked = 0;
  for (let i = 0; i < spans.length; i += 1) {
    if (walked + spans[i] >= target || i === spans.length - 1) {
      const ratio = spans[i] === 0 ? 0 : (target - walked) / spans[i];
      const position = {
        lat: points[i].lat + (points[i + 1].lat - points[i].lat) * ratio,
        lng: points[i].lng + (points[i + 1].lng - points[i].lng) * ratio,
      };
      return { position, traveled: [...points.slice(0, i + 1), position] };
    }
    walked += spans[i];
  }
  return { position: points[points.length - 1], traveled: [...points] };
}

/** 折线外接框，用于把整条路线装进视口。 */
export function routeBounds(points: DidiLatLng[]) {
  if (!points.length) return null;
  return points.reduce(
    (box, point) => ({
      south: Math.min(box.south, point.lat),
      north: Math.max(box.north, point.lat),
      west: Math.min(box.west, point.lng),
      east: Math.max(box.east, point.lng),
    }),
    {
      south: points[0].lat, north: points[0].lat, west: points[0].lng, east: points[0].lng,
    },
  );
}
