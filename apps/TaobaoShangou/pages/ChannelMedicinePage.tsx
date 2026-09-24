import React, { useMemo } from 'react';
import { useAppStrings } from '@/os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { useTbsgGestures } from '../hooks/useTbsgGestures';
import { useTbsgStore } from '../state';
import { showToast } from '../components/common';
import { ShopCard } from '../components/ShopCard';
import { IcBack, IcHome, IcSearch, IcShop, IcUser } from '../res/icons';
import { useStatusBarBg } from '../statusbar';
import { MED_CATEGORIES } from '../constants';

const TABS = ['买药', '问医生', '医疗器械', '健康自测'];

/** 药盒图标格(可点进分类 / 或提示未开放) */
const GRID_EXTRAS: { label: string; brand: string; color: string }[] = [
  { label: '问医生', brand: '在线', color: '#3AB0A0' },
  { label: '健康卡', brand: 'VIP', color: '#D8A24A' },
  { label: '买药记录', brand: '订单', color: '#7E8BAF' },
];

const CARD_PERKS: { title: string; value: string; tag?: string }[] = [
  { title: '医用面膜|医美专用', value: '199元', tag: '0元领' },
  { title: '下单可抵扣', value: '20元' },
  { title: '1对1急送', value: '180元' },
  { title: '0元领药箱', value: '29.9元' },
  { title: '免费三甲问诊', value: '237.6元' },
  { title: '专享折扣价', value: '买多省多' },
];

const BOTTOM_TABS = [
  { label: '首页', icon: IcHome },
  { label: 'AI找药', icon: IcSearch },
  { label: '商城', icon: IcShop },
  { label: '我的', icon: IcUser },
];

/** 看病买药频道(IMG_6008/6093):分类金刚区 + 附近药店(可进店购买) */
export default function ChannelMedicinePage() {
  const { bindTap, bindBack } = useTbsgGestures();
  useStatusBarBg('#DFF3E8');
  const s = useAppStrings(strings, stringsEn);
  const shops = useTbsgStore((st) => st.shops);

  const pharmacies = useMemo(
    () => shops.filter((x) => x.type === 'retail' && x.category === 'pharmacy'),
    [shops],
  );

  const miscStub = () => bindTap<HTMLButtonElement>(
    { kind: 'action', id: 'channel.medicine.misc.stub' },
    { onTrigger: () => showToast(s.notOpen) },
  );

  return (
    <div className="flex flex-col h-full bg-[#F3F6F8]" data-status-bar-foreground="dark">
      {/* 青绿治愈系头部 */}
      <div className="shrink-0 bg-gradient-to-b from-[#DFF3E8] to-[#F2FAF4] pb-2">
        <div className="flex items-center h-11 px-2">
          <button {...bindBack<HTMLButtonElement>()} className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer" aria-label="返回">
            <IcBack size={22} className="text-[#1A1A1A]" />
          </button>
          <span className="font-bold text-[18px] text-[#1A1A1A] pl-1">买药<span className="text-[11px] align-top">24小时</span></span>
        </div>
        <div className="px-3">
          <div
            {...bindTap<HTMLDivElement>('medicine.search-open')}
            className="flex items-center h-9 rounded-lg bg-white px-3 cursor-pointer"
          >
            <IcSearch size={16} className="text-[#999999]" />
            <span className="flex-1 ml-2 text-[13px] text-[#999999] truncate">搜索药品、疾病、症状、品牌</span>
            <span className="h-7 px-3 rounded-md bg-[#2BB3A3] text-white text-[13px] font-semibold flex items-center">{s.search}</span>
          </div>
        </div>
        {/* 一级tab */}
        <div className="flex items-center gap-2 px-3 mt-2">
          {TABS.map((t, i) => (
            i === 0 ? (
              <span key={t} className="h-8 px-3.5 rounded-lg bg-white text-[15px] font-bold text-[#1A1A1A] flex items-center shadow-sm">{t}</span>
            ) : (
              <button
                key={t}
                {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'channel.medicine.tab.stub' }, {
                  params: { tab: t }, onTrigger: () => showToast(s.notOpen),
                })}
                className="h-8 px-2 text-[14px] text-[#666666] bg-transparent border-none cursor-pointer"
              >
                {t}
              </button>
            )
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {/* banner */}
        <button
          {...miscStub()}
          className="mx-3 mt-2 w-[calc(100%-24px)] rounded-xl border-none cursor-pointer p-0 overflow-hidden bg-gradient-to-r from-[#FFF3D6] to-[#FCE3C0] text-left"
        >
          <div className="flex items-center px-4 py-3">
            <div>
              <div className="font-bold text-[17px] text-[#5C4318]">共同护"胃" 守护健康</div>
              <span className="inline-flex items-center mt-2 h-7 px-3 rounded-full bg-[#F5A623] text-white text-[12px] font-semibold">get这份保"胃"指南 &gt;</span>
            </div>
            <span className="ml-auto text-[38px]">💊</span>
          </div>
        </button>

        {/* 药品分类金刚区(可点进分类页) */}
        <div className="mx-3 mt-2 bg-white rounded-xl px-1 py-2.5 grid grid-cols-5 gap-y-2.5">
          {MED_CATEGORIES.map((c) => (
            <button
              key={c.label}
              {...bindTap<HTMLButtonElement>('medicine.category-open', { params: { cat: c.label } })}
              className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer"
            >
              <span className="w-12 h-14 rounded-lg overflow-hidden flex flex-col shadow-sm border border-[#EEEEEE]">
                <span className="text-[9px] text-[#1A1A1A] bg-white py-[2px] font-semibold text-center">{c.brand}</span>
                <span className="flex-1" style={{ background: c.color }} />
              </span>
              <span className="text-[11px] text-[#1A1A1A]">{c.label}</span>
            </button>
          ))}
          {GRID_EXTRAS.map((c) => (
            <button
              key={c.label}
              {...miscStub()}
              className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer"
            >
              <span className="w-12 h-14 rounded-lg overflow-hidden flex flex-col shadow-sm border border-[#EEEEEE]">
                <span className="text-[9px] text-[#1A1A1A] bg-white py-[2px] font-semibold text-center">{c.brand}</span>
                <span className="flex-1" style={{ background: c.color }} />
              </span>
              <span className="text-[11px] text-[#1A1A1A]">{c.label}</span>
            </button>
          ))}
        </div>

        {/* 问医生条 */}
        <div className="mx-3 mt-2 bg-white rounded-xl px-3 py-2.5 flex items-center">
          <span className="w-10 h-10 rounded-full bg-[#E8F5F0] flex items-center justify-center text-[20px] shrink-0">👨‍⚕️</span>
          <div className="ml-2.5 text-[15px] font-semibold text-[#1A1A1A]">
            身体不舒服 <span className="text-[#2BB3A3]">问一问医生</span>
          </div>
          <button {...miscStub()} className="ml-auto h-8 px-4 rounded-full bg-[#2BB3A3] text-white text-[13px] font-semibold border-none cursor-pointer">
            去咨询
          </button>
        </div>

        {/* 健康卡会员区 */}
        <div className="mx-3 mt-2 rounded-xl bg-gradient-to-b from-[#FBEED9] to-[#FCE3C4] p-3">
          <div className="text-[15px] text-[#5C4318]">
            <span className="font-bold text-[18px]">健康卡</span>
            <span className="ml-1.5">开卡享<span className="text-[#E8362E] font-bold">712元</span>健康守护,已有159万+人享受</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2.5">
            {CARD_PERKS.slice(0, 2).map((p) => (
              <div key={p.title} className="bg-white/80 rounded-lg px-3 py-2.5">
                <div className="text-[12px] text-[#5C4318] truncate">{p.title}</div>
                <div className="flex items-center mt-0.5">
                  <span className="text-[20px] font-bold text-[#5C4318]">{p.value}</span>
                  {p.tag && <span className="ml-1.5 text-[10px] px-1 py-[1px] rounded bg-[#F53F3F] text-white">{p.tag}</span>}
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2 mt-2">
            {CARD_PERKS.slice(2).map((p) => (
              <div key={p.title} className="bg-white/80 rounded-lg px-1.5 py-2 text-center">
                <div className="text-[10px] text-[#5C4318] truncate">{p.title}</div>
                <div className="text-[13px] font-bold text-[#5C4318] mt-0.5 truncate">{p.value}</div>
              </div>
            ))}
          </div>
          <button {...miscStub()} className="w-full h-11 mt-2.5 rounded-full bg-[#3B3020] text-[#F6D9A0] text-[15px] font-bold border-none cursor-pointer">
            ¥99/年 立即开通
          </button>
        </div>

        {/* 附近好店(可进店购买) */}
        <div className="px-3 mt-3 flex items-center">
          <span className="font-bold text-[17px] text-[#1A1A1A]">附近药店</span>
          <span className="ml-auto text-[12px] text-[#999999]">现在下单最快 <span className="text-[#1A1A1A] font-semibold">18分钟</span> 送达</span>
        </div>
        <div className="px-3 py-2 flex flex-col gap-2 pb-4">
          {pharmacies.map((shop) => (
            <ShopCard
              key={shop.id}
              shop={shop}
              shopBinding={bindTap<HTMLDivElement>('medicine.pharmacy-open', { params: { shopId: shop.id } })}
            />
          ))}
        </div>
      </div>

      {/* 频道自有底部tab(stub) */}
      <div className="flex items-center bg-white border-t border-[#EEEEEE] shrink-0" data-hide-on-keyboard>
        {BOTTOM_TABS.map((t, i) => {
          const Icon = t.icon;
          return (
            <button
              key={t.label}
              {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'channel.medicine.misc.stub' }, {
                params: { tab: t.label }, onTrigger: () => showToast(s.notOpen),
              })}
              className="flex-1 flex flex-col items-center gap-0.5 py-1.5 bg-transparent border-none cursor-pointer"
            >
              <Icon size={20} className={i === 0 ? 'text-[#2BB3A3]' : 'text-[#999999]'} />
              <span className={`text-[10px] ${i === 0 ? 'text-[#2BB3A3] font-semibold' : 'text-[#999999]'}`}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
