import React, { useState } from 'react';
import { useXimalayaGestures } from '../hooks/useXimalayaGestures';
import { useXimalayaStrings } from '../hooks/useXimalayaStrings';
import { useXimalayaStore } from '../state';
import { TopBar, Img, VipTag, EmptyState, showToast, wontfix, formatCount } from '../components/ui';
import {
  IcPlus, IcMore, IcSort, IcCheck, IcChevronRight, IcHeadphones, IcStar, IcClose, IcPlay,
} from '../res/icons';

const SORT_OPTIONS = ['默认排序', '最近更新', '最近收听', '播放最多'];
const ITEM_MENU = ['去评价', '置顶', '找相似', '分享', '取消订阅'];

export function SubscribePage() {
  const { bindTap } = useXimalayaGestures();
  const s = useXimalayaStrings();
  const albums = useXimalayaStore((st) => st.albums);
  const tracks = useXimalayaStore((st) => st.tracks);
  const listenLists = useXimalayaStore((st) => st.listenLists);
  const subscribedAlbumIds = useXimalayaStore((st) => st.subscribedAlbumIds);
  const player = useXimalayaStore((st) => st.player);
  const toggleSubscribe = useXimalayaStore((st) => st.toggleSubscribe);

  const [tab, setTab] = useState<string>('全部');
  const [sort, setSort] = useState('默认排序');
  const [sortOpen, setSortOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [menuAlbum, setMenuAlbum] = useState<string | null>(null);

  const subscribed = albums.filter((a) => subscribedAlbumIds.includes(a.id));
  const listByTab = tab === '播客'
    ? subscribed.filter((a) => a.category === '播客')
    : tab === '有声书'
      ? subscribed.filter((a) => a.category !== '播客')
      : subscribed;

  const contTrack = tracks.find((t) => t.id === player.currentTrackId);
  const contAlbum = albums.find((a) => a.id === player.currentAlbumId);
  const favList = listenLists.find((l) => l.id === 'll_fav');
  const menuAlbumObj = albums.find((a) => a.id === menuAlbum);

  const TABS = [
    { label: '全部', bind: bindTap({ kind: 'action', id: 'subscribe.tab.select.opt' }, { params: { tab: '全部' }, onTrigger: () => setTab('全部') }) },
    { label: '有声书', bind: bindTap({ kind: 'action', id: 'subscribe.tab.select.opt' }, { params: { tab: '有声书' }, onTrigger: () => setTab('有声书') }) },
    { label: '播客', bind: bindTap({ kind: 'action', id: 'subscribe.tab.select.opt' }, { params: { tab: '播客' }, onTrigger: () => setTab('播客') }) },
    { label: '听单', bind: bindTap({ kind: 'action', id: 'subscribe.tab.select.opt' }, { params: { tab: '听单' }, onTrigger: () => setTab('听单') }) },
  ];

  return (
    <div className="h-full flex flex-col pt-10 bg-[#F5F5F5] relative" data-status-bar-foreground="dark">
      {/* 顶栏 */}
      <TopBar
        title={s.subscribe}
        right={(
          <div className="flex items-center">
            <button {...bindTap('subscribe.add-open')} aria-label="添加订阅" className="w-9 h-9 flex items-center justify-center"><IcPlus size={22} /></button>
            <button {...bindTap({ kind: 'action', id: 'subscribe.more.open' }, { onTrigger: () => setMoreOpen(true) })} aria-label="更多" className="w-9 h-9 flex items-center justify-center"><IcMore size={22} /></button>
          </div>
        )}
      />

      {/* 分类 Tab */}
      <div className="shrink-0 bg-white flex items-center gap-5 px-4 pb-2 text-[15px]">
        {TABS.map((t) => {
          const active = t.label === tab;
          return (
            <button key={t.label} {...t.bind} className={active ? 'text-[#333] font-semibold border-b-2 border-[#FE4543] pb-1' : 'text-[#999] pb-1'}>{t.label}</button>
          );
        })}
      </div>

      {/* 排序/批量 条 */}
      <div className="shrink-0 bg-white border-t border-[#F5F5F5] flex items-center justify-between px-4 py-2 text-[12px] text-[#666]">
        <button {...bindTap({ kind: 'action', id: 'subscribe.sort.select.opt' }, { params: { sort }, onTrigger: () => setSortOpen(true) })} className="flex items-center gap-1">
          <IcSort size={14} />{sort}
        </button>
        <button {...bindTap('subscribe.manage-open')} className="flex items-center gap-1">{s.manage}</button>
      </div>

      {/* 内容 */}
      <div className="flex-1 overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
        {tab === '听单' ? (
          <div className="p-3 flex flex-col gap-2">
            {listenLists.map((l) => (
              <div key={l.id} {...bindTap('subscribe.listenlist-open', { params: { id: l.id } })} className="bg-white rounded-xl p-3 flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-[#FFF0EF] flex items-center justify-center text-[#FE4543]"><IcStar size={22} /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] text-[#333] font-medium truncate">{l.name}</div>
                  <div className="text-[12px] text-[#999]">{l.trackIds.length} 个声音{l.isPrivate ? ' · 私密' : ''}</div>
                </div>
                <IcChevronRight size={18} className="text-[#CCC]" />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 flex flex-col gap-2">
            {/* 续播 */}
            {contAlbum && contTrack && (
              <div {...bindTap('subscribe.player-open')} className="bg-white rounded-xl p-2.5 flex items-center gap-3">
                <Img src={contAlbum.cover} className="w-12 h-12 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] text-[#999]">继续收听</div>
                  <div className="text-[14px] text-[#333] font-medium truncate">{contTrack.title}</div>
                </div>
                <div className="w-9 h-9 rounded-full bg-[#FE4543] flex items-center justify-center text-white"><IcPlay size={18} /></div>
              </div>
            )}

            {/* 我收藏的声音(听单) */}
            {favList && (
              <div {...bindTap('subscribe.listenlist-open', { params: { id: 'll_fav' } })} className="bg-white rounded-xl p-3 flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-[#FFF6E5] flex items-center justify-center text-[#F5A623]"><IcStar size={22} /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] text-[#333] font-medium truncate">{favList.name}</div>
                  <div className="text-[12px] text-[#999]">{favList.trackIds.length} 个声音 · 私密</div>
                </div>
                <IcChevronRight size={18} className="text-[#CCC]" />
              </div>
            )}

            {/* 订阅专辑列表 */}
            {listByTab.length === 0 ? (
              <EmptyState text={s.empty_subscribe} />
            ) : (
              listByTab.map((a) => (
                <div key={a.id} {...bindTap('subscribe.album-open', { params: { id: a.id } })} className="bg-white rounded-xl p-2.5 flex items-center gap-3">
                  <Img src={a.cover} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] text-[#333] font-medium leading-snug line-clamp-2">{a.title}</div>
                    <div className="mt-1 flex items-center gap-1">
                      {a.isVip && <VipTag />}
                      <span className="text-[11px] text-[#999]">{a.finished ? '已完结' : `连载中·${a.trackCount}集`}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-[#999]"><IcHeadphones size={11} />{formatCount(a.playCount)}</div>
                  </div>
                  <button
                    {...bindTap({ kind: 'action', id: 'subscribe.item.menu' }, { params: { albumId: a.id }, stopPropagation: true, onTrigger: () => setMenuAlbum(a.id) })}
                    aria-label="更多" className="w-8 h-8 flex items-center justify-center text-[#999]"
                  ><IcMore size={20} /></button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 排序菜单(本地态) */}
      {sortOpen && (
        <div className="absolute inset-0 z-40" onClick={() => setSortOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute left-3 right-3 top-[152px] bg-white rounded-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {SORT_OPTIONS.map((o) => (
              <button key={o} onClick={() => { setSort(o); setSortOpen(false); }} className="w-full flex items-center justify-between px-4 py-3 text-[14px] text-[#333] border-b border-[#F5F5F5] last:border-0">
                {o}{o === sort && <IcCheck size={16} className="text-[#FE4543]" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 更多菜单(本地态) */}
      {moreOpen && (
        <div className="absolute inset-0 z-40" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute right-3 top-[52px] bg-white rounded-xl overflow-hidden w-40" onClick={(e) => e.stopPropagation()}>
            <button {...bindTap('subscribe.add-open', { beforeTrigger: () => setMoreOpen(false) })} className="w-full text-left px-4 py-3 text-[14px] text-[#333] border-b border-[#F5F5F5]">搜索订阅</button>
            <button {...bindTap('subscribe.manage-open', { beforeTrigger: () => setMoreOpen(false) })} className="w-full text-left px-4 py-3 text-[14px] text-[#333] border-b border-[#F5F5F5]">批量管理</button>
            <button onClick={() => { setMoreOpen(false); wontfix(); }} className="w-full text-left px-4 py-3 text-[14px] text-[#333]">宫格视图</button>
          </div>
        </div>
      )}

      {/* 专辑项…菜单(本地态,对应 subscribe.itemmenu) */}
      {menuAlbum && menuAlbumObj && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end" onClick={() => setMenuAlbum(null)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative bg-white rounded-t-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[#F5F5F5]">
              <Img src={menuAlbumObj.cover} className="w-10 h-10 rounded-lg object-cover" />
              <div className="flex-1 text-[14px] text-[#333] font-medium truncate">{menuAlbumObj.title}</div>
              <button onClick={() => setMenuAlbum(null)} className="text-[#999]"><IcClose size={20} /></button>
            </div>
            {ITEM_MENU.map((m) => (
              <button
                key={m}
                onClick={() => {
                  if (m === '取消订阅') { toggleSubscribe(menuAlbum); showToast('已取消订阅'); }
                  else if (m === '置顶') showToast('已置顶');
                  else wontfix();
                  setMenuAlbum(null);
                }}
                className={`w-full text-left px-4 py-3.5 text-[15px] border-b border-[#F5F5F5] last:border-0 ${m === '取消订阅' ? 'text-[#FE4543]' : 'text-[#333]'}`}
              >{m}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
