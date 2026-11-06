/** 搜索词 → 城市 / 关键词解析（全局搜索、历史 chip、城市选择共用）。 */

const CITIES_BY_LEN = [
  '呼和浩特', '乌鲁木齐', '哈尔滨', '石家庄', '连云港', '张家界', '秦皇岛',
  '长春', '长沙', '成都', '重庆', '上海', '北京', '杭州', '南京', '苏州', '无锡',
  '宁波', '温州', '嘉兴', '金华', '台州', '合肥', '福州', '厦门', '泉州',
  '南昌', '济南', '青岛', '烟台', '潍坊', '郑州', '武汉', '广州', '深圳',
  '珠海', '佛山', '东莞', '南宁', '海口', '三亚', '昆明', '贵阳', '拉萨',
  '西安', '兰州', '西宁', '银川', '太原', '天津', '沈阳', '大连',
  '常州', '徐州', '扬州', '洛阳', '开封', '桂林', '大理', '北海', '包头',
  '保定', '鞍山', '安庆', '澳门', '衢州', '中山', '九江',
].filter((c, i, arr) => arr.indexOf(c) === i)
  .sort((a, b) => b.length - a.length);

export const SEARCHABLE_CITIES = CITIES_BY_LEN;

export function resolveSearchCity(raw: string, fallback = '上海'): string {
  const text = String(raw || '').replace(/[·・]/g, ' ').trim();
  if (!text) return fallback;
  if (text.includes('西湖国际会议中心') || text.includes('国际会议中心')) return '杭州';
  for (const city of CITIES_BY_LEN) {
    if (text.includes(city)) return city;
  }
  return fallback;
}

/** 站点/机场是否匹配用户选择的城市（上海虹桥 ↔ 上海）。 */
export function routeStationMatches(station: string, wanted: string): boolean {
  if (!wanted) return true;
  const s = String(station || '');
  const w = String(wanted || '');
  if (s.includes(w) || w.includes(s)) return true;
  const sc = resolveSearchCity(s, '');
  const wc = resolveSearchCity(w, '');
  return Boolean(sc && wc && sc === wc);
}

/** 去掉城市名与品类噪声后的关键词（用于列表二次过滤）。 */
export function resolveSearchKeyword(raw: string, city: string): string {
  return String(raw || '')
    .replace(new RegExp(city, 'g'), ' ')
    .replace(/[·・]/g, ' ')
    .replace(/[（(][^)）]*[)）]/g, ' ')
    .replace(/酒店|民宿|客栈|机票|门票|景点|火车|车票|短租|钟点房|旅游|攻略/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 从「上海→潍坊」类标题拆出 from/to。 */
export function parseRouteTitle(title: string): { from?: string; to?: string } {
  const m = String(title || '').match(/(.+?)\s*[→\-—]\s*(.+)/);
  if (!m) return {};
  return { from: m[1].trim(), to: m[2].trim() };
}
