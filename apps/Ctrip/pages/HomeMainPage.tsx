import React from 'react';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { Img, useToast, Price } from '../components/ui';
import { IconRenderer, IcSearch } from '../res/icons';
import { KINGKONG, HOME_FEED_TABS, WONTFIX_TOAST } from '../constants';

/**
 * 首页(spec home.main):会员栏 / 金刚区10入口 / 搜索框 / 运营卡 / 本地feed。
 * - 金刚区 page 类走各自 transitionId;toast 类统一「暂未开放」。
 * - 搜索框→search.result;feed 卡→dest.city。
 */
export default function HomeMainPage() {
  const { bindTap, go } = useCtripGestures();
  const [toast, showToast] = useToast();
  const user = useCtripStore((s) => s.user);
  const hotels = useCtripStore((s) => s.hotels);
  const attractions = useCtripStore((s) => s.attractions);
  const [feedTab, setFeedTab] = React.useState('上海');

  // 金刚区绑定:字符串字面量映射(DOM Tagging 规则)
  const KK_NAV: Record<string, object> = {
    'home.hotel-open': bindTap('home.hotel-open'),
    'home.dest-open': bindTap('home.dest-open', { params: { city: '上海' } }),
    'home.flight-open': bindTap('home.flight-open'),
    'home.train-open': bindTap('home.train-open'),
    'home.ticket2-open': bindTap('home.ticket2-open'),
    'home.carpickup-open': bindTap('home.carpickup-open'),
    'home.car-open': bindTap('home.car-open'),
  };
  const kkWontfix = bindTap({ kind: 'action', id: 'home.kingkong.wontfix' }, { onTrigger: () => showToast(WONTFIX_TOAST) });
  const opsWontfix = bindTap({ kind: 'action', id: 'home.ops.wontfix' }, { onTrigger: () => showToast(WONTFIX_TOAST) });
  const aiWontfix = bindTap({ kind: 'action', id: 'home.ai.wontfix' }, { onTrigger: () => showToast(WONTFIX_TOAST) });

  const feedItems = [
    ...hotels.slice(0, 2).map((h) => ({ id: h.id, image: h.image, title: h.name, tag: `¥${h.price}起`, sub: `${h.district} · ${h.score}分` })),
    ...attractions.slice(0, 2).map((a) => ({ id: a.id, image: a.image, title: a.name, tag: `¥${a.ticketTypes[0]?.price ?? ''}起`, sub: `${a.district} · ${a.score}分` })),
  ];

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      {/* 真机 418：蓝色品牌栏，搜索位于金刚区下方。 */}
      <div className="shrink-0 bg-gradient-to-b from-[#128CF4] to-[#2E9AF4] px-4 pt-3 pb-4">
        <div className="flex items-center justify-between text-white">
          <span className="text-[18px] font-bold tracking-tight">◒ 携程旅行</span>
          <div className="flex items-center gap-2 text-[12px]">
            <span className="bg-white/25 rounded-full px-2 py-1">◇ {user.memberLevel}</span>
            <span className="font-semibold text-[#FFF4AE]">● {user.points}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 金刚区：第一行彩色大方块，第二行轻量图标。 */}
        <div className="bg-white rounded-t-[18px] -mt-2 px-2.5 pt-3 pb-2">
          <div className="grid grid-cols-5 gap-x-1.5 gap-y-3">
          {KINGKONG.map((k, index) => {
            const isPage = k.kind === 'page';
            const binding = isPage ? KK_NAV[(k as { transitionId: string }).transitionId] : kkWontfix;
            const primary = index < 5;
            return (
              <button
                key={k.id}
                {...binding}
                className="flex min-w-0 flex-col items-center gap-1 bg-transparent border-none cursor-pointer"
              >
                <span
                  className={`flex items-center justify-center text-white ${
                    primary ? 'w-full aspect-square max-w-[58px] rounded-[13px] shadow-sm' : 'w-9 h-8 rounded-lg'
                  }`}
                  style={{
                    background: primary
                      ? `linear-gradient(145deg, ${k.color}, color-mix(in srgb, ${k.color} 78%, white))`
                      : 'transparent',
                    color: primary ? 'white' : k.color,
                  }}
                >
                  <IconRenderer name={k.icon} size={primary ? 24 : 22} />
                </span>
                <span className={`text-center whitespace-nowrap text-[#333333] ${primary ? 'text-[11px] -mt-6 text-white font-medium' : 'text-[11px]'}`}>
                  {k.label}
                </span>
              </button>
            );
          })}
          </div>
          <button
            {...kkWontfix}
            className="mt-3 flex h-8 w-full items-center justify-center gap-2 rounded-lg border-none bg-gradient-to-r from-[#F6F8FC] to-[#EEF4FF] text-[12px] text-[#333]"
          >
            <span className="text-[#756CF5]">▣</span><span className="text-[#23BFA5]">▰</span>
            <span className="text-[#FF9C36]">●</span><span>+14 个更多产品</span>
          </button>
        </div>

        {/* 搜索与快捷热词。 */}
        <div className="mx-2 mt-2 rounded-[16px] bg-gradient-to-br from-[#EAF6FF] to-[#F8FBFF] p-2.5 shadow-sm">
          <button
            {...bindTap('home.search-open')}
            className="flex h-11 w-full items-center gap-2 rounded-[12px] border-2 border-[#168AF0] bg-white px-3 text-left"
          >
            <IcSearch size={20} className="text-[#087BE8]" />
            <span className="flex-1 truncate text-[14px] text-[#333]">速8优选酒店（长春硅谷大街店）</span>
            <span className="rounded-lg bg-[#168AF0] px-2.5 py-1.5 text-[12px] text-white">搜索</span>
          </button>
          <div className="mt-2 flex gap-1.5 overflow-hidden text-[11px]">
            {['上海到长春机票', '卡斯顿酒店', '长春到无锡机票'].map((item) => (
              <button key={item} {...bindTap('home.search-open')} className="whitespace-nowrap rounded-md border-none bg-white px-2 py-1 text-[#333]">
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* 运营入口：与真机的一排白色卡片保持同组一致。 */}
        <div className="mx-2 mt-2 grid grid-cols-5 gap-1">
          {[
            ['特价/直播', '◆'], ['演出/展览', '♪'], ['行程规划', 'AI'], ['旅行热点', '▰'], ['携程榜单', '◒'],
          ].map(([label, glyph], index) => (
            <button
              key={label}
              {...(index === 2 ? aiWontfix : opsWontfix)}
              className="flex h-[62px] flex-col items-center justify-center gap-1 rounded-lg border-none bg-white text-[10px] text-[#222] shadow-sm"
            >
              <span className={`text-[18px] font-bold ${index === 2 ? 'text-[#3297F4]' : 'text-[#FF8734]'}`}>{glyph}</span>
              <span className="whitespace-nowrap">{label}</span>
            </button>
          ))}
        </div>

        {/* 本地 feed */}
        <div className="mt-3 px-2">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {HOME_FEED_TABS.map((t) => (
              <button
                key={t}
                onClick={() => setFeedTab(t)}
                className={`text-[14px] bg-transparent border-none cursor-pointer whitespace-nowrap ${feedTab === t ? 'text-[#111111] font-semibold' : 'text-[#888888]'}`}
              >{t}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 pb-4">
            {feedItems.map((it) => (
              <button
                key={it.id}
                {...bindTap('home.feed-open', { params: { city: '上海' } })}
                className="bg-white rounded-xl overflow-hidden border-none cursor-pointer p-0 text-left"
              >
                <Img src={it.image} className="w-full h-28 object-cover" />
                <div className="p-2">
                  <div className="text-[13px] text-[#222222] line-clamp-2 leading-snug">{it.title}</div>
                  <div className="text-[11px] text-[#999999] mt-1">{it.sub}</div>
                  <Price value={Number(String(it.tag).replace(/[^\d]/g, '')) || 0} size="s" className="mt-1 block" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
      {toast}
    </div>
  );
}
