/** 证据基准：defaults 车型价表对应约 30.6km（s22）。 */
export const CATALOG_DISTANCE_KM = 30.6;

/** 起步价占目录长途价的比例；短途靠起步价拉开车型差距。 */
const BASE_RATIO = 0.22;
const MIN_BASE_FARE = 7;

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** 由目录一口价反推「起步价 + 每公里」费率，保证长途近似还原目录价。 */
export function deriveFareModel(catalogPrice: number): { base: number; perKm: number } {
  const base = round1(Math.max(MIN_BASE_FARE, catalogPrice * BASE_RATIO));
  const perKm = Math.max(0.4, (catalogPrice - base) / CATALOG_DISTANCE_KM);
  return { base, perKm };
}

/**
 * 按真实网约车结构估算当前里程一口价：
 * 起步价 + 里程费，短途也不会塌成同一地板价。
 */
export function scaleFare(catalogPrice: number, distanceKm: number): number {
  const { base, perKm } = deriveFareModel(catalogPrice);
  const km = Math.max(0.5, distanceKm);
  return round1(Math.max(base, base + perKm * km));
}

/**
 * 优惠额按「目录优惠 / 目录价」比例作用于当前一口价，
 * 短途仍能看出各车型优惠差异。
 */
export function scaleDiscount(
  catalogDiscount: number | null | undefined,
  distanceKm: number,
  catalogPrice?: number,
): number {
  if (catalogDiscount == null || catalogDiscount <= 0) return 0;
  if (catalogPrice != null && catalogPrice > 0) {
    const fare = scaleFare(catalogPrice, distanceKm);
    const ratio = catalogDiscount / catalogPrice;
    // 至少保留 1 元实付空间，避免优惠把价格吃光
    return round1(Math.min(Math.max(0.5, fare * ratio), Math.max(0, fare - 1)));
  }
  // 兼容旧调用：按里程比例缩放，并给短途一个可见下限
  const linear = catalogDiscount * (Math.max(0.5, distanceKm) / CATALOG_DISTANCE_KM);
  return round1(Math.max(0.5, linear));
}

export function estimateBand(
  catalogPrices: number[],
  distanceKm: number,
): { estMin: number; estMax: number } {
  if (catalogPrices.length === 0) {
    const mid = scaleFare(50, distanceKm);
    return { estMin: mid, estMax: mid };
  }
  const scaled = catalogPrices.map((price) => scaleFare(price, distanceKm));
  return {
    estMin: Math.min(...scaled),
    estMax: Math.max(...scaled),
  };
}

/** 接驾中：用行程里程派生稳定的「距上车点」展示。 */
export function pickupEta(distanceKm: number): { meters: number; minutes: number } {
  const meters = Math.max(180, Math.min(900, Math.round(220 + distanceKm * 40)));
  const minutes = Math.max(1, Math.round(meters / 280));
  return { meters, minutes };
}

/** 行程中剩余：未做进度模拟时，用整段里程/时长展示。 */
export function remainEta(distanceKm: number, durationMin: number): { meters: number; minutes: number } {
  const meters = Math.max(100, Math.round(distanceKm * 1000));
  const minutes = Math.max(1, durationMin);
  return { meters, minutes };
}

export function formatMeters(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)}公里` : `${meters}米`;
}
