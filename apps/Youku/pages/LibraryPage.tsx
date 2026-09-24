import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Img from '../components/Img';
import { useYoukuGestures } from '../hooks/useYoukuGestures';
import { useYoukuStore } from '../state';
import { YOUKU_CONFIG } from '../data';
import { contentNavParams } from '../utils/openContent';
import {
  IcBack, CheckCircle, EditBar, EmptyBox, GOLD_BTN_STYLE, mmss, resolveContent, typeLabel,
} from './me/meShared';
import type { LibraryEntry } from '../types';

interface UpcomingItem {
  id: string;
  title: string;
  poster: string;
  dateText: string;
  reserveCount: number;
  desc: string;
}
const UPCOMING = YOUKU_CONFIG.upcoming as unknown as UpcomingItem[];

type LibTab = 'zhui' | 'yuyue' | 'fav';

/**
 * spec 节点 me.library(route /me/library?tab?=fav&edit?=1)—— 在追/预约/收藏(s242/s243/s244)。
 * base=在追tab,入口 ?tab=fav 落收藏;编辑多选态 URL 驱动(edit.enter push ?edit=1,back 退出);
 * 预约tab与新片预告 toggleReserve 双向联动。
 */
export default function LibraryPage() {
  const { bindTap, action, bindBack, back } = useYoukuGestures();
  const [sp, setSearchParams] = useSearchParams();
  const membership = useYoukuStore((s) => s.membership);
  const libFollowing = useYoukuStore((s) => s.libFollowing);
  const reservations = useYoukuStore((s) => s.reservations);
  const favorites = useYoukuStore((s) => s.favorites);
  const history = useYoukuStore((s) => s.history);
  const editSelect = useYoukuStore((s) => s._temp.editSelect);
  const setTemp = useYoukuStore((s) => s.setTemp);
  const removeLibraryItems = useYoukuStore((s) => s.removeLibraryItems);
  const toggleReserve = useYoukuStore((s) => s.toggleReserve);
  const showToast = useYoukuStore((s) => s.showToast);

  // tab 改 URL 驱动:点进影视卡再返回时,URL 保留当前 tab,不再回落到默认/入口 tab
  const tabParam = sp.get('tab');
  const tab: LibTab = tabParam === 'fav' ? 'fav' : tabParam === 'yuyue' ? 'yuyue' : 'zhui';
  const selectTab = (next: LibTab) =>
    setSearchParams(
      (p) => {
        if (next === 'zhui') p.delete('tab');
        else p.set('tab', next);
        p.delete('edit');
        return p;
      },
      { replace: true },
    );
  const [favSub, setFavSub] = useState<'video' | 'comic'>('video');
  const isEdit = sp.get('edit') === '1';

  const editableList: LibraryEntry[] = tab === 'zhui' ? libFollowing : favorites;
  const allIds = editableList.map((e) => e.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => editSelect.includes(id));

  const enterEdit = () => {
    setTemp({ editSelect: [] });
    setSearchParams((p) => {
      p.set('edit', '1');
      return p;
    });
  };
  const toggleSelect = (id: string) => {
    setTemp({
      editSelect: editSelect.includes(id) ? editSelect.filter((x) => x !== id) : [...editSelect, id],
    });
  };

  const lastEp = (id: string): number => {
    const h = history.find((x) => x.id === id && x.episode != null);
    return h?.episode ?? 1;
  };

  /** 在追进度文案:优先按观看历史派生(观看后不再显示"未观看"),无历史再回落种子文案 */
  const zhuiProgress = (e: LibraryEntry): string => {
    const h = history.find((x) => x.id === e.id);
    if (h) {
      if (h.episode != null) return `看至第${h.episode}集`;
      if (h.durationSec > 0 && h.progressSec >= h.durationSec) return '已看完';
      return `看到${mmss(h.progressSec)}`;
    }
    return e.progressText || '未观看';
  };

  const tabBtn = (id: LibTab, label: string) => {
    const bind =
      id === 'zhui'
        ? action('me.library.tab.select.zhui', () => selectTab('zhui'))
        : id === 'yuyue'
          ? action('me.library.tab.select.yuyue', () => selectTab('yuyue'))
          : action('me.library.tab.select.fav', () => selectTab('fav'));
    return (
      <button
        {...bind}
        className={`cursor-pointer border-none bg-transparent p-0 ${
          tab === id ? 'text-[20px] font-bold text-(--app-c-text-primary)' : 'text-[17px] text-[#8A8A8A]'
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="flex h-full w-full flex-col bg-(--app-c-page-bg) pt-10 text-(--app-c-text-primary)">
      {/* 顶栏:返回 / 在追·预约·收藏 / 编辑(编辑态=取消) */}
      <div className="flex h-12 shrink-0 items-center px-3">
        <button {...bindBack()} aria-label="返回" className="flex h-9 w-9 cursor-pointer items-center justify-center border-none bg-transparent p-0 text-(--app-c-text-primary)">
          <IcBack size={24} strokeWidth={2.2} />
        </button>
        <div className="flex flex-1 items-baseline justify-center gap-7">
          {tabBtn('zhui', '在追')}
          {tabBtn('yuyue', '预约')}
          {tabBtn('fav', '收藏')}
        </div>
        {isEdit ? (
          <button {...bindBack()} className="w-10 cursor-pointer border-none bg-transparent p-0 text-right text-[15px] text-(--app-c-text-primary)">
            取消
          </button>
        ) : tab !== 'yuyue' ? (
          <button
            {...action('me.library.edit.enter', enterEdit)}
            className="w-10 cursor-pointer border-none bg-transparent p-0 text-right text-[15px] text-(--app-c-text-primary)"
          >
            编辑
          </button>
        ) : (
          <span className="w-10" />
        )}
      </div>

      <div data-scroll-container="main" data-scroll-direction="vertical" className="min-h-0 flex-1 overflow-y-auto pb-4">
        {/* ---------------- 在追tab(s244) ---------------- */}
        {tab === 'zhui' && (
          <>
            {/* SVIP 横幅(假开通全局联动) */}
            <div
              className="mx-3 mt-2 flex items-center rounded-xl px-4 py-3"
              style={{ background: 'linear-gradient(90deg,#3A2E1C,#6B5636)' }}
            >
              {membership.active ? (
                <span className="text-[15px] font-bold text-[#F5E3B0]">
                  {membership.tier === 'svip' ? 'SVIP已开通,追更快人一步' : 'VIP已开通,精彩抢先看'}
                </span>
              ) : (
                <>
                  <span className="text-[15px] font-bold text-[#F5E3B0]">成为SVIP,追更快人一步</span>
                  <button
                    {...bindTap('me.library.vip.open')}
                    className="ml-auto shrink-0 cursor-pointer rounded-lg border-none px-3.5 py-2 text-[13px] font-bold"
                    style={GOLD_BTN_STYLE}
                  >
                    立即开通
                  </button>
                </>
              )}
            </div>

            {libFollowing.length === 0 && <EmptyBox text="还没有在追的内容" />}
            {libFollowing.map((e) => {
              const r = resolveContent(e.id, String(e.ctype));
              if (!r) return null;
              const card = (
                <>
                  <div className="relative h-[86px] w-[152px] shrink-0 overflow-hidden rounded-lg bg-(--app-c-card-bg)">
                    <Img src={r.cover} label={r.title} ratio="landscape" className="h-full w-full object-cover" />
                    {e.ctype === 'drama' && (
                      <span className="absolute right-1 top-1 rounded bg-black/50 px-1.5 py-0.5 text-[10px] leading-none text-white">短剧</span>
                    )}
                    {r.badge && e.ctype !== 'drama' && (
                      <span className="absolute right-1 top-1 rounded bg-black/50 px-1.5 py-0.5 text-[10px] leading-none text-white">{r.badge}</span>
                    )}
                    {r.episodeCount != null && (
                      <span className="absolute bottom-1 left-1 rounded bg-black/50 px-1 py-0.5 text-[10px] leading-none text-white">
                        {typeLabel(e.ctype === 'drama' ? 'drama' : 'series')} /{' '}
                        {r.updatedTo != null && r.updatedTo < r.episodeCount ? `更新至${r.updatedTo}集` : `${r.episodeCount}集全`}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 py-1">
                    <div className="truncate text-[17px] font-medium text-(--app-c-text-primary)">{r.title}</div>
                    <div className="mt-2 text-[13px] text-[#999999]">{zhuiProgress(e)}</div>
                    {e.perk && <div className="mt-2 text-[13px] text-[#E8C87E]">{e.perk}</div>}
                  </div>
                </>
              );
              if (isEdit) {
                return (
                  <div
                    key={e.id}
                    {...action('me.library.edit.select.toggle', () => toggleSelect(e.id), {
                      params: { itemId: e.id, value: editSelect.includes(e.id) ? '0' : '1' },
                    })}
                    className="flex cursor-pointer items-center gap-3 px-3 py-2.5"
                  >
                    <CheckCircle checked={editSelect.includes(e.id)} />
                    {card}
                  </div>
                );
              }
              return (
                <div
                  key={e.id}
                  {...bindTap('me.library.zhuiItem.open', {
                    // 按内容类型分流(短剧→连播页/电影→电影页/短视频→feed,不再错跳)
                    params: contentNavParams({ id: e.id, type: e.ctype }, { ep: lastEp(e.id) }),
                  })}
                  className="flex cursor-pointer items-center gap-3 px-3 py-2.5"
                >
                  {card}
                </div>
              );
            })}
          </>
        )}

        {/* ---------------- 预约tab(qa:Q12 双向联动) ---------------- */}
        {tab === 'yuyue' && (
          <>
            {reservations.length === 0 && <EmptyBox text="还没有预约的影片" />}
            {reservations.map((id) => {
              const u = UPCOMING.find((x) => x.id === id);
              if (!u) return null;
              return (
                <div
                  key={id}
                  {...action('me.library.reserve.toast', () => showToast('影片尚未上线,敬请期待'), {
                    params: { upcomingId: id },
                  })}
                  className="flex cursor-pointer items-center gap-3 px-3 py-2.5"
                >
                  <div className="h-[100px] w-[72px] shrink-0 overflow-hidden rounded-lg bg-(--app-c-card-bg)">
                    <Img src={u.poster} label={u.title} ratio="poster" className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[17px] font-medium">{u.title}</div>
                    <div className="mt-1.5 text-[13px] text-[#FF6000]">{u.dateText}</div>
                    <div className="mt-1.5 truncate text-[12px] text-[#999999]">{u.desc}</div>
                  </div>
                  <button
                    {...action('me.library.reserve.cancel', () => toggleReserve(id), {
                      params: { upcomingId: id },
                      stopPropagation: true,
                    })}
                    className="shrink-0 cursor-pointer rounded-full border-none bg-(--app-c-chip-bg) px-4 py-2 text-[13px] text-[#999999]"
                  >
                    已预约
                  </button>
                </div>
              );
            })}
          </>
        )}

        {/* ---------------- 收藏tab(s242 视频子tab / 漫画恒空态) ---------------- */}
        {tab === 'fav' && (
          <>
            <div className="flex gap-2.5 px-3 pt-2">
              <button
                {...action('me.library.favtab.select.video', () => setFavSub('video'))}
                className={`cursor-pointer rounded-full border-none px-4 py-1.5 text-[14px] ${
                  favSub === 'video' ? 'bg-(--app-c-chip-bg) font-bold text-(--app-c-text-primary)' : 'bg-transparent text-[#8A8A8A]'
                }`}
              >
                视频
              </button>
              <button
                {...action('me.library.favtab.select.comic', () => setFavSub('comic'))}
                className={`cursor-pointer rounded-full border-none px-4 py-1.5 text-[14px] ${
                  favSub === 'comic' ? 'bg-(--app-c-chip-bg) font-bold text-(--app-c-text-primary)' : 'bg-transparent text-[#8A8A8A]'
                }`}
              >
                漫画
              </button>
            </div>

            {favSub === 'comic' && <EmptyBox text="暂时没有收藏的漫画" />}
            {favSub === 'video' && favorites.length === 0 && <EmptyBox text="还没有收藏的内容" />}
            {favSub === 'video' &&
              favorites.map((e) => {
                const r = resolveContent(e.id, String(e.ctype));
                if (!r) return null;
                const card = (
                  <>
                    <div className="relative h-[86px] w-[152px] shrink-0 overflow-hidden rounded-lg bg-(--app-c-card-bg)">
                      <Img src={r.cover} label={r.title} ratio="landscape" className="h-full w-full object-cover" />
                      {r.durationSec != null && (
                        <span className="absolute bottom-1 right-1.5 text-[11px] font-medium text-(--app-c-text-primary) [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]">
                          {mmss(r.durationSec)}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 py-1">
                      <div className="line-clamp-2 text-[16px] leading-snug text-(--app-c-text-primary)">{r.title}</div>
                      <div className="mt-2 text-[13px] text-[#999999]">{e.progressText || ''}</div>
                    </div>
                  </>
                );
                if (isEdit) {
                  return (
                    <div
                      key={e.id}
                      {...action('me.library.edit.select.toggle', () => toggleSelect(e.id), {
                        params: { itemId: e.id, value: editSelect.includes(e.id) ? '0' : '1' },
                      })}
                      className="flex cursor-pointer items-center gap-3 px-3 py-2.5"
                    >
                      <CheckCircle checked={editSelect.includes(e.id)} />
                      {card}
                    </div>
                  );
                }
                // 内容卡通用路由:短视频/短剧 → shorts feed;电影/剧集走各自 4 分支字面量
                if (e.ctype === 'short' || e.ctype === 'drama') {
                  return (
                    <div
                      key={e.id}
                      {...bindTap('me.library.favItem.open', { params: { shortId: e.id } })}
                      className="flex cursor-pointer items-center gap-3 px-3 py-2.5"
                    >
                      {card}
                    </div>
                  );
                }
                if (e.ctype === 'movie') {
                  return (
                    <div
                      key={e.id}
                      {...bindTap('me.library.favItem.movie.open', { params: contentNavParams({ id: e.id, type: e.ctype }) })}
                      className="flex cursor-pointer items-center gap-3 px-3 py-2.5"
                    >
                      {card}
                    </div>
                  );
                }
                return (
                  <div
                    key={e.id}
                    {...bindTap('me.library.favItem.series.open', {
                      params: contentNavParams({ id: e.id, type: e.ctype }, { ep: lastEp(e.id) }),
                    })}
                    className="flex cursor-pointer items-center gap-3 px-3 py-2.5"
                  >
                    {card}
                  </div>
                );
              })}
          </>
        )}
      </div>

      {/* 编辑态底部栏:全选 / 删除(删除后退出编辑态,me.main 入口联动) */}
      {isEdit && (
        <EditBar
          hasSelection={editSelect.length > 0}
          selectAllBind={action('me.library.edit.selectAll.toggle', () =>
            setTemp({ editSelect: allSelected ? [] : allIds }),
          )}
          deleteBind={action('me.library.edit.delete.commit', () => {
            if (editSelect.length === 0) {
              showToast('请先选择要删除的内容');
              return;
            }
            removeLibraryItems(tab === 'zhui' ? 'zhui' : 'fav', editSelect);
            back();
          })}
        />
      )}
    </div>
  );
}
