import type { Address, Coupon, Order, Product, Store } from '../types';

export const PRODUCTS: Product[] = [
  { id: 'orange-c', name: '橙 C 美式（首创）', subtitle: '每日鲜切鲜橙 · 清爽咖啡香', category: 'fruit', price: 12.9, originalPrice: 20, color: '#FFB237', badge: '升级' },
  { id: 'coconut-latte', name: '生椰拿铁（首创）', subtitle: '椰香轻盈 · 人气首创', category: 'popular', price: 10.9, originalPrice: 20, color: '#E9D2A0', badge: '热销' },
  { id: 'velvet-c', name: '缤纷 C 美式', subtitle: '三重鲜果 · 清新明亮', category: 'fruit', price: 13.9, originalPrice: 20, color: '#BBD65B', badge: '新品' },
  { id: 'grape-latte', name: '葡萄丝绒拿铁', subtitle: '葡萄果香 · 丝绒奶香', category: 'new', price: 14.9, originalPrice: 22, color: '#B796D2', badge: '当季' },
  { id: 'cloud-latte', name: '云朵厚乳拿铁', subtitle: '厚乳绵密 · 咖香醇厚', category: 'latte', price: 11.9, originalPrice: 19, color: '#D6B58B', badge: '经典' },
  { id: 'lemon-tea', name: '青柠冰茶', subtitle: '真茶现萃 · 青柠清香', category: 'tea', price: 9.9, originalPrice: 16, color: '#B9D768', badge: '特价' },
];

export const INSTANT_PRODUCTS: Product[] = [
  { id: 'instant-01', name: '经典浓缩咖啡液 32杯', subtitle: '0 糖 0 脂 · 冷热皆宜', category: 'liquid', price: 76, originalPrice: 99, color: '#9ED9CD', badge: '新品' },
  { id: 'instant-02', name: '深烘冻干咖啡 12颗', subtitle: '锁香冻干 · 一冲即饮', category: 'freeze', price: 49, originalPrice: 69, color: '#D2B08B', badge: '爆款' },
  { id: 'instant-03', name: '山野挂耳咖啡 10袋', subtitle: '精品拼配 · 醇厚坚果调', category: 'bag', price: 39, originalPrice: 55, color: '#92A8D9', badge: '首发' },
  { id: 'instant-04', name: '轻甜生椰咖啡饮料', subtitle: '6 瓶装 · 清爽椰香', category: 'drink', price: 45, originalPrice: 59, color: '#A9D9ED', badge: '热销' },
  { id: 'instant-05', name: '晨曦拼配咖啡豆 500g', subtitle: '中深烘焙 · 巧克力尾韵', category: 'bean', price: 88, originalPrice: 118, color: '#7A5A48', badge: '推荐' },
];

export const STORES: Store[] = [
  { id: 's01', name: '星河世纪广场店', address: '海蓝市新城路 88 号 1F', distance: '509m', open: '07:00-21:30' },
  { id: 's02', name: '云帆中心店', address: '海蓝市云帆大道 16 号', distance: '830m', open: '07:30-20:30' },
  { id: 's03', name: '智谷园区店', address: '海蓝市科创路 9 号 A 座', distance: '1.2km', open: '08:00-19:00' },
  { id: 's04', name: '湖畔天地店', address: '海蓝市望湖街 101 号', distance: '1.8km', open: '07:30-22:00' },
  { id: 's05', name: '南岸里店', address: '海蓝市南岸路 26 号', distance: '2.3km', open: '08:00-21:00' },
];

export const ADDRESSES: Address[] = [
  { id: 'a01', name: '林晓', phone: '138****0000', region: '海蓝市 新城区', detail: '星河街 88 号 1 栋 1202', tag: '家', isDefault: true },
  { id: 'a02', name: '林晓', phone: '138****0000', region: '海蓝市 高新区', detail: '智谷园区 A 座 8 楼', tag: '公司', isDefault: false },
  { id: 'a03', name: '周宁', phone: '139****1212', region: '海蓝市 湖滨区', detail: '湖滨大学东门 3 号楼', tag: '学校', isDefault: false },
  { id: 'a04', name: '许安', phone: '137****3666', region: '海蓝市 南岸区', detail: '南岸里 18 号 2 栋 506', tag: '家', isDefault: false },
  { id: 'a05', name: '陈默', phone: '136****8899', region: '海蓝市 新城区', detail: '云帆中心 B 座前台', tag: '公司', isDefault: false },
];

export const COUPONS: Coupon[] = [
  { id: 'c01', title: '9.9 元饮品兑换券', amount: 9.9, threshold: '指定饮品可用', expiry: '7 天后到期', kind: 'drink', claimed: true },
  { id: 'c02', title: '满 20 减 8 元', amount: 8, threshold: '满 20 元可用', expiry: '3 天后到期', kind: 'drink', claimed: true },
  { id: 'c03', title: '即享新人 10 元券', amount: 10, threshold: '即享满 49 元可用', expiry: '15 天后到期', kind: 'instant', claimed: true },
  { id: 'c04', title: '咖啡卡 5 次券', amount: 5, threshold: '每日限用 1 次', expiry: '30 天后到期', kind: 'bought', claimed: true },
  { id: 'c05', title: '周一能量 6 元券', amount: 6, threshold: '饮品满 15 元可用', expiry: '今天到期', kind: 'drink', claimed: false },
];

export const ORDERS: Order[] = [
  { id: 'o26071301', status: 'unpaid', productId: 'orange-c', quantity: 1, amount: 12.9, createdAt: '2026-07-13 10:22' },
  { id: 'o26071202', status: 'making', productId: 'coconut-latte', quantity: 2, amount: 21.8, createdAt: '2026-07-12 15:08' },
  { id: 'o26071003', status: 'ready', productId: 'cloud-latte', quantity: 1, amount: 11.9, createdAt: '2026-07-10 08:36' },
  { id: 'o26070504', status: 'done', productId: 'lemon-tea', quantity: 1, amount: 9.9, createdAt: '2026-07-05 13:14' },
  { id: 'o26070105', status: 'done', productId: 'velvet-c', quantity: 2, amount: 27.8, createdAt: '2026-07-01 17:50' },
];
