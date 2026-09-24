import React, { useState } from 'react';
import { useJingdongGestures } from '../hooks/useJingdongGestures';
import { useJingdongStore } from '../state';
import { TopBar, Img, PriceYuan, showToast, wontfix } from '../components/ui';
import { IcPlus, IcChevronRight } from '../res/icons';

const CHIPS = ['推荐', '以旧换新', '电脑', '学生专享', '手机', '箱包表配'];

export function GuobuPage() {
  const { bindTap } = useJingdongGestures();
  const regions = useJingdongStore((s) => s.guobuRegions);
  const items = useJingdongStore((s) => s.items);
  const claimGuobu = useJingdongStore((s) => s.claimGuobu);
  const [region, setRegion] = useState(regions[0]?.name ?? '');
  const [chip, setChip] = useState('推荐');

  const active = regions.find((r) => r.name === region) ?? regions[0];
  const CHIP_CAT: Record<string, string[] | null> = {
    推荐: null,
    以旧换新: ['家电', '手机', '电脑办公'],
    电脑: ['电脑办公'],
    学生专享: ['电脑办公', '手机', '服饰鞋包'],
    手机: ['手机'],
    箱包表配: ['服饰鞋包'],
  };
  const guobuItems = items.filter((i) => {
    if (!i.guobu) return false;
    const cats = CHIP_CAT[chip];
    if (!cats) return true;
    return cats.includes(i.category);
  });

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]" data-status-bar-foreground="dark">
      <div className="shrink-0 bg-white pt-10">
        <TopBar title="国家补贴" />
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="guobu-feed" data-scroll-direction="vertical">
        {/* 国补小助手条 */}
        <div className="flex items-center gap-2 bg-white px-3 py-2.5">
          <div className="w-6 h-6 rounded-full bg-[#1BA956]/15 flex items-center justify-center text-[13px]">🤖</div>
          <span className="text-[14px] font-semibold text-[#1A1A1A]">国补小助手</span>
          <span className="text-[13px] text-[#999] truncate flex-1">26年国补补贴哪些品类?</span>
          <IcChevronRight size={16} className="text-[#CCC]" />
          <span className="text-[13px] text-[#333]">我的补贴</span>
        </div>

        {/* 地区资格卡 */}
        <div className="bg-white mx-2 mt-2 rounded-xl p-3">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {regions.map((r, i) => {
              const on = r.name === region;
              const badge = i === 0 ? '默认' : '常用';
              return (
                <button
                  key={r.name}
                  {...bindTap({ kind: 'action', id: 'guobu.region.select.area' }, { params: { area: r.name }, onTrigger: () => setRegion(r.name) })}
                  className={`shrink-0 px-4 py-1.5 rounded-lg text-[14px] flex items-center gap-1 ${on ? 'bg-[#1BA956] text-white font-semibold' : 'bg-[#F4F4F4] text-[#333]'}`}
                >
                  {r.name}
                  {i < 3 && <span className={`text-[10px] px-1 rounded-sm ${on ? 'bg-white/25' : 'bg-[#1BA956]/12 text-[#1BA956]'}`}>{badge}</span>}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-3 mt-3 border border-dashed border-[#1BA956]/40 rounded-lg p-3">
            <div className="w-14 h-14 rounded-lg bg-[#EAF7EF] flex items-center justify-center text-[16px] font-bold text-[#1BA956] shrink-0">{active?.name}</div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-semibold text-[#1A1A1A]">{active?.name}补贴资格</div>
              <div className="text-[13px] text-[#1BA956] mt-0.5">{active?.quota}</div>
            </div>
            <button
              {...bindTap(
                { kind: 'action', id: 'guobu.qualify.claim' },
                { onTrigger: () => { claimGuobu(active?.name ?? ''); showToast('已领取补贴资格'); } },
              )}
              className={`px-4 h-9 rounded-full text-[14px] font-semibold flex items-center shrink-0 ${active?.claimed ? 'bg-[#F0F0F0] text-[#999]' : 'bg-[#E1251B] text-white'}`}
            >
              {active?.claimed ? '已领取' : '点击领取'}
            </button>
          </div>
        </div>

        {/* 入口三宫格 */}
        <div className="flex gap-2 px-2 mt-2">
          <button {...bindTap({ kind: 'action', id: 'guobu.qualify.claim' }, { onTrigger: () => { claimGuobu(active?.name ?? ''); showToast('已领取补贴资格'); } })} className="flex-1 bg-gradient-to-r from-[#FFF3E9] to-[#FFE7D6] rounded-xl p-2.5 text-left">
            <div className="text-[13px] font-bold text-[#B8460F]">天天领补贴</div>
            <div className="text-[11px] text-[#C9805A] mt-1">连抽3天 · 点击领取</div>
          </button>
          <button {...bindTap({ kind: 'action', id: 'guobu.tradein.wontfix' }, { onTrigger: wontfix })} className="flex-1 bg-gradient-to-r from-[#FFF3E9] to-[#FFE7D6] rounded-xl p-2.5 text-left">
            <div className="text-[13px] font-bold text-[#B8460F]">大牌1元抢</div>
            <div className="text-[11px] text-[#C9805A] mt-1">超级加倍补 · ¥0.01</div>
          </button>
          <button {...bindTap({ kind: 'action', id: 'guobu.tradein.wontfix' }, { onTrigger: wontfix })} className="flex-1 bg-gradient-to-r from-[#FFF3E9] to-[#FFE7D6] rounded-xl p-2.5 text-left">
            <div className="text-[13px] font-bold text-[#B8460F]">上传旧机</div>
            <div className="text-[11px] text-[#C9805A] mt-1">立享补贴</div>
          </button>
        </div>

        {/* 品类 chips */}
        <div className="overflow-x-auto no-scrollbar mt-3">
          <div className="flex gap-4 px-3 whitespace-nowrap">
            {CHIPS.map((c) => {
              const on = chip === c;
              return (
                <button
                  key={c}
                  {...bindTap({ kind: 'action', id: 'guobu.region.select.area' }, { params: { area: c }, onTrigger: () => setChip(c) })}
                  className={`shrink-0 text-[15px] pb-1 ${on ? 'text-[#E1251B] font-bold border-b-2 border-[#E1251B]' : 'text-[#666]'}`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        {/* 国补商品瀑布流双列 */}
        <div className="grid grid-cols-2 gap-2 p-2">
          {guobuItems.length === 0 ? (
            <div className="col-span-2 text-center text-[#BBB] text-[14px] py-10">该分类暂无国补商品</div>
          ) : guobuItems.map((it) => (
            <div key={it.id} {...bindTap('guobu.item-open', { params: { itemId: it.id } })} className="bg-white rounded-lg overflow-hidden flex flex-col">
              <div className="relative w-full aspect-square bg-[#F5F5F5]">
                <Img src={it.image} className="w-full h-full object-cover" alt={it.title} />
              </div>
              <div className="p-2 flex flex-col gap-1">
                <div className="text-[13px] leading-[17px] text-[#1A1A1A] line-clamp-2">
                  {it.self && <span className="text-[#E1251B] font-semibold mr-0.5">自营</span>}
                  {it.title}
                </div>
                <div className="flex flex-wrap gap-1">
                  <span className="text-[10px] text-[#1BA956] bg-[#F0F9F3] px-1 rounded-sm">政府补贴·已减{it.guobuOff}元</span>
                  {it.baitiaoPeriods?.[0] && <span className="text-[10px] text-[#1BA956] bg-[#F0F9F3] px-1 rounded-sm">{it.baitiaoPeriods[0]}期免息</span>}
                </div>
                <div className="flex items-end justify-between mt-0.5">
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-1">
                      <PriceYuan value={it.price} className="text-[#E1251B] text-[17px]" />
                      <span className="text-[10px] text-[#E1251B]">补贴到手价</span>
                    </div>
                    <span className="text-[11px] text-[#BBB] line-through">¥{it.originPrice}</span>
                  </div>
                  <button
                    {...bindTap('guobu.item-open', { params: { itemId: it.id }, stopPropagation: true })}
                    aria-label="加购"
                    className="w-7 h-7 rounded-full bg-[#E1251B] text-white flex items-center justify-center shrink-0"
                  >
                    <IcPlus size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
