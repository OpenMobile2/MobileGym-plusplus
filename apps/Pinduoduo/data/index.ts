import defaults from './defaults.json';
import catalog from './catalog.json';
import type { Item, PddState, Review } from '../types';

const REVIEW_USERS = [
  '林***夏',
  '陈***安',
  '周***宁',
  '小***鱼',
  '吴***然',
  '赵***敏',
  '许***晴',
  '刘***洋',
];

const REVIEW_CONTENT: Record<string, string[]> = {
  食品: [
    '包装严实，日期也很新鲜，口味和描述一致，家里人都觉得不错。',
    '分量足，收到没有破损，价格比附近超市划算，会继续回购。',
    '物流很快，吃起来口感不错，囤在家里很方便。',
  ],
  数码: [
    '连接很快，使用起来稳定，功能和详情页介绍的一样。',
    '包装完整，做工比预想的细致，试用了几天没有发现问题。',
    '操作简单，日常使用足够，拼单价很划算。',
  ],
  男装: [
    '尺码合适，面料摸起来舒服，版型和图片基本一致。',
    '洗过一次没有明显缩水，做工整齐，日常穿很合适。',
    '颜色耐看，上身比较利落，这个价格性价比不错。',
  ],
  女装: [
    '版型显瘦，颜色没有明显色差，面料穿着也舒服。',
    '尺码比较准，上身效果和图片接近，做工没有多余线头。',
    '搭配起来很好看，洗后没有变形，价格也合适。',
  ],
  百货: [
    '数量和规格都对，包装没有破损，家用很实惠。',
    '质量比预想中扎实，细节处理不错，用起来很方便。',
    '已经开始用了，和描述一致，价格便宜还包邮。',
  ],
  个护: [
    '包装完好，使用感比较温和，香味也不会太浓。',
    '是日常会用到的款，规格足，整体体验不错。',
    '用了几次感觉不错，日期新，性价比也高。',
  ],
  家居: [
    '实物和图片一致，做工整齐，放在家里很合适。',
    '包装保护得很好，安装和使用都方便，整体很满意。',
    '材质和尺寸符合描述，细节没有明显瑕疵。',
  ],
  家电: [
    '到货后试用正常，操作简单，运行时声音也能接受。',
    '包装结实，功能齐全，家里日常使用很方便。',
    '外观和详情页一致，使用效果不错，客服回复也及时。',
  ],
  玩乐: [
    '实物很可爱，做工细致，没有明显异味，孩子很喜欢。',
    '玩法有趣，配件齐全，收到后玩了很久。',
    '颜色和图片一致，质量不错，作为礼物也很合适。',
  ],
  出行: [
    '容量和尺寸符合描述，做工扎实，出门携带很方便。',
    '实物没有明显色差，细节处理不错，用起来顺手。',
    '包装完好，重量合适，旅行时带着很实用。',
  ],
  母婴: [
    '包装干净完整，材质摸着舒服，给宝宝用比较放心。',
    '规格合适，没有明显异味，使用起来很方便。',
    '和描述一致，细节处理不错，宝宝也愿意用。',
  ],
  美妆: [
    '包装完整，颜色自然，使用起来比较服帖。',
    '质地细腻，没有明显刺激感，日常使用很合适。',
    '实物和详情页一致，显色和持妆效果都不错。',
  ],
  运动: [
    '做工扎实，使用时比较稳，运动起来很方便。',
    '尺寸合适，材质和描述一致，整体性价比不错。',
    '试用了几次体验很好，重量合适，日常锻炼够用。',
  ],
};

const DEFAULT_REVIEW_CONTENT = [
  '商品和描述一致，包装完整，使用体验不错。',
  '发货速度快，做工没有明显问题，这个价格很划算。',
  '收到后试用了几天，整体满意，会考虑再次购买。',
];

function hashItemId(itemId: string): number {
  return Array.from(itemId).reduce((hash, character) => hash + character.charCodeAt(0), 0);
}

function buildReview(item: Item, index: number): Review {
  const hash = hashItemId(item.id);
  const contents = REVIEW_CONTENT[item.category] || DEFAULT_REVIEW_CONTENT;
  const image = index === 0 && item.gallery[1] ? [item.gallery[1]] : [];
  return {
    id: `rv_seed_${item.id}_${index}`,
    itemId: item.id,
    user: REVIEW_USERS[(hash + index * 3) % REVIEW_USERS.length],
    avatar: '/@app-assets/Pinduoduo/avatars/u_me.svg',
    rating: (hash + index) % 7 === 0 ? 4 : 5,
    content: contents[(hash + index) % contents.length],
    images: image,
    tags: item.reviewTags.slice(index, index + 2).length
      ? item.reviewTags.slice(index, index + 2)
      : ['符合描述', '性价比高'],
  };
}

// 构建时种子数据。资源路径已是 /@app-assets/Pinduoduo/... 绝对虚拟 URL(见 vite serveAppAssetsPlugin)。
// defaults.json = curated 精选种子(8 店铺 / 20 商品,含真机取材);
// catalog.json  = 批量站内数据(92 店铺 / 980 商品 / 430 评价,gen_catalog.py 生成)。
// curated 在前:首页「推荐」瀑布流先出精选(已有真图),再接批量商品。
const items = [...defaults.items, ...catalog.items] as Item[];
const reviews = [...defaults.reviews, ...catalog.reviews] as Review[];
const reviewCounts = reviews.reduce<Record<string, number>>((counts, review) => {
  counts[review.itemId] = (counts[review.itemId] || 0) + 1;
  return counts;
}, {});
const generatedReviews = items.flatMap((item) => {
  const missingCount = Math.max(0, 2 - (reviewCounts[item.id] || 0));
  return Array.from({ length: missingCount }, (_, index) => buildReview(item, index));
});

const merged: PddState = {
  ...(defaults as unknown as PddState),
  shops: [...defaults.shops, ...catalog.shops],
  items,
  reviews: [...reviews, ...generatedReviews],
} as unknown as PddState;

export const PDD_CONFIG = merged;
