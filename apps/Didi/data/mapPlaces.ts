import offlineMapSnapshotJson from '../../Map/data/places.json';
import placeAnchorsJson from './placeAnchors.json';

type PlaceAnchor = { lat: number; lng: number; anchoredKm: number; targetKm: number };
const PLACE_ANCHORS = placeAnchorsJson.anchors as Record<string, PlaceAnchor>;

export type DidiPlaceCategory =
  | 'residence'
  | 'station'
  | 'airport'
  | 'mall'
  | 'office'
  | 'park'
  | 'hotel'
  | 'hospital'
  | 'school'
  | 'landmark'
  | 'restaurant';

export type DidiPickupPoint = {
  id: string;
  name: string;
  detail: string;
  walkMinutes: number;
  x: number;
  y: number;
  official?: boolean;
};

export type DidiMapPlace = {
  id: string;
  city: string;
  district: string;
  name: string;
  address: string;
  category: DidiPlaceCategory;
  distanceKm: number;
  aliases: string[];
  keywords: string[];
  mapX: number;
  mapY: number;
  metro?: string;
  favorite?: boolean;
  recommended?: boolean;
  pickupPoints?: DidiPickupPoint[];
  lat?: number;
  lng?: number;
  source?: 'didi' | 'offline-google-map';
};

export type MapMarkerOption = {
  id: string;
  label: string;
  detail: string;
  x: number;
  y: number;
  recommended?: boolean;
};

const places: DidiMapPlace[] = [
  {
    id: 'poi_yunxi',
    city: '云江市',
    district: '望北区',
    name: '云溪苑',
    address: '云江市望北区云溪街18号',
    category: 'residence',
    distanceKm: 0.1,
    aliases: ['云溪小区', '云溪苑东北门'],
    keywords: ['yunxiyuan', 'yxy', '家', '小区', '住宅'],
    mapX: 426,
    mapY: 438,
    favorite: true,
    recommended: true,
    pickupPoints: [
      { id: 'yunxi_ne', name: '云溪苑-东北门(邻里便民超市旁)', detail: '东北门外侧临时停靠区', walkMinutes: 1, x: 180, y: 130, official: true },
      { id: 'yunxi_n', name: '云溪苑-北门', detail: '云溪街北门公交站旁', walkMinutes: 3, x: 126, y: 92 },
      { id: 'yunxi_e', name: '云溪苑-东门', detail: '东门快递柜对面', walkMinutes: 4, x: 235, y: 112 },
      { id: 'yunxi_shop', name: '邻里便民超市', detail: '超市停车场出口', walkMinutes: 5, x: 213, y: 188 },
    ],
  },
  {
    id: 'poi_yunjiang_east',
    city: '云江市',
    district: '云湾新区',
    name: '云江东站',
    address: '云江市云湾新区团结大道1号',
    category: 'station',
    distanceKm: 0.62,
    aliases: ['东站', '云江火车站', '云江高铁站'],
    keywords: ['yunjiangdongzhan', 'yjdz', 'dongzhan', '高铁', '火车站', '车站'],
    mapX: 548,
    mapY: 405,
    metro: '轨道交通6号线',
    recommended: true,
    pickupPoints: [
      { id: 'east_west_ground', name: '云江东站-西广场-地面停车场-网约车上车点', detail: '官方推荐·步行引导至地面停车场', walkMinutes: 3, x: 180, y: 130, official: true },
      { id: 'east_west_arrival', name: '云江东站西广场-到达层', detail: '西广场到达层3号门外', walkMinutes: 5, x: 128, y: 96 },
      { id: 'east_east_arrival', name: '云江东站东广场-到达层', detail: '东广场网约车即停区', walkMinutes: 7, x: 238, y: 112 },
      { id: 'east_south', name: '云江东站-南一门', detail: '南一门公交港湾旁', walkMinutes: 8, x: 205, y: 188 },
    ],
  },
  {
    id: 'poi_leyou',
    city: '云江市',
    district: '望北区',
    name: '乐游城(滨湖店)',
    address: '云江市望北区滨湖大道408号',
    category: 'mall',
    distanceKm: 2.2,
    aliases: ['乐游城', '滨湖乐游城'],
    keywords: ['leyoucheng', 'lyc', '商场', '购物中心', '滨湖'],
    mapX: 360,
    mapY: 520,
    favorite: true,
    recommended: true,
    pickupPoints: [
      { id: 'leyou_north', name: '乐游城-北门', detail: '北门网约车即停区', walkMinutes: 2, x: 180, y: 130, official: true },
      { id: 'leyou_east', name: '乐游城-东门', detail: '东门旋转门外侧', walkMinutes: 4, x: 236, y: 108 },
      { id: 'leyou_b1', name: '乐游城-B1停车场出口', detail: 'B1层网约车候客区', walkMinutes: 6, x: 136, y: 96 },
      { id: 'leyou_hotel', name: '滨湖大道-云泊酒店门口', detail: '酒店礼宾台外侧', walkMinutes: 7, x: 211, y: 188 },
    ],
  },
  {
    id: 'poi_star_plaza',
    city: '云江市',
    district: '望北区',
    name: '星辰广场(西湖店)',
    address: '云江市望北区西湖连廊66号',
    category: 'office',
    distanceKm: 7.2,
    aliases: ['星辰广场', '星辰大厦'],
    keywords: ['xingchengguangchang', 'xcgc', '公司', '写字楼', '西湖'],
    mapX: 292,
    mapY: 362,
    favorite: true,
    pickupPoints: [
      { id: 'star_gate2', name: '星辰广场-2号门', detail: '2号门外侧落客区', walkMinutes: 2, x: 180, y: 130, official: true },
      { id: 'star_gate3', name: '星辰广场-3号门(阅光书店旁)', detail: '阅光书店路侧停车位', walkMinutes: 4, x: 128, y: 104 },
      { id: 'star_south', name: '星辰广场-南门', detail: '南门访客中心外', walkMinutes: 5, x: 226, y: 173 },
    ],
  },
  {
    id: 'poi_qingshiqiao',
    city: '云江市',
    district: '桥东区',
    name: '青石桥-地铁站',
    address: '云江市桥东区青石路与云杉路交叉口',
    category: 'station',
    distanceKm: 0.34,
    aliases: ['青石桥站', '青石桥地铁'],
    keywords: ['qingshiqiao', 'qsq', '地铁', '轨道交通'],
    mapX: 482,
    mapY: 468,
    metro: '轨道交通3号线/9号线',
    recommended: true,
  },
  {
    id: 'poi_cloud_wetland',
    city: '云江市',
    district: '云湾新区',
    name: '云湾湿地公园',
    address: '云江市云湾新区滨江生态廊道',
    category: 'park',
    distanceKm: 3.8,
    aliases: ['湿地公园', '云湾公园'],
    keywords: ['yunwanshidi', 'ywsd', '公园', '绿地', '滨江'],
    mapX: 515,
    mapY: 510,
    favorite: true,
  },
  {
    id: 'poi_expo',
    city: '云江市',
    district: '云湾新区',
    name: '云湾国际会展中心',
    address: '云江市云湾新区会展大道88号',
    category: 'landmark',
    distanceKm: 5.6,
    aliases: ['会展中心', '云湾会展'],
    keywords: ['huizhan', 'yunwanhuizhan', 'ywhz', '展馆'],
    mapX: 606,
    mapY: 486,
    recommended: true,
  },
  {
    id: 'poi_first_hospital',
    city: '云江市',
    district: '望北区',
    name: '云江市第一医院',
    address: '云江市望北区仁和路126号',
    category: 'hospital',
    distanceKm: 4.7,
    aliases: ['第一医院', '云江一院'],
    keywords: ['yunjiangyiyuan', 'yjyy', '医院', '急诊'],
    mapX: 338,
    mapY: 442,
  },
  {
    id: 'poi_university',
    city: '云江市',
    district: '桥东区',
    name: '云江大学',
    address: '云江市桥东区学府路9号',
    category: 'school',
    distanceKm: 8.6,
    aliases: ['云大', '云江大学东门'],
    keywords: ['yunjiangdaxue', 'yjd', '大学', '学校', '校园'],
    mapX: 660,
    mapY: 376,
    favorite: true,
  },
  {
    id: 'poi_civic_center',
    city: '云江市',
    district: '云湾新区',
    name: '云江市民中心',
    address: '云江市云湾新区云河大道100号',
    category: 'landmark',
    distanceKm: 6.1,
    aliases: ['市民中心', '政务中心'],
    keywords: ['shiminzhongxin', 'smzx', '政务', '办事大厅'],
    mapX: 580,
    mapY: 350,
  },
  {
    id: 'poi_sunrise',
    city: '云江市',
    district: '望北区',
    name: '晨曦雅苑',
    address: '云江市望北区晨曦路28号',
    category: 'residence',
    distanceKm: 1.1,
    aliases: ['晨曦小区'],
    keywords: ['chenxiyayuan', 'cxyy', '小区', '住宅'],
    mapX: 455,
    mapY: 414,
  },
  {
    id: 'poi_wutong',
    city: '云江市',
    district: '桥东区',
    name: '梧桐里·9号门',
    address: '云江市桥东区云杉大道71-附68号',
    category: 'residence',
    distanceKm: 4.4,
    aliases: ['梧桐里', '梧桐里九号门'],
    keywords: ['wutongli', 'wtl', '小区', '住宅'],
    mapX: 635,
    mapY: 438,
  },
  {
    id: 'poi_south_station',
    city: '云江市',
    district: '南城区',
    name: '云江南站',
    address: '云江市南城区站前大道6号',
    category: 'station',
    distanceKm: 14.8,
    aliases: ['南站', '云江南高铁站'],
    keywords: ['yunjiangnanzhan', 'yjnz', '高铁', '火车站'],
    mapX: 470,
    mapY: 735,
    metro: '轨道交通2号线',
  },
  {
    id: 'poi_airport',
    city: '云江市',
    district: '临空区',
    name: '云江云麓国际机场T1航站楼',
    address: '云江市临空区云麓机场大道1号',
    category: 'airport',
    distanceKm: 28.4,
    aliases: ['云江机场', '云麓机场', 'T1航站楼'],
    keywords: ['yunjiangjichang', 'yjjc', 'airport', '飞机', '航站楼'],
    mapX: 820,
    mapY: 180,
    recommended: true,
    pickupPoints: [
      { id: 'airport_t1_gate4', name: 'T1航站楼-4号门-网约车上车区', detail: '官方推荐·P2停车楼连廊', walkMinutes: 6, x: 180, y: 130, official: true },
      { id: 'airport_t1_p2', name: 'T1-P2停车楼-B区', detail: '网约车专用候客区', walkMinutes: 8, x: 232, y: 102 },
      { id: 'airport_t1_departure', name: 'T1出发层-6号门', detail: '仅限即停即走', walkMinutes: 4, x: 128, y: 104 },
    ],
  },
  {
    id: 'poi_tech_park',
    city: '云江市',
    district: '高新区',
    name: '云江智谷科技园',
    address: '云江市高新区星河路99号',
    category: 'office',
    distanceKm: 11.6,
    aliases: ['智谷', '云江科技园'],
    keywords: ['zhigu', 'yjkjy', '科技园', '写字楼'],
    mapX: 720,
    mapY: 548,
  },
  {
    id: 'poi_sports',
    city: '云江市',
    district: '南城区',
    name: '云江奥体中心',
    address: '云江市南城区跃湖路18号',
    category: 'landmark',
    distanceKm: 12.3,
    aliases: ['奥体', '体育中心'],
    keywords: ['aotizhongxin', 'atzx', '体育场', '演唱会'],
    mapX: 550,
    mapY: 680,
  },
  {
    id: 'poi_museum',
    city: '云江市',
    district: '桥东区',
    name: '云江博物馆',
    address: '云江市桥东区文澜路36号',
    category: 'landmark',
    distanceKm: 6.9,
    aliases: ['市博物馆'],
    keywords: ['yunjiangbowuguan', 'yjbg', '博物馆', '展览'],
    mapX: 624,
    mapY: 330,
  },
  {
    id: 'poi_yunbo_hotel',
    city: '云江市',
    district: '望北区',
    name: '云泊酒店(滨湖店)',
    address: '云江市望北区滨湖大道388号',
    category: 'hotel',
    distanceKm: 2.6,
    aliases: ['云泊酒店', '滨湖云泊'],
    keywords: ['yunbojiudian', 'ybjd', '酒店', '住宿'],
    mapX: 380,
    mapY: 548,
  },
  {
    id: 'poi_morning_market',
    city: '云江市',
    district: '望北区',
    name: '晨光批发超市(明珠店)',
    address: '云江市望北区明珠路76号',
    category: 'mall',
    distanceKm: 3.1,
    aliases: ['晨光超市', '明珠店'],
    keywords: ['chenguangchaoshi', 'cgcs', '超市', '购物'],
    mapX: 318,
    mapY: 486,
  },
  {
    id: 'poi_old_stove',
    city: '云江市',
    district: '桥东区',
    name: '老灶火锅(青年广场店)',
    address: '云江市桥东区青年路55号',
    category: 'restaurant',
    distanceKm: 6.4,
    aliases: ['老灶火锅', '青年广场店'],
    keywords: ['laozaohuoguo', 'lzhg', '火锅', '餐厅', '美食'],
    mapX: 590,
    mapY: 470,
  },
  {
    id: 'poi_linhai_airport',
    city: '临海市',
    district: '海滨区',
    name: '临海星湾国际机场T2航站楼',
    address: '临海市海滨区星湾机场路2号',
    category: 'airport',
    distanceKm: 268.5,
    aliases: ['临海机场', '星湾机场'],
    keywords: ['linhaijichang', 'lhjc', 'airport', '飞机', '航站楼'],
    mapX: 930,
    mapY: 790,
  },
  {
    id: 'poi_linhai_sea',
    city: '临海市',
    district: '海棠区',
    name: '星湾国际海滨公园',
    address: '临海市海棠区海岸大道66号',
    category: 'park',
    distanceKm: 272.1,
    aliases: ['星湾海滨', '海滨公园'],
    keywords: ['xingwanhaibin', 'xwhb', '公园', '海边', '景区'],
    mapX: 965,
    mapY: 825,
  },
  {
    id: 'poi_linhai_resort',
    city: '临海市',
    district: '海棠区',
    name: '云帆湾度假酒店',
    address: '临海市海棠区云帆湾路8号',
    category: 'hotel',
    distanceKm: 276.8,
    aliases: ['云帆湾', '云帆酒店'],
    keywords: ['yunfanwan', 'yfw', '酒店', '度假'],
    mapX: 988,
    mapY: 850,
  },
  {
    id: 'poi_nanyu_station',
    city: '南屿市',
    district: '中心区',
    name: '南屿中心站',
    address: '南屿市中心区长风大道1号',
    category: 'station',
    distanceKm: 186.4,
    aliases: ['南屿站', '南屿高铁站'],
    keywords: ['nanyuzhan', 'nyz', '高铁', '火车站'],
    mapX: 120,
    mapY: 850,
    metro: '轨道交通1号线',
  },
];

type BiText = { zh?: string; en?: string };
type OfflineMapPlaceRow = {
  placeId: string;
  name: string | BiText;
  lat: number;
  lng: number;
  types?: string[];
  primaryType?: string;
  formattedAddress?: string | BiText;
  distanceMeters?: number;
};
type OfflineMapSnapshot = {
  location: { lat: number; lng: number };
  places: Record<string, OfflineMapPlaceRow>;
};

const offlineMapSnapshot = offlineMapSnapshotJson as unknown as OfflineMapSnapshot;

export const DIDI_OFFLINE_MAP_CENTER = {
  lat: offlineMapSnapshot.location.lat,
  lng: offlineMapSnapshot.location.lng,
} as const;

// 地点搜索使用 z17 的完整 2km 数据圈；地图瓦片完整覆盖层级为 z15-z17。
export const DIDI_OFFLINE_PLACE_RADIUS_METERS = 2_000;
export const DIDI_OFFLINE_MAP_MIN_ZOOM = 15;
export const DIDI_OFFLINE_MAP_MAX_ZOOM = 17;

export function getDidiOfflineMapPanRadius(zoom: number) {
  if (zoom >= 17) return 2_000;
  return 3_000;
}

function isInsideOfflineMapBounds(lat: number, lng: number) {
  return distanceBetweenMapPoints(
    { lat, lng },
    DIDI_OFFLINE_MAP_CENTER,
  ) <= DIDI_OFFLINE_PLACE_RADIUS_METERS;
}

const CATEGORY_KEYWORDS: Record<DidiPlaceCategory, string[]> = {
  residence: ['住宅', '小区', '社区'],
  station: ['地铁', '车站', '公交', '交通'],
  airport: ['机场', '航站楼'],
  mall: ['商场', '购物', '超市', '商店'],
  office: ['公司', '办公', '写字楼'],
  park: ['公园', '景区', '绿地'],
  hotel: ['酒店', '住宿'],
  hospital: ['医院', '诊所', '药店'],
  school: ['学校', '大学', '校园'],
  landmark: ['地标', '场馆', '博物馆'],
  restaurant: ['餐厅', '咖啡', '美食'],
};

function pickBiText(value: string | BiText | undefined, locale: 'zh' | 'en') {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return locale === 'zh' ? value.zh || value.en || '' : value.en || value.zh || '';
}

function categoryFromOfflinePlace(row: OfflineMapPlaceRow): DidiPlaceCategory {
  const types = [row.primaryType, ...(row.types ?? [])]
    .filter((type): type is string => Boolean(type));
  const has = (values: string[]) => types.some((type) => values.includes(type));
  const hasSuffix = (suffix: string) => types.some((type) => type.endsWith(suffix));

  if (has(['train_station', 'subway_station', 'bus_station', 'transit_station', 'light_rail_station']) || hasSuffix('_station')) return 'station';
  if (has(['airport'])) return 'airport';
  if (has(['hospital', 'doctor', 'pharmacy', 'drugstore']) || hasSuffix('_hospital')) return 'hospital';
  if (has(['school', 'university', 'primary_school', 'secondary_school', 'library']) || hasSuffix('_school')) return 'school';
  if (has(['lodging', 'hotel'])) return 'hotel';
  if (has(['park', 'tourist_attraction', 'campground'])) return 'park';
  if (has(['restaurant', 'cafe', 'bar', 'bakery', 'food']) || hasSuffix('_restaurant') || hasSuffix('_cafe')) return 'restaurant';
  if (has(['shopping_mall', 'supermarket', 'store', 'department_store', 'convenience_store', 'grocery_store']) || hasSuffix('_store') || hasSuffix('_shop')) return 'mall';
  if (has(['museum', 'stadium', 'place_of_worship', 'amusement_park'])) return 'landmark';
  if (has(['real_estate_agency', 'premise', 'neighborhood'])) return 'residence';
  return 'office';
}

function districtFromAddress(address: string) {
  const districts = address.match(/[\u4e00-\u9fa5]{2,4}区/g);
  return districts?.at(-1) ?? '海淀区';
}

const offlinePlaces: DidiMapPlace[] = Object.values(offlineMapSnapshot.places)
  .flatMap((row): DidiMapPlace[] => {
    const name = pickBiText(row.name, 'zh').trim();
    const englishName = pickBiText(row.name, 'en').trim();
    const address = pickBiText(row.formattedAddress, 'zh').trim();
    const category = categoryFromOfflinePlace(row);
    if (!name || !Number.isFinite(row.lat) || !Number.isFinite(row.lng)) return [];
    if (!isInsideOfflineMapBounds(row.lat, row.lng)) return [];

    return [{
      id: `gmap_${row.placeId}`,
      city: address.includes('北京市') ? '北京市' : '地图缓存区域',
      district: districtFromAddress(address),
      name,
      address: address || '北京市海淀区离线地图覆盖区域',
      category,
      distanceKm: Math.max(0, (row.distanceMeters ?? 0) / 1000),
      aliases: englishName && englishName !== name ? [englishName] : [],
      keywords: [
        row.primaryType ?? '',
        ...(row.types ?? []),
        ...CATEGORY_KEYWORDS[category],
      ].filter(Boolean),
      mapX: 426 + (row.lng - DIDI_OFFLINE_MAP_CENTER.lng) * 85_000,
      mapY: 438 - (row.lat - DIDI_OFFLINE_MAP_CENTER.lat) * 110_000,
      lat: row.lat,
      lng: row.lng,
      source: 'offline-google-map' as const,
    } satisfies DidiMapPlace];
  });

export const MAP_PLACES = [
  ...places.map((place) => ({ ...place, source: 'didi' as const })),
  ...offlinePlaces,
] as readonly DidiMapPlace[];

const normalize = (value: string) =>
  value.toLocaleLowerCase().replace(/[\s·()（）\-_/]/g, '');

function scorePlace(place: DidiMapPlace, rawQuery: string) {
  const query = normalize(rawQuery);
  if (!query) return place.recommended ? 0 : 20 + place.distanceKm;

  const name = normalize(place.name);
  const aliases = place.aliases.map(normalize);
  const keywords = place.keywords.map(normalize);
  const address = normalize(`${place.city}${place.district}${place.address}${place.category}`);

  if (name === query) return 0;
  if (name.startsWith(query)) return 5;
  if (name.includes(query)) return 10;
  if (aliases.some((alias) => alias === query)) return 12;
  if (aliases.some((alias) => alias.startsWith(query))) return 16;
  if (aliases.some((alias) => alias.includes(query))) return 20;
  if (keywords.some((keyword) => keyword === query)) return 24;
  if (keywords.some((keyword) => keyword.includes(query) || query.includes(keyword))) return 28;
  if (address.includes(query)) return 36;

  const terms = rawQuery.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const haystack = normalize([place.name, place.address, ...place.aliases, ...place.keywords].join(' '));
  if (terms.length > 1 && terms.every((term) => haystack.includes(normalize(term)))) return 42;
  return Number.POSITIVE_INFINITY;
}

export function searchMapPlaces(query: string, limit = 40) {
  return MAP_PLACES
    .map((place) => ({ place, score: scorePlace(place, query) }))
    .filter(({ score }) => Number.isFinite(score))
    .sort((a, b) => a.score - b.score || a.place.distanceKm - b.place.distanceKm)
    .slice(0, limit)
    .map(({ place }) => place);
}

export function getMapPlace(placeId: string | null | undefined) {
  return MAP_PLACES.find((place) => place.id === placeId) ?? MAP_PLACES[0];
}

export function findMapPlaceByName(name: string) {
  const normalized = normalize(name);
  return MAP_PLACES.find((place) => {
    if (normalize(place.name) === normalized) return true;
    return place.aliases.some((alias) => normalize(alias) === normalized);
  });
}

export function getPickupPoints(place: DidiMapPlace): DidiPickupPoint[] {
  if (place.pickupPoints?.length) return place.pickupPoints;
  return [
    { id: `${place.id}_main`, name: `${place.name}-正门`, detail: `${place.address}正门外侧`, walkMinutes: 2, x: 180, y: 130, official: true },
    { id: `${place.id}_east`, name: `${place.name}-东侧上车点`, detail: '东侧道路临时停靠区', walkMinutes: 4, x: 232, y: 104 },
    { id: `${place.id}_north`, name: `${place.name}-北侧上车点`, detail: '北侧路口安全停靠区', walkMinutes: 5, x: 128, y: 98 },
    { id: `${place.id}_parking`, name: `${place.name}-停车场出口`, detail: '停车场出口外侧网约车区', walkMinutes: 7, x: 208, y: 188 },
  ];
}

export function getPlaceLatLng(place: DidiMapPlace) {
  if (Number.isFinite(place.lat) && Number.isFinite(place.lng)) {
    return { lat: place.lat!, lng: place.lng! };
  }
  // 云江市 POI 只有画布像素坐标，改用重锚到真实路网的坐标：锚点按「预置里程 =
  // 目标距离、像素方位 = 目标方位」生成，因此地图折线、里程与价格口径一致。
  const anchor = PLACE_ANCHORS[place.id];
  if (anchor) return { lat: anchor.lat, lng: anchor.lng };
  return {
    lat: DIDI_OFFLINE_MAP_CENTER.lat - (place.mapY - 438) / 110_000,
    lng: DIDI_OFFLINE_MAP_CENTER.lng + (place.mapX - 426) / 85_000,
  };
}

/**
 * 名称 → 真实坐标。地址簿里存的常常是上车点名（云溪苑-东北门(邻里便民超市旁)）
 * 或带门号的写法（星辰广场(西湖店)-2号门），都要能解析出坐标，否则算路会退化。
 */
export function findLatLngByName(name: string) {
  const place = findMapPlaceByName(name);
  if (place) return getPlaceLatLng(place);
  const normalized = normalize(name);
  for (const candidate of MAP_PLACES) {
    const point = getPickupPoints(candidate).find(
      (pickup) => normalize(pickup.name) === normalized,
    );
    if (point) return getPickupPointLatLng(candidate, point);
  }
  const base = name.split('-')[0];
  if (base && base !== name) {
    const basePlace = findMapPlaceByName(base);
    if (basePlace) return getPlaceLatLng(basePlace);
  }
  return null;
}

/** 重锚后的真实里程（公里）。没有锚点时退回预置值。 */
export function getPlaceDistanceKm(place: DidiMapPlace) {
  const anchor = PLACE_ANCHORS[place.id];
  return anchor ? anchor.anchoredKm : place.distanceKm;
}

/**
 * 是否为已锚定到真实路网的云江市地点。
 * 地图标注只画这一批：其余条目来自 Map 应用的真实商户快照，混进云江市会串味。
 */
export function isAnchoredPlace(place: DidiMapPlace) {
  return Boolean(PLACE_ANCHORS[place.id]);
}

export function getPickupPointLatLng(place: DidiMapPlace, point: DidiPickupPoint) {
  const anchor = getPlaceLatLng(place);
  return {
    lat: anchor.lat - (point.y - 130) * 0.0000045,
    lng: anchor.lng + (point.x - 180) * 0.000006,
  };
}

export function distanceBetweenMapPoints(
  left: { lat: number; lng: number },
  right: { lat: number; lng: number },
) {
  const latScale = 111_000;
  const lngScale = 85_000;
  return Math.hypot(
    (left.lat - right.lat) * latScale,
    (left.lng - right.lng) * lngScale,
  );
}

export function getNearbyPlaces(anchor: DidiMapPlace, limit = 4) {
  const anchorPosition = getPlaceLatLng(anchor);
  const nearby = MAP_PLACES
    .filter((place) => place.id !== anchor.id)
    .map((place) => ({
      place,
      distance: distanceBetweenMapPoints(getPlaceLatLng(place), anchorPosition),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, Math.max(0, limit - 1))
    .map(({ place }) => place);
  return [anchor, ...nearby].slice(0, limit);
}

export function placeToMarker(place: DidiMapPlace, anchor: DidiMapPlace): MapMarkerOption {
  const x = Math.max(40, Math.min(320, 180 + (place.mapX - anchor.mapX) * 0.48));
  const y = Math.max(72, Math.min(220, 130 + (place.mapY - anchor.mapY) * 0.48));
  return {
    id: place.id,
    label: place.name,
    detail: place.address,
    x,
    y,
    recommended: place.id === anchor.id || place.recommended,
  };
}

export function pickupToMarker(point: DidiPickupPoint): MapMarkerOption {
  return {
    id: point.id,
    label: point.name,
    detail: point.detail,
    x: point.x,
    y: point.y,
    recommended: point.official,
  };
}
