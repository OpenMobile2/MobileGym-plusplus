// apps/Douban/components/GiftSheet.tsx —— 送礼物弹层(FOUNDATION,IMG_0220/0221)。
// 背包(空态)/ 礼品店 双tab;礼品店 = 大图选中礼物 + 附言 + 底部礼物横条(小豆价)
// + 关闭 / 「n | 购买并送出」;面板底色随选中礼物主题色变化。
// qa:Q10:购买并送出 → 页面侧 onTrigger 调 toast('余额不足')(当前用户 beans=0)。
// 可见性 URL 驱动(?gift=open&giftTab=store&giftId=cake);所有绑定页面侧传入。
import React from 'react';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { C } from './ui';

export interface GiftDef {
  id: string;
  name: string;
  emoji: string;
  /** 小豆价 */
  beans: number;
  /** 选中后面板主题色 */
  theme: string;
  themeDeep: string;
  /** 默认附言 */
  note: string;
}

/** 礼品店固定货架(evidence IMG_0221:蛋糕3/玫瑰3/鸡腿2/橘子2/可乐2/橙子2) */
export const GIFTS: GiftDef[] = [
  { id: 'cake', name: '蛋糕', emoji: '🍰', beans: 3, theme: '#F28A9B', themeDeep: '#E56A80', note: '吃块奶油蛋糕,让你的生活有滋有味' },
  { id: 'rose', name: '玫瑰', emoji: '🌹', beans: 3, theme: '#D95E6E', themeDeep: '#C74759', note: '送你一朵永不凋谢的玫瑰' },
  { id: 'chicken', name: '鸡腿', emoji: '🍗', beans: 2, theme: '#E8A24C', themeDeep: '#D98F35', note: '奖励你一个大鸡腿!' },
  { id: 'orange_candy', name: '橘子', emoji: '🍊', beans: 2, theme: '#EE9A3D', themeDeep: '#DD8827', note: '陈皮救我,吃颗橘子顺顺气' },
  { id: 'cola', name: '可乐', emoji: '🥤', beans: 2, theme: '#6B5B52', themeDeep: '#57473E', note: '快乐水一口,烦恼全没有' },
  { id: 'orange', name: '橙子', emoji: '🧡', beans: 2, theme: '#E98A3C', themeDeep: '#D97826', note: '心想事「橙」,好运连连' },
];

export type GiftTab = 'bag' | 'store';

export interface GiftSheetProps {
  tab: GiftTab;
  /** 当前选中礼物 id(store tab) */
  activeGiftId: string;
  /** 页面侧字面量绑定工厂 */
  bindTabSelect: (tab: GiftTab) => object;
  bindGiftSelect: (giftId: string) => object;
  /** 「购买并送出」→ toast「余额不足」(qa:Q10) */
  bindPurchase: object;
  /** 「关闭」用 bindBack(页面直接传 bindBack() 结果) */
  closeProps: object;
}

export function GiftSheet({ tab, activeGiftId, bindTabSelect, bindGiftSelect, bindPurchase, closeProps }: GiftSheetProps) {
  const { bindBack } = useDoubanGestures();
  const gift = GIFTS.find((g) => g.id === activeGiftId) ?? GIFTS[0];
  const isStore = tab === 'store';
  const panelBg = isStore ? gift.theme : C.surface;
  const fg = isStore ? '#FFFFFF' : C.text;
  const fgDim = isStore ? 'rgba(255,255,255,0.6)' : C.sub;
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <div {...bindBack()} className="flex-1" style={{ background: 'rgba(0,0,0,0.5)' }} />
      <div className="rounded-t-2xl pb-5 shrink-0 flex flex-col" style={{ background: panelBg, maxHeight: '62%' }}>
        {/* tab 头 */}
        <div className="flex gap-6 px-5 pt-4 pb-2 shrink-0">
          {([['bag', '我的背包'], ['store', '礼品店']] as [GiftTab, string][]).map(([t, label]) => {
            const active = tab === t;
            return (
              <button
                key={t}
                {...bindTabSelect(t)}
                className="bg-transparent border-none cursor-pointer text-base pb-1 relative p-0"
                style={{ color: active ? fg : fgDim, fontWeight: active ? 700 : 400 }}
              >
                {label}
                {active && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-6 h-[3px] rounded-full" style={{ background: fg }} />
                )}
              </button>
            );
          })}
        </div>
        <div className="h-px mx-5 shrink-0" style={{ background: isStore ? 'rgba(255,255,255,0.25)' : C.border }} />

        {tab === 'bag' ? (
          /* 背包空态 */
          <div className="flex flex-col items-center justify-center py-14">
            <svg width="72" height="60" viewBox="0 0 88 72" fill="none">
              <g stroke={C.text} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="26" y="30" width="36" height="30" rx="2" fill="none" />
                <path d="M26 40 h36 M44 30 v30" />
                <path d="M44 30 Q34 26 36 18 Q42 16 44 28 Q46 16 52 18 Q54 26 44 30 Z" fill="none" />
              </g>
            </svg>
            <div className="mt-3 text-sm" style={{ color: C.sub }}>背包空空的,先去礼品店逛逛吧</div>
          </div>
        ) : (
          <>
            {/* 选中礼物大图 + 附言 */}
            <div className="flex items-center gap-5 px-6 py-6 flex-1 min-h-0">
              <div
                className="w-28 h-28 rounded-2xl flex items-center justify-center text-6xl shrink-0"
                style={{ background: gift.themeDeep }}
              >
                {gift.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xl font-bold" style={{ color: fg }}>{gift.name}</div>
                <div className="mt-2 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  ✏️ 附言:{gift.note}
                </div>
              </div>
            </div>
            {/* 礼物横条 */}
            <div className="flex gap-2 px-4 pb-3 overflow-x-auto shrink-0" data-scroll-container="gift-strip" data-scroll-direction="horizontal">
              {GIFTS.map((g) => {
                const active = g.id === gift.id;
                return (
                  <button
                    key={g.id}
                    {...bindGiftSelect(g.id)}
                    className="w-16 shrink-0 rounded-xl flex flex-col items-center py-2 cursor-pointer"
                    style={{
                      background: 'rgba(255,255,255,0.15)',
                      border: active ? '2px solid #fff' : '2px solid transparent',
                    }}
                  >
                    <span className="text-2xl">{g.emoji}</span>
                    <span className="mt-1 text-[10px] flex items-center gap-0.5" style={{ color: '#fff' }}>
                      <span className="w-3 h-3 rounded-full inline-flex items-center justify-center text-[8px]" style={{ background: '#8BC34A' }}>豆</span>
                      {g.beans}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* 底部:关闭 | 购买并送出 */}
        <div className="flex items-center justify-between px-5 pt-2 shrink-0">
          <button {...closeProps} className="text-[15px] bg-transparent border-none cursor-pointer" style={{ color: isStore ? '#fff' : C.sub }}>
            关闭
          </button>
          {isStore && (
            <div className="flex items-center rounded-full overflow-hidden bg-white">
              <span className="pl-4 pr-3 py-2.5 text-[15px] font-semibold flex items-center gap-1" style={{ color: C.text }}>
                <span className="w-4 h-4 rounded-full inline-flex items-center justify-center text-[9px] text-white" style={{ background: '#8BC34A' }}>豆</span>
                {gift.beans}
              </span>
              <span className="w-px self-stretch my-2" style={{ background: C.border }} />
              <button {...bindPurchase} className="px-4 py-2.5 text-[15px] font-semibold bg-transparent border-none cursor-pointer" style={{ color: C.text }}>
                购买并送出
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
