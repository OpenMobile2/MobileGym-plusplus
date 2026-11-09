import type { Recipient, ShipDraft, Address } from '../types';

/**
 * 静态计价(spec seed.pricing,冻结 v1.0.0):
 * - 首重价按目的省份分区(参考 a164 报价表 1-10 区)
 * - 计费重量 = max(实际重量, 长×宽×高÷8000)(阶段④订正:体积参与)
 * - 续重:每 +1kg 加 2 元(简化)
 * - 方式:到柜寄 +3 / 服务点自寄 +1;档位:尊享寄 12 起 / 寄大件 15 起
 * - 保价:500 档 +1 / 1000 档 +2 / 自定义 max(1, 价值×1%)
 */
const ZONE_BASE: Record<string, number> = {
  江苏省: 7, 浙江省: 7, 上海: 7.5, 安徽省: 7.5, 山东省: 8, 河南省: 8,
  北京: 8.5, 天津: 8.5, 河北省: 8.5, 福建省: 8.5, 江西省: 8.5, 湖北省: 8.5, 湖南省: 9,
  广东省: 9, 广西壮族自治区: 10, 四川省: 10, 重庆: 10, 贵州省: 10.5, 云南省: 11,
  陕西省: 10, 山西省: 9.5, 辽宁省: 10, 吉林省: 11, 黑龙江省: 11.5,
  海南省: 12, 甘肃省: 12, 青海省: 12.5, 宁夏回族自治区: 12, 内蒙古自治区: 12,
  新疆维吾尔自治区: 13.5, 西藏自治区: 13.5,
};

export function chargeWeight(r: Recipient): number {
  let w = r.weightKg;
  if (r.volumeOn) {
    const l = parseFloat(r.dims.l) || 0;
    const wd = parseFloat(r.dims.w) || 0;
    const h = parseFloat(r.dims.h) || 0;
    const volW = (l * wd * h) / 8000;
    if (volW > w) w = volW;
  }
  return Math.max(1, Math.ceil(w));
}

export function baseFeeFor(province: string, weight: number): number {
  const base = ZONE_BASE[province] ?? 9;
  return base + Math.max(0, weight - 1) * 2;
}

export function insuranceFee(draft: ShipDraft): number {
  if (draft.insurance === 'p500') return 1;
  if (draft.insurance === 'p1000') return 2;
  if (draft.insurance === 'custom') return Math.max(1, Math.round(draft.insuranceValue * 0.01));
  return 0;
}

export interface FeeBreakdown {
  base: number;
  methodExtra: number;
  insurance: number;
  total: number;
}

export function estimateFee(draft: ShipDraft, addresses: Address[]): FeeBreakdown | null {
  if (draft.recipients.length === 0) return null;
  let base = 0;
  for (const r of draft.recipients) {
    const addr = addresses.find((a) => a.id === r.addressId);
    let f = baseFeeFor(addr?.province ?? '', chargeWeight(r));
    if (draft.method === 'pickup') {
      if (draft.speedTier === 'premium') f = Math.max(f, 12);
      if (draft.speedTier === 'large') f = Math.max(f, 15);
      if (draft.speedTier === 'standard') f += 0.1; // 观测 r3:上门 7.1
    }
    base += f;
  }
  const methodExtra = draft.method === 'locker' ? 3 : draft.method === 'station' ? 1 : 0;
  const ins = insuranceFee(draft);
  const total = Math.round((base + methodExtra * draft.recipients.length + ins) * 10) / 10;
  return { base: Math.round(base * 10) / 10, methodExtra: methodExtra * draft.recipients.length, insurance: ins, total };
}
