import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useJingdongGestures } from '../hooks/useJingdongGestures';
import { useJingdongStore } from '../state';
import { Img, PriceYuan, showToast, wontfix } from '../components/ui';
import { ItemCard } from '../components/ItemCard';
import { IcScan, IcCamera } from '../res/icons';

const TOP_TABS = [
  { key: 'deal', label: '特价' },
  { key: 'home', label: '首页' },
  { key: 'miaosong', label: '秒送' },
  { key: 'new', label: '新品' },
];

// 金刚区分类横条
const CHANNELS = ['关注', '推荐', '国家补贴', '电脑办公', '手机', '二手', '分类'];

// 金刚区图标
const KINGKONG = [
  { id: 'seckill', label: '秒杀', badge: '领京豆', color: '#E1251B' },
  { id: 'digital', label: '手机数码', color: '#1BA956' },
  { id: 'qixian', label: '京东七鲜', badge: '鲜蔬菜', color: '#FF7A00' },
  { id: 'express', label: '京东快递', color: '#E1251B' },
  { id: 'coupon', label: '领券中心', color: '#E1251B' },
  { id: 'wine', label: '酒水', color: '#7A5CFF' },
];


function topFromView(view: string | null): 'deal' | 'home' | 'new' {
  if (view === 'toptabdeal') return 'deal';
  if (view === 'toptabnew') return 'new';
  return 'home';
}

export function HomePage() {
  const { bindTap } = useJingdongGestures();
  const [sp, setSp] = useSearchParams();
  const items = useJingdongStore((s) => s.items);
  const [top, setTop] = useState<'deal' | 'home' | 'new'>(() => topFromView(sp.get('view')));
  const [channel, setChannel] = useState('推荐');

  // 从秒送等入口带 view=toptabdeal/toptabnew 落地时同步顶 tab
  const view = sp.get('view');
  useEffect(() => {
    setTop(topFromView(view));
  }, [view]);

  const selectTop = (key: 'deal' | 'home' | 'new') => {
    setTop(key);
    setSp((p) => {
      if (key === 'deal') p.set('view', 'toptabdeal');
      else if (key === 'new') p.set('view', 'toptabnew');
      else p.delete('view');
      return p;
    }, { replace: true });
  };

  const guobuItems = items.filter((i) => i.guobu);

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]" data-status-bar-foreground="dark">
      {/* 顶部tab条 + 右上角运营位 */}
      <div className="shrink-0 pt-10 px-3 flex items-center justify-between">
        <div className="flex items-end gap-4">
          {TOP_TABS.map((t) => {
            const active = top === t.key;
            const cls = `relative leading-none ${active ? 'text-[#E1251B] text-[22px] font-bold' : 'text-[#333] text-[16px]'}`;
            if (t.key === 'miaosong') {
              return (
                <button key={t.key} {...bindTap('home.miaosong-open')} className={`${cls} mr-5`}>
                  {t.label}
                  <span className="absolute -top-1 -right-6 bg-[#FF4E33] text-white text-[9px] px-1 rounded-sm">外卖</span>
                </button>
              );
            }
            if (t.key === 'deal') {
              return (
                <button
                  key={t.key}
                  {...bindTap({ kind: 'action', id: 'home.toptab.select.deal' }, { onTrigger: () => selectTop('deal') })}
                  className={cls}
                >
                  {t.label}
                </button>
              );
            }
            if (t.key === 'new') {
              return (
                <button
                  key={t.key}
                  {...bindTap({ kind: 'action', id: 'home.toptab.select.new' }, { onTrigger: () => selectTop('new') })}
                  className={cls}
                >
                  {t.label}
                </button>
              );
            }
            return (
              <button key={t.key} onClick={() => selectTop('home')} className={cls}>
                {t.label}
              </button>
            );
          })}
        </div>
        <div className="w-[92px] h-9 rounded-lg bg-gradient-to-r from-[#FDE8DC] to-[#F8CBB3] flex items-center justify-center text-[11px] font-semibold text-[#B8460F]">
          买车养车
        </div>
      </div>

      {/* 扫码搜索栏 */}
      <div className="shrink-0 px-3 py-2">
        <div className="h-10 rounded-full border-2 border-[#E1251B] bg-white flex items-center pl-3 pr-1">
          <IcScan size={20} className="text-[#E1251B] shrink-0" />
          <button {...bindTap('home.search-open')} className="flex-1 text-left px-2 text-[14px] text-[#333] truncate">
            联想thinkbook14+轻薄本
          </button>
          <button
            {...bindTap({ kind: 'action', id: 'home.camera.wontfix' }, { onTrigger: wontfix })}
            aria-label="拍照"
            className="w-8 h-8 flex items-center justify-center text-[#666] relative"
          >
            <IcCamera size={20} />
            <span className="absolute top-0 right-0 text-[8px] text-[#7A5CFF] font-bold">AI</span>
          </button>
          <div className="w-px h-4 bg-[#EEE]" />
          <button {...bindTap('home.search-open')} className="px-3 text-[15px] font-semibold text-[#E1251B]">
            搜索
          </button>
        </div>
      </div>

      {/* 金刚区分类横条 */}
      <div className="shrink-0 overflow-x-auto no-scrollbar">
        <div className="flex gap-4 px-3 pb-1 whitespace-nowrap">
          {CHANNELS.map((c) => {
            if (c === '分类') {
              return (
                <button key={c} {...bindTap('home.category-open')} className="text-[15px] text-[#333] shrink-0">
                  {c}
                </button>
              );
            }
            if (c === '国家补贴') {
              return (
                <button key={c} {...bindTap('home.guobu-open')} className="text-[15px] text-[#1BA956] font-semibold shrink-0">
                  {c}
                </button>
              );
            }
            const active = channel === c;
            return (
              <button
                key={c}
                {...bindTap({ kind: 'action', id: 'home.subtab.select.channel' }, { params: { channel: c }, onTrigger: () => setChannel(c) })}
                className={`text-[15px] shrink-0 ${active ? 'text-[#1A1A1A] font-bold' : 'text-[#666]'}`}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="home-feed" data-scroll-direction="vertical">
        {/* 金刚区图标横滑 */}
        <div className="overflow-x-auto no-scrollbar bg-white mx-2 mt-2 rounded-xl py-3">
          <div className="flex px-2">
            {KINGKONG.map((k) => {
              const inner = (
                <>
                  <div className="relative w-11 h-11 rounded-full flex items-center justify-center text-white text-[11px]" style={{ background: k.color }}>
                    {k.label.slice(0, 2)}
                    {k.badge && (
                      <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#FF4E33] text-white text-[8px] px-1 rounded-full">
                        {k.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-[#333]">{k.label}</span>
                </>
              );
              const cls = 'flex flex-col items-center gap-1 shrink-0 w-[64px]';
              if (k.id === 'seckill') return <button key={k.id} {...bindTap('home.seckill-open')} className={cls}>{inner}</button>;
              if (k.id === 'coupon') return <button key={k.id} {...bindTap('home.couponcenter-open')} className={cls}>{inner}</button>;
              return (
                <button key={k.id} {...bindTap({ kind: 'action', id: 'home.marketing.wontfix' }, { onTrigger: wontfix })} className={cls}>
                  {inner}
                </button>
              );
            })}
          </div>
        </div>

        {top === 'deal' && (
          <div className="mx-2 mt-2 bg-white rounded-xl p-3 flex items-center justify-between">
            <div className="text-[15px] font-bold text-[#1A1A1A]">京东校园 · 学生特价专区</div>
            <button {...bindTap('home.campus-open')} className="px-3 h-7 rounded-full bg-[#E1251B] text-white text-[12px] flex items-center">
              去逛逛
            </button>
          </div>
        )}

        {/* 国补×超级补贴 + 品质生活 */}
        <div className="flex gap-2 px-2 mt-2">
          <button {...bindTap('home.guobu-open')} className="flex-1 bg-white rounded-xl p-2.5 text-left">
            <div className="text-[15px] font-bold text-[#1A1A1A]">国家补贴<span className="text-[#999] mx-0.5">×</span>超级补贴</div>
            <div className="flex gap-1.5 mt-2">
              {guobuItems.slice(0, 2).map((it) => (
                <div key={it.id} className="flex-1">
                  <div className="relative aspect-square rounded-md overflow-hidden bg-[#F5F5F5]">
                    <Img src={it.image} className="w-full h-full object-cover" />
                    <span className="absolute right-0 top-0 bg-[#1BA956] text-white text-[9px] px-1 rounded-bl">国补</span>
                  </div>
                  <div className="text-[#E1251B] text-[12px] mt-1"><PriceYuan value={it.price} className="text-[14px]" /> <span className="text-[10px]">补贴价</span></div>
                </div>
              ))}
            </div>
          </button>
          <div className="flex-1 bg-white rounded-xl p-2.5">
            <div className="text-[15px] font-bold text-[#1A1A1A]">品质生活 <span className="text-[11px] text-[#999] font-normal">上海</span></div>
            <div className="grid grid-cols-3 gap-1 mt-2 text-[11px] text-[#333] text-center">
              <button {...bindTap('home.miaosongmed-open')} className="flex flex-col items-center gap-1">
                <div className="w-9 h-9 rounded-full bg-[#FFF0E8] flex items-center justify-center text-[16px]">🥡</div>自营秒送
              </button>
              <button {...bindTap('home.miaosongmed-open')} className="flex flex-col items-center gap-1">
                <div className="w-9 h-9 rounded-full bg-[#E9F7EE] flex items-center justify-center text-[16px]">💊</div>买药秒送
              </button>
              <button {...bindTap('home.waimai-open')} className="flex flex-col items-center gap-1">
                <div className="w-9 h-9 rounded-full bg-[#FDEEDD] flex items-center justify-center text-[16px]">🍱</div>外卖
              </button>
              <button {...bindTap({ kind: 'action', id: 'home.marketing.wontfix' }, { onTrigger: wontfix })} className="flex flex-col items-center gap-1">
                <div className="w-9 h-9 rounded-full bg-[#FFF3E0] flex items-center justify-center text-[16px]">🍜</div>美食团购
              </button>
              <button {...bindTap('home.waimai-open')} className="flex flex-col items-center gap-1">
                <div className="w-9 h-9 rounded-full bg-[#EAF1FF] flex items-center justify-center text-[16px]">✈️</div>京东旅行
              </button>
              <button {...bindTap('home.couponcenter-open')} className="flex flex-col items-center gap-1">
                <div className="w-9 h-9 rounded-full bg-[#FDEBEB] flex items-center justify-center text-[16px]">🎟️</div>领券
              </button>
            </div>
          </div>
        </div>

        {/* 9.9包邮 / 直播低价 */}
        <div className="flex gap-2 px-2 mt-2">
          <div className="flex-1 bg-white rounded-xl p-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-bold text-[#1A1A1A]">9.9包邮</span>
              <span className="text-[12px] text-[#E1251B]">1元特价</span>
            </div>
            <div className="flex gap-2 mt-2">
              {items.filter((i) => i.price < 50).slice(0, 2).map((it) => (
                <button key={it.id} {...bindTap('home.item-open', { params: { itemId: it.id } })} className="flex-1 text-left">
                  <div className="aspect-square rounded-md overflow-hidden bg-[#F5F5F5]"><Img src={it.image} className="w-full h-full object-cover" /></div>
                  <PriceYuan value={it.price} className="text-[#E1251B] text-[14px]" />
                </button>
              ))}
            </div>
          </div>
          <button {...bindTap({ kind: 'action', id: 'home.marketing.wontfix' }, { onTrigger: wontfix })} className="flex-1 bg-white rounded-xl p-2.5 text-left">
            <div className="inline-flex items-center gap-1 text-white bg-[#E1251B] text-[11px] px-1.5 py-0.5 rounded"><span>直播低价</span></div>
            <div className="text-[13px] text-[#1A1A1A] mt-2">好物放送 · 边看边买</div>
            <div className="text-[#E1251B] text-[16px] font-bold mt-1">¥89 起</div>
          </button>
        </div>

        {/* 学生专区 banner */}
        <button
          {...bindTap('home.campus-open')}
          className="block w-[calc(100%-16px)] mx-2 mt-2 rounded-xl bg-gradient-to-r from-[#EAF2FF] to-[#DCEBFF] p-3 text-left"
        >
          <div className="text-[15px] font-bold text-[#2E5AAC]">学生专区 · 1元包邮</div>
          <div className="text-[12px] text-[#6688BB] mt-1">试用专享券 ¥5 · 17元外卖餐补</div>
        </button>

        {/* 推荐瀑布流双列 */}
        <div className="px-2 pt-3 pb-3">
          <div className="text-center text-[13px] text-[#999] mb-2">— 为你推荐 —</div>
          <div className="grid grid-cols-2 gap-2">
            {items.map((it) => (
              <ItemCard
                key={it.id}
                item={it}
                openBind={bindTap('home.item-open', { params: { itemId: it.id } })}
                quickBind={bindTap('home.item-open', { params: { itemId: it.id }, stopPropagation: true })}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
