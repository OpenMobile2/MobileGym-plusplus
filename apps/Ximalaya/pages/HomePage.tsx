import React, { useState } from 'react';
import { useXimalayaGestures } from '../hooks/useXimalayaGestures';
import { useXimalayaStrings } from '../hooks/useXimalayaStrings';
import { useXimalayaStore } from '../state';
import { Img, VipTag, showToast, wontfix, formatCount } from '../components/ui';
import { HOME_CATEGORY_TABS } from '../constants';
import {
  IcSearch, IcPlus, IcMenu, IcPlay, IcMore, IcSparkles, IcClose, IcCheck, IcClock, IcChevronRight, IcCar,
} from '../res/icons';

const QUICK_MENU = ['签到', '播放历史', '录音', '扫一扫', '切换模式', '智能硬件', '文档朗读器'];

export function HomePage() {
  const { bindTap } = useXimalayaGestures();
  const s = useXimalayaStrings();
  const albums = useXimalayaStore((st) => st.albums);
  const tracks = useXimalayaStore((st) => st.tracks);
  const history = useXimalayaStore((st) => st.history);
  const playTrack = useXimalayaStore((st) => st.playTrack);
  const [cat, setCat] = useState('推荐');
  const [menuOpen, setMenuOpen] = useState(false);

  // 续听横向卡片:取「正在收听」记录 + 专辑/声音
  const continueCards = history
    .filter((h) => h.kind === 'play')
    .map((h) => {
      const album = albums.find((a) => a.id === h.albumId);
      const track = tracks.find((t) => t.id === h.trackId);
      return album && track ? { h, album, track } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return (
    <div className="h-full flex flex-col pt-10 bg-[#F6F6F7] relative" data-status-bar-foreground="dark">
      {/* —— 顶部浅色区:搜索行 + 分类 Tab —— */}
      <div className="shrink-0 px-3 pt-1 pb-1">
        {/* 搜索行 */}
        <div className="flex items-center gap-2.5 h-11">
          <div className="flex-1 relative">
            <div
              {...bindTap('home.search-open')}
              className="h-9 bg-white rounded-full flex items-center pl-3 pr-10 gap-1.5 text-[#9A9A9A] text-[14px]"
            >
              <IcSearch size={16} className="text-[#B0B0B0]" />
              <span className="flex-1 truncate">大自然的声音</span>
            </div>
            <button
              {...bindTap({ kind: 'action', id: 'home.ai.wontfix' }, { stopPropagation: true, onTrigger: wontfix })}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-7 flex items-center justify-center"
              aria-label="AI 助手"
            >
              <IcSparkles size={20} className="text-[#3A7BE5] fill-current" />
            </button>
          </div>
          {/* 兔图标 */}
          <button
            {...bindTap({ kind: 'action', id: 'home.ai.wontfix' }, { onTrigger: wontfix })}
            className="w-8 h-6 rounded-md border border-[#D8D8D8] flex items-center justify-center text-[13px] text-[#333] shrink-0"
            aria-label="听头条"
          >
            兔
          </button>
          {/* 加号(带红点) */}
          <button
            {...bindTap({ kind: 'action', id: 'home.quickmenu.open' }, { onTrigger: () => setMenuOpen(true) })}
            className="relative w-7 h-7 flex items-center justify-center text-[#333] shrink-0"
            aria-label="快捷菜单"
          >
            <IcPlus size={24} strokeWidth={2.4} />
            <span className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-[#FE4543]" />
          </button>
        </div>

        {/* 分类 Tab */}
        <div
          className="flex items-center gap-5 mt-1.5 overflow-x-auto"
          data-scroll-container
          data-scroll-direction="horizontal"
        >
          {HOME_CATEGORY_TABS.map((c) => {
            const active = c === cat;
            const isRec = c === '推荐';
            return isRec ? (
              <button
                key={c}
                {...bindTap({ kind: 'action', id: 'home.category.switch.select.opt' }, { params: { cat: c }, onTrigger: () => setCat(c) })}
                className={
                  'shrink-0 pb-1.5 relative text-[17px] ' +
                  (active ? 'text-[#FE4543] font-semibold' : 'text-[#333]')
                }
              >
                {c}
                {active && (
                  <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-5 h-[3px] rounded-full bg-[#FE4543]" />
                )}
              </button>
            ) : (
              <button key={c} {...bindTap('home.categorysub-open', { params: { cat: c } })} className="shrink-0 pb-1.5 text-[17px] text-[#333]">
                {c}
              </button>
            );
          })}
          <button
            {...bindTap('home.categorymore-open')}
            className="shrink-0 pb-1.5 ml-auto pl-2 text-[#666]"
            aria-label="更多分类"
          >
            <IcMenu size={20} />
          </button>
        </div>
      </div>

      {/* —— 可滚动内容区 —— */}
      <div className="flex-1 overflow-y-auto pb-4" data-scroll-container data-scroll-direction="vertical">
        {/* 问候语 + VIP 促销 pill */}
        <div className="flex items-center justify-between px-3 mt-2 mb-2.5">
          <div className="flex items-center text-[18px] font-semibold text-[#222]">
            晚上好,消除疲惫听<IcChevronRight size={18} className="text-[#999]" />
          </div>
          <div
            {...bindTap('home.vip-open')}
            className="flex items-center gap-1 bg-[#FCE7DE] rounded-full pl-2 pr-3 py-1"
          >
            <span className="text-[13px] font-bold italic text-[#8A5A2B]">VIP</span>
            <span className="text-[12px] text-[#5A4632]">618返场月卡10元</span>
          </div>
        </div>

        {/* 续听横向卡片行 */}
        {continueCards.length > 0 && (
          <div
            className="flex gap-2.5 px-3 overflow-x-auto pb-1"
            data-scroll-container
            data-scroll-direction="horizontal"
          >
            {continueCards.map(({ h, album, track }, i) => {
              const prefix = i === 0 ? '正在听' : album.category;
              const bottom =
                h.remainSec > 0
                  ? `剩${Math.max(1, Math.round(h.remainSec / 60))}分钟`
                  : `剩余${album.trackCount}集`;
              return (
                <div
                  key={`${album.id}_${track.id}`}
                  {...bindTap('home.continue-play', { beforeTrigger: () => playTrack(album.id, track.id) })}
                  className="shrink-0 w-[150px] h-[190px] rounded-2xl p-2.5 flex flex-col"
                  style={{ backgroundColor: album.themeColor }}
                >
                  <Img src={album.cover} className="w-14 h-14 rounded-xl object-cover" />
                  <div className="mt-2 text-[13px] leading-snug font-medium text-white line-clamp-2">
                    <span className="text-white/70">{prefix}丨</span>
                    {album.title}
                  </div>
                  <div className="mt-auto self-start flex items-center gap-1 bg-white/90 rounded-full pl-2 pr-2.5 py-1">
                    <IcPlay size={11} className="text-[#333] fill-current" />
                    <span className="text-[12px] text-[#333]">{bottom}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 你的专属推荐 */}
        <div className="px-3 mt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[18px] font-semibold text-[#222]">你的专属推荐</span>
            <button {...bindTap({ kind: 'action', id: 'home.ai.wontfix' }, { onTrigger: wontfix })} className="text-[#BBB]" aria-label="更多">
              <IcMore size={20} />
            </button>
          </div>
          <div className="flex flex-col gap-4">
            {albums.map((a, i) => {
              const isRank = (a.recommendPct ?? 0) >= 97;
              return (
                <div key={a.id} {...bindTap('home.album-open', { params: { id: a.id } })} className="flex gap-3">
                  <Img src={a.cover} className="w-[92px] h-[92px] rounded-xl object-cover shrink-0" />
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="text-[16px] font-semibold text-[#222] leading-snug line-clamp-2">{a.title}</div>
                    <div className="text-[13px] text-[#9A9A9A] mt-1 line-clamp-1">{a.intro}</div>
                    <div className="mt-auto pt-2 flex items-center gap-1.5 flex-wrap text-[11px]">
                      {a.isVip && <VipTag />}
                      <span aria-hidden>🔥</span>
                      {isRank ? (
                        <span
                          {...bindTap('home.rank-open', { stopPropagation: true })}
                          className="px-1.5 py-0.5 rounded bg-[#F1F1F3] text-[#666]"
                        >
                          {a.category}榜No.{i + 1}
                        </span>
                      ) : (
                        <span className="text-[#C99A3A] font-medium">⚡神作必听⚡</span>
                      )}
                      <span className="flex items-center gap-0.5 text-[#9A9A9A]">
                        <IcPlay size={11} className="fill-current" />
                        {formatCount(a.playCount)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 你喜欢的都在这儿 + Banner 广告位 */}
        <div className="px-3 mt-5">
          <div className="text-[18px] font-semibold text-[#222] mb-3">你喜欢的都在这儿</div>
          <div
            onClick={wontfix}
            className="relative rounded-2xl overflow-hidden h-[150px] flex flex-col items-center justify-center bg-gradient-to-b from-[#6EC6F5] to-[#BCE6FB]"
          >
            <span className="absolute top-2 right-2 flex items-center gap-0.5 text-[11px] text-white/90 bg-black/15 rounded px-1.5 py-0.5">
              广告
            </span>
            <div className="text-white text-[30px] font-extrabold drop-shadow-sm tracking-wide">
              首单<span className="text-[#FFE14D]">5折</span>
            </div>
            <div className="mt-1 text-white text-[15px] font-bold bg-[#FFB300]/90 rounded-full px-3 py-0.5">
              天卡1.9元起
            </div>
          </div>
        </div>
      </div>

      {/* —— 右上加号快捷菜单(本地态弹窗) —— */}
      {menuOpen && (
        <div className="absolute inset-0 z-40" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative mt-14 mx-3 bg-white rounded-xl p-3 grid grid-cols-4 gap-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="col-span-4 flex justify-end -mt-1 -mr-1">
              <button onClick={() => setMenuOpen(false)} className="text-[#999]" aria-label="关闭">
                <IcClose size={18} />
              </button>
            </div>
            {QUICK_MENU.map((m) =>
              m === '播放历史' ? (
                <button
                  key={m}
                  {...bindTap('mine.history-open', { beforeTrigger: () => setMenuOpen(false) })}
                  className="flex flex-col items-center gap-1 text-[12px] text-[#333]"
                >
                  <div className="w-11 h-11 rounded-full bg-[#F5F5F5] flex items-center justify-center text-[#FE4543]">
                    <IcClock size={20} />
                  </div>
                  {m}
                </button>
              ) : m === '签到' ? (
                <button
                  key={m}
                  onClick={() => {
                    setMenuOpen(false);
                    showToast('积分入口已下线');
                  }}
                  className="flex flex-col items-center gap-1 text-[12px] text-[#333]"
                >
                  <div className="w-11 h-11 rounded-full bg-[#F5F5F5] flex items-center justify-center text-[#999]">
                    <IcCheck size={20} />
                  </div>
                  {m}
                </button>
              ) : m === '切换模式' ? (
                <button
                  key={m}
                  {...bindTap('home.driving-open', { beforeTrigger: () => setMenuOpen(false) })}
                  className="flex flex-col items-center gap-1 text-[12px] text-[#333]"
                >
                  <div className="w-11 h-11 rounded-full bg-[#F5F5F5] flex items-center justify-center text-[#FE4543]">
                    <IcCar size={20} />
                  </div>
                  {m}
                </button>
              ) : (
                <button
                  key={m}
                  onClick={() => {
                    setMenuOpen(false);
                    wontfix();
                  }}
                  className="flex flex-col items-center gap-1 text-[12px] text-[#333]"
                >
                  <div className="w-11 h-11 rounded-full bg-[#F5F5F5] flex items-center justify-center text-[#999]">
                    <IcChevronRight size={20} />
                  </div>
                  {m}
                </button>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}
