// apps/Douban/pages/marketShared.tsx —— 市集簇(cluster 7)页面共用小件。
// 约定:绑定(bindTap/bindBack)一律在页面侧字面量生成后以 props 传入,本文件不出现任何 id。
import React from 'react';
import { useDoubanStore } from '../state';
import { C, Img } from '../components/ui';
import type { DoubanAddress, DoubanProduct } from '../types';

/** 金额:列表卡上的短价(68 → "68",39.5 → "39.5") */
export function fmtPrice(n: number): string {
  return Number.isInteger(n) ? String(n) : String(n);
}

/** 金额:订单/结算行的两位小数("28.00") */
export function fmt2(n: number): string {
  return n.toFixed(2);
}

/** 11位手机号 → 138****2046;已是掩码原样返回 */
export function maskPhone(p: string): string {
  const digits = p.replace(/\D/g, '');
  if (digits.length === 11) return `${digits.slice(0, 3)}****${digits.slice(7)}`;
  return p;
}

/** 订单号展示:从 id 提取数字并补齐 10 位(种子 o_closed131 → 3455701053 风格的稳定伪单号) */
export function orderNo(id: string): string {
  const digits = id.replace(/\D/g, '');
  return (digits + '3455701053').slice(0, 10);
}

/** 省市区三级联动数据(表单下拉用,轻量种子) */
export const REGIONS: { name: string; cities: { name: string; districts: string[] }[] }[] = [
  {
    name: '北京市',
    cities: [{ name: '北京市', districts: ['东城区', '西城区', '朝阳区', '海淀区', '顺义区'] }],
  },
  {
    name: '上海市',
    cities: [{ name: '上海市', districts: ['黄浦区', '徐汇区', '静安区', '浦东新区'] }],
  },
  {
    name: '浙江省',
    cities: [
      { name: '杭州市', districts: ['西湖区', '拱墅区', '滨江区', '余杭区'] },
      { name: '宁波市', districts: ['海曙区', '鄞州区'] },
    ],
  },
  {
    name: '广东省',
    cities: [
      { name: '广州市', districts: ['天河区', '越秀区', '海珠区'] },
      { name: '深圳市', districts: ['南山区', '福田区', '宝安区'] },
    ],
  },
];

// ---------------------------------------------------------------- store 补丁
// state.ts 冻结(无 update/delete address、delete order 动作),市集簇用 setState 打补丁。

export function patchSetDefaultAddress(addressId: string) {
  useDoubanStore.setState((s) => ({
    addresses: s.addresses.map((a) => ({ ...a, isDefault: a.id === addressId })),
  }));
}

export function patchDeleteAddress(addressId: string) {
  useDoubanStore.setState((s) => {
    const rest = s.addresses.filter((a) => a.id !== addressId);
    const hasDefault = rest.some((a) => a.isDefault);
    return {
      addresses: rest.map((a, i) => (hasDefault ? a : { ...a, isDefault: i === 0 })),
    };
  });
}

export function patchUpdateAddress(addressId: string, patch: Partial<DoubanAddress>) {
  useDoubanStore.setState((s) => ({
    addresses: s.addresses.map((a) => (a.id === addressId ? { ...a, ...patch } : a)),
  }));
}

/** 新建后把「最后加入的地址」设为默认(供确认订单回填) */
export function patchMakeLastAddressDefault() {
  useDoubanStore.setState((s) => ({
    addresses: s.addresses.map((a, i) => ({ ...a, isDefault: i === s.addresses.length - 1 })),
  }));
}

export function patchDeleteOrder(orderId: string) {
  useDoubanStore.setState((s) => ({ orders: s.orders.filter((o) => o.id !== orderId) }));
}

// ---------------------------------------------------------------- 共用 UI

/** 红色小购物车圆钮(瀑布流卡角/热卖卡角) */
export function CartBadgeIcon({ size = 26 }: { size?: number }) {
  return (
    <span
      className="rounded-full flex items-center justify-center shrink-0"
      style={{ width: size, height: size, background: '#E5484D' }}
    >
      <CartSvg size={size * 0.55} color="#fff" />
    </span>
  );
}

export function CartSvg({ size = 20, color = C.text }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M3 4h2.2l2.2 11h11l2.4-8H7"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9.5" cy="19.5" r="1.4" fill={color} />
      <circle cx="17" cy="19.5" r="1.4" fill={color} />
    </svg>
  );
}

/** 勾选圆钮(购物车/支付方式/券单选通用):绿底白勾 or 灰圈 */
export function CheckCircle({ checked, size = 20 }: { checked: boolean; size?: number }) {
  return (
    <span
      className="rounded-full flex items-center justify-center shrink-0"
      style={{
        width: size,
        height: size,
        background: checked ? C.green : 'transparent',
        border: checked ? 'none' : '1.5px solid #C9CDD3',
      }}
    >
      {checked && (
        <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 12 12" fill="none">
          <path d="M2.4 6.2 5 8.8 9.7 3.4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

/** 双列网格商品卡(市集首页瀑布流/分类页/热卖推荐通用) */
export function ProductGridCard({
  product,
  tapProps,
  cartProps,
  perUnit,
}: {
  product: DoubanProduct;
  /** 整卡跳详情绑定 */
  tapProps: object;
  /** 角上红购物车绑定(可选) */
  cartProps?: object;
  perUnit?: string;
}) {
  const p = product;
  const limitTag = (p.tag ?? '').includes('限时');
  return (
    <div className="bg-white rounded-xl overflow-hidden">
      <div {...tapProps} className="cursor-pointer">
        <Img src={p.cover} className="w-full aspect-square object-cover" />
        <div className="px-2.5 pt-2">
          <div className="text-[13px] leading-snug line-clamp-2" style={{ color: C.text }}>
            <span
              className="inline-block align-middle mr-1 px-1 rounded text-[9px] text-white"
              style={{ background: C.green }}
            >
              豆品
            </span>
            {p.title}
          </div>
          <div className="mt-1 text-[11px]" style={{ color: C.sub }}>
            {p.soldText ?? ''}
          </div>
        </div>
      </div>
      <div className="px-2.5 pb-2.5 pt-1 flex items-end justify-between">
        <div {...tapProps} className="min-w-0 cursor-pointer">
          <span className="text-[15px] font-bold" style={{ color: '#E5484D' }}>
            {limitTag && <span className="text-[11px] font-semibold">限时</span>}
            ¥{fmtPrice(p.price)}
            <span className="text-[10px] font-normal" style={{ color: C.sub }}>
              /{perUnit ?? '件'}
            </span>
          </span>
          {p.origPrice != null && (
            <span className="ml-1 text-[11px] line-through" style={{ color: '#B9BEC6' }}>
              ¥{fmtPrice(p.origPrice)}
            </span>
          )}
        </div>
        {cartProps && (
          <button {...cartProps} className="bg-transparent border-none p-0 cursor-pointer shrink-0">
            <CartBadgeIcon />
          </button>
        )}
      </div>
    </div>
  );
}
