import type { DidiOrder, DidiState } from './types';

const SERVICE_PATTERNS: Record<string, RegExp> = {
  '打车': /快车|特快|专车|出租车|拼车|优享|六座|豪华车/,
  '骑行': /骑行|单车|电单车/,
  '顺风车': /顺风车/,
  '代驾': /代驾/,
  '加油': /加油/,
  '公交地铁': /公交|地铁/,
  '包车': /包车/,
  '站点巴士': /巴士/,
  '租车': /租车/,
  '火车票': /火车|高铁/,
  '充电': /充电/,
  '景点门票': /景点|门票/,
};

export function matchesOrderServiceFilters(order: DidiOrder, selected: string[]): boolean {
  if (selected.length === 0) return true;
  return selected.some((service) => {
    const pattern = SERVICE_PATTERNS[service];
    return pattern ? pattern.test(order.carType) : order.carType === service;
  });
}

export function matchesOrderStatusFilter(order: DidiOrder, filter: DidiState['tripsTab']): boolean {
  if (filter === 'all') return true;
  if (filter === 'unrated') return order.status === 'completed' && !order.rated;
  return order.status === filter;
}
