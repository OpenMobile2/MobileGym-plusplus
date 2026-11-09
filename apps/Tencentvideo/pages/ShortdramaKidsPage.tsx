// 短剧⇌少儿形态(浏览版)。节点 shortdrama.kids(spec:整节点版式 inferred)。
// 证据链:757 只证明类型下拉里有「少儿」一项;少儿内容的版式参照少儿频道 780-782
// (banner + 双列横版卡:序号角标 + 右上角标 + 右下集数 + 片名 + 榜单 chip)。
// 浏览版口径:内容卡不展开深层,一律 toast「该功能暂未开放」(spec 已把它建成 wontfix)。
import React, { useMemo } from 'react';
import { useTencentvideoGestures } from '../hooks/useTencentvideoGestures';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import { useTencentvideoStore } from '../state';
import { TV_COLORS as C } from '../constants';
import { ShortdramaTypeHeader } from '../components/shortdrama';
import { TvImg } from '../components/Img';
import { Badge, EmptyState } from '../components/ui';

const UI_MENU = 'shortdrama.kids.typemenu';

export default function ShortdramaKidsPage() {
  const { bindTap } = useTencentvideoGestures();
  const s = useTencentvideoStrings();

  const contents = useTencentvideoStore((s) => s.contents);
  const channels = useTencentvideoStore((s) => s.channels);
  const rankings = useTencentvideoStore((s) => s.rankings);
  const wontfixToast = useTencentvideoStore((s) => s.wontfixToast);
  const ui = useTencentvideoStore((s) => s.ui);
  const toast = useTencentvideoStore((s) => s.toast);
  const setUi = useTencentvideoStore((s) => s.setUi);

  const sd = channels.shortdrama ?? {};
  const kids = channels.kids ?? {};
  const modes = useMemo(() => sd.modes ?? [], [sd.modes]);
  const tabs = useMemo(() => sd.subTabs ?? [], [sd.subTabs]);
  const menuOpen = ui[UI_MENU] === true;

  const byId = useMemo(() => {
    const m = new Map<string, (typeof contents)[number]>();
    for (const c of contents) m.set(c.id, c);
    return m;
  }, [contents]);

  /** 少儿宫格:少儿热播榜(证据 780 的双列榜单宫格就是这套顺序) */
  const items = useMemo(
    () => rankings.kids.hot.map((id) => byId.get(id)).filter((c) => c !== undefined),
    [rankings.kids.hot, byId],
  );

  const banner = kids.banner;
  const bannerContent = banner?.contentId ? byId.get(banner.contentId) : undefined;

  const cardWontfix = bindTap({ kind: 'action', id: 'shortdrama.kids.card.wontfix' }, {
    onTrigger: () => toast(s.notOpen),
  });

  return (
    <div className="flex flex-col h-full" style={{ background: C.pageBg }} data-status-bar-foreground="dark">
      <ShortdramaTypeHeader
        mode={modes[2] ?? ''}
        modes={modes}
        // 少儿形态只有「推荐」一条 tab(spec regions),且未申报 tab 交互 → 纯文字渲染
        tabs={tabs.slice(0, 1)}
        activeTab={tabs[0] ?? ''}
        menuOpen={menuOpen}
        typeBind={bindTap({ kind: 'action', id: 'shortdrama.kids.typemenu.toggle' }, {
          onTrigger: () => setUi(UI_MENU, !menuOpen),
        })}
        // 下拉选「短剧」/「短番」= 回短剧频道页(replace);选「少儿」= 已在本页,收起下拉
        getModeBind={(m) =>
          m === modes[2]
            ? bindTap({ kind: 'action', id: 'shortdrama.kids.typemenu.toggle' }, {
              onTrigger: () => setUi(UI_MENU, false),
            })
            : bindTap('shortdrama.home.open.fromKids')
        }
      />

      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {banner && (
          <div {...cardWontfix} className="px-3 pt-1 pb-2 cursor-pointer">
            <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden">
              <TvImg
                id={banner.img ?? bannerContent?.still}
                alt={banner.title ?? ''}
                className="w-full h-full object-cover"
              />
              <div
                className="absolute inset-x-0 bottom-0 px-3 pb-2.5 pt-8"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.72), transparent)' }}
              >
                <div className="text-white text-[17px] font-bold truncate">{banner.title}</div>
                {banner.subtitle && (
                  <div className="text-white/85 text-[12px] truncate">{banner.subtitle}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <EmptyState text="暂无少儿内容" />
        ) : (
          <div className="grid grid-cols-2 gap-x-2.5 gap-y-3 px-3">
            {items.map((c, i) => (
              <div key={c.id} {...cardWontfix} className="flex flex-col min-w-0 cursor-pointer">
                <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                  <TvImg id={c.still ?? c.poster} alt={c.title} className="w-full h-full object-cover" />
                  <span
                    className="absolute top-0 left-0 w-5 h-5 text-[11px] leading-5 text-center font-bold text-white rounded-br-[6px]"
                    style={{ background: C.badgeOrange }}
                  >
                    {i + 1}
                  </span>
                  {c.badge && (
                    <div className="absolute top-0 right-0">
                      <Badge text={c.badge} className="rounded-none rounded-bl-[6px] rounded-tr-[8px]" />
                    </div>
                  )}
                  <div
                    className="absolute inset-x-0 bottom-0 px-1.5 pb-0.5 pt-4 text-right text-[10px] leading-none text-white"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }}
                  >
                    {c.updatedTo && c.episodes && c.updatedTo < c.episodes
                      ? `更新至${c.updatedTo}集`
                      : c.episodes
                        ? `全${c.episodes}集`
                        : ''}
                  </div>
                </div>
                <div className="mt-1.5 text-[14px] font-medium truncate" style={{ color: C.text }}>
                  {c.title}
                </div>
                {typeof c.rankNote === 'string' && (
                  <div className="mt-1">
                    <span
                      className="inline-block px-1.5 py-[3px] rounded text-[11px] leading-none"
                      style={{ background: C.rankChipBg, color: C.rankChipText }}
                    >
                      {c.rankNote}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="h-4" />
      </div>
    </div>
  );
}
