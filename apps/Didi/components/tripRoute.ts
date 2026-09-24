export type RoutePose = {
  x: number;
  y: number;
  angle: number;
};

type Point = { x: number; y: number };

/** 与 MapCanvas 渲染一致的三次贝塞尔段（上车点 → 目的地）。 */
const CUBIC_SEGMENTS: Array<{ p0: Point; p1: Point; p2: Point; p3: Point }> = [
  {
    p0: { x: 76, y: 229 },
    p1: { x: 93, y: 209 },
    p2: { x: 103, y: 190 },
    p3: { x: 111, y: 166 },
  },
  {
    p0: { x: 111, y: 166 },
    p1: { x: 122, y: 136 },
    p2: { x: 145, y: 113 },
    p3: { x: 170, y: 96 },
  },
  {
    p0: { x: 170, y: 96 },
    p1: { x: 188, y: 83 },
    p2: { x: 206, y: 78 },
    p3: { x: 230, y: 73 },
  },
  {
    p0: { x: 230, y: 73 },
    p1: { x: 246, y: 69 },
    p2: { x: 257, y: 57 },
    p3: { x: 260, y: 39 },
  },
];

function cubicPoint(seg: (typeof CUBIC_SEGMENTS)[number], t: number): Point {
  const u = 1 - t;
  const uu = u * u;
  const tt = t * t;
  return {
    x: uu * u * seg.p0.x + 3 * uu * t * seg.p1.x + 3 * u * tt * seg.p2.x + tt * t * seg.p3.x,
    y: uu * u * seg.p0.y + 3 * uu * t * seg.p1.y + 3 * u * tt * seg.p2.y + tt * t * seg.p3.y,
  };
}

function cubicTangent(seg: (typeof CUBIC_SEGMENTS)[number], t: number): Point {
  const u = 1 - t;
  return {
    x: 3 * u * u * (seg.p1.x - seg.p0.x)
      + 6 * u * t * (seg.p2.x - seg.p1.x)
      + 3 * t * t * (seg.p3.x - seg.p2.x),
    y: 3 * u * u * (seg.p1.y - seg.p0.y)
      + 6 * u * t * (seg.p2.y - seg.p1.y)
      + 3 * t * t * (seg.p3.y - seg.p2.y),
  };
}

const SAMPLES_PER_SEGMENT = 32;
type ArcSample = { segIndex: number; t: number; length: number };

const ARC_TABLE: ArcSample[] = (() => {
  const table: ArcSample[] = [{ segIndex: 0, t: 0, length: 0 }];
  let length = 0;
  let prev = cubicPoint(CUBIC_SEGMENTS[0], 0);
  for (let s = 0; s < CUBIC_SEGMENTS.length; s += 1) {
    const seg = CUBIC_SEGMENTS[s];
    for (let i = 1; i <= SAMPLES_PER_SEGMENT; i += 1) {
      const t = i / SAMPLES_PER_SEGMENT;
      const point = cubicPoint(seg, t);
      length += Math.hypot(point.x - prev.x, point.y - prev.y);
      table.push({ segIndex: s, t, length });
      prev = point;
    }
  }
  return table;
})();

const TOTAL_LENGTH = ARC_TABLE[ARC_TABLE.length - 1].length;

/** 供调试/旧引用：沿曲线均匀采样的折线点。 */
export const TRIP_ROUTE_POINTS = ARC_TABLE
  .filter((_, index) => index % 4 === 0 || index === ARC_TABLE.length - 1)
  .map((entry) => cubicPoint(CUBIC_SEGMENTS[entry.segIndex], entry.t));

/** progress: 0=上车点, 1=目的地（按弧长，与 strokeDasharray pathLength=1 对齐） */
export function poseAlongRoute(progress: number): RoutePose {
  const target = TOTAL_LENGTH * Math.max(0, Math.min(1, progress));
  if (target <= 0) {
    const tangent = cubicTangent(CUBIC_SEGMENTS[0], 0.001);
    return {
      x: CUBIC_SEGMENTS[0].p0.x,
      y: CUBIC_SEGMENTS[0].p0.y,
      angle: (Math.atan2(tangent.y, tangent.x) * 180) / Math.PI,
    };
  }
  let index = 1;
  while (index < ARC_TABLE.length && ARC_TABLE[index].length < target) {
    index += 1;
  }
  const curr = ARC_TABLE[Math.min(index, ARC_TABLE.length - 1)];
  const prev = ARC_TABLE[Math.max(0, index - 1)];
  const span = curr.length - prev.length;
  const u = span <= 0 ? 1 : (target - prev.length) / span;

  let segIndex = curr.segIndex;
  let sampleT = curr.t;
  if (prev.segIndex === curr.segIndex) {
    sampleT = prev.t + (curr.t - prev.t) * u;
    segIndex = curr.segIndex;
  } else if (u < 1) {
    // 刚进入新段
    sampleT = curr.t * u;
    segIndex = curr.segIndex;
  }

  const point = cubicPoint(CUBIC_SEGMENTS[segIndex], sampleT);
  const tangent = cubicTangent(
    CUBIC_SEGMENTS[segIndex],
    Math.min(0.999, Math.max(0.001, sampleT)),
  );
  return {
    x: point.x,
    y: point.y,
    angle: (Math.atan2(tangent.y, tangent.x) * 180) / Math.PI,
  };
}

/** 渲染用平滑曲线（与历史 MapCanvas 证据路线一致）。 */
export function routePathD(): string {
  return 'M76 229C93 209 103 190 111 166C122 136 145 113 170 96C188 83 206 78 230 73C246 69 257 57 260 39';
}

/** 接驾：司机从路线中段驶向上车点（progress 1→0）。 */
export function pickupProgressToRoute(progress: number): number {
  const t = Math.max(0, Math.min(1, progress));
  return 0.42 * (1 - t);
}

/** 行程：从上车点驶向目的地。 */
export function tripProgressToRoute(progress: number): number {
  return Math.max(0, Math.min(1, progress));
}
