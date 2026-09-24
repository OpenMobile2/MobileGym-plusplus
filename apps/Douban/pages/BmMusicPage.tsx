import React from 'react';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, Img, RatingLine } from '../components/ui';
import { ChannelTopBar } from '../components/ChannelTopBar';
import type { DoubanSubject } from '../types';

/** 封面左上 ♡+/✓ 半透明角标(真机 IMG_0378/0379:每张封面带标记角标,无序号) */
function CoverMark({ done }: { done?: boolean }) {
  return (
    <span
      className="absolute top-1 left-1 w-7 h-7 rounded-lg flex items-center justify-center text-[11px] text-white"
      style={{ background: 'rgba(0,0,0,0.3)' }}
    >
      {done ? '✓' : '♡+'}
    </span>
  );
}

// 书影音-音乐频道:热门单曲榜网格 + 新碟榜tab + 专辑网格 + 分类浏览。
export default function BmMusicPage() {
  const { bindTap } = useDoubanGestures();
  const subjects = useDoubanStore((s) => s.subjects);
  const rankings = useDoubanStore((s) => s.rankings);
  const notifications = useDoubanStore((s) => s.notifications);
  const toast = useDoubanStore((s) => s.toast);
  const [disc, setDisc] = React.useState('华语');
  const unread = React.useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const musics = React.useMemo(() => subjects.filter((s) => s.type === 'music'), [subjects]);
  const musicRank = React.useMemo(() => rankings.find((r) => r.kind === 'music'), [rankings]);
  const byId = React.useMemo(() => {
    const m: Record<string, DoubanSubject> = {};
    subjects.forEach((s) => (m[s.id] = s));
    return m;
  }, [subjects]);
  const topSongs = React.useMemo(
    () => (musicRank?.items ?? []).map((it) => byId[it.subjectId]).filter(Boolean).slice(0, 6),
    [musicRank, byId],
  );
  // 新碟榜 华语/欧美/日韩 按 genres 真过滤(数据无 region 字段:华语=含「华语」;日韩=含 K/J-Pop 等;其余=欧美)
  const discMusics = React.useMemo(() => {
    const has = (m: DoubanSubject, kws: string[]) => (m.genres ?? []).some((g) => kws.includes(g));
    const CJK = ['华语'], JK = ['K-Pop', 'J-Pop', '韩语', '日语'];
    return musics.filter((m) => {
      if (disc === '华语') return has(m, CJK);
      if (disc === '日韩') return has(m, JK);
      return !has(m, CJK) && !has(m, JK); // 欧美 = 非华语非日韩
    });
  }, [musics, disc]);

  const channels: { ch: string; label: string }[] = [
    { ch: 'movie', label: '电影' },
    { ch: 'tv', label: '电视' },
    { ch: 'book', label: '读书' },
    { ch: 'podcast', label: '播客' },
    { ch: 'music', label: '音乐' },
    { ch: 'city', label: '同城' },
  ];
  const discTabs = ['华语', '欧美', '日韩'];
  /** 真机「全部14 ›」随 tab 变化(IMG_0378 华语14 / IMG_0379 欧美15) */
  const discCount = 14 + Math.max(0, discTabs.indexOf(disc));

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      <ChannelTopBar
        menuBinding={bindTap('bm.music.drawer-open')}
        searchBinding={bindTap('bm.music.search-open')}
        audioBinding={bindTap({ kind: 'action', id: 'bm.music.headphone.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
        messageBinding={bindTap('bm.music.message-open')}
        searchText="魔方小姐首日票房仅127万"
        unread={unread}
      />

      {/* 二级频道Tab条:六个Tab均匀铺满,当前项黑粗+短黑下划线(对齐真机 IMG_0378) */}
      <div className="flex items-center h-10 shrink-0 bg-white overflow-x-auto" data-scroll-container="channel-tabs" data-scroll-direction="horizontal">
        {channels.map((c) => {
          const active = c.ch === 'music';
          const inner = (
            <>
              <span className={`text-sm ${active ? 'font-bold' : ''}`} style={{ color: active ? C.text : C.sub }}>{c.label}</span>
              <span className="mt-1 rounded-full" style={{ width: 22, height: 3, background: active ? C.text : 'transparent' }} />
            </>
          );
          return active ? (
            <span key={c.ch} className="flex-1 min-w-0 flex flex-col items-center justify-center pt-1.5">{inner}</span>
          ) : (
            <button
              key={c.ch}
              {...bindTap('bm.music.channelTab-open', { params: { channel: c.ch } })}
              className="flex-1 min-w-0 flex flex-col items-center justify-center pt-1.5 bg-transparent border-none cursor-pointer"
            >
              {inner}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto pb-6" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 热门单曲榜:3列封面网格,封面♡+/✓角标无序号,条目=标题/歌手/暂无评分(对齐真机 IMG_0378) */}
        {musicRank && topSongs.length > 0 && (
          <>
            <div className="flex items-baseline px-4 pt-3 pb-2">
              <span className="text-xl font-bold" style={{ color: C.text }}>热门单曲榜</span>
              <button
                {...bindTap('bm.music.ranklist-open', { params: { listId: musicRank.id } })}
                className="ml-auto text-xs bg-transparent border-none cursor-pointer"
                style={{ color: C.sub }}
              >
                全部{musicRank.items.length} ›
              </button>
            </div>
            <div className="px-4 grid grid-cols-3 gap-3">
              {topSongs.map((s, i) => (
                <button key={s.id} {...bindTap('bm.music.item-open', { params: { subjectId: s.id } })} className="text-left bg-transparent border-none cursor-pointer">
                  <div className="relative">
                    <Img src={s.cover} className="w-full rounded-md object-cover aspect-square" />
                    <CoverMark done={i === 0 || i === 4} />
                  </div>
                  <div className="mt-1.5 text-sm font-semibold line-clamp-2" style={{ color: C.text }}>{s.title}</div>
                  <div className="mt-0.5 text-xs truncate" style={{ color: C.sub }}>{s.artist ?? s.info ?? ''}</div>
                  <div className="mt-0.5"><RatingLine rating={s.rating} size={10} /></div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* 新碟榜:文字Tab(选中黑粗+短黑下划线)+ 右侧「全部N ›」随tab变(对齐真机 IMG_0378/0379) */}
        <div className="flex items-baseline px-4 pt-4 pb-1">
          <span className="text-xl font-bold" style={{ color: C.text }}>新碟榜</span>
          {musicRank && (
            <button
              {...bindTap('bm.music.discRank-open', { params: { listId: musicRank.id } })}
              className="ml-auto text-xs bg-transparent border-none cursor-pointer"
              style={{ color: C.sub }}
            >
              全部{discCount} ›
            </button>
          )}
        </div>
        <div className="flex gap-5 px-4 pb-2">
          {discTabs.map((d) => {
            const active = disc === d;
            return (
              <button
                key={d}
                {...bindTap({ kind: 'action', id: 'bm.music.discTab.select.target' }, { onTrigger: () => setDisc(d) })}
                className="flex flex-col items-center bg-transparent border-none cursor-pointer px-0"
              >
                <span className="text-[15px]" style={{ color: active ? C.text : C.sub, fontWeight: active ? 700 : 400 }}>{d}</span>
                <span className="mt-1 rounded-full" style={{ width: 26, height: 2.5, background: active ? C.text : 'transparent' }} />
              </button>
            );
          })}
        </div>
        <div className="px-4 grid grid-cols-3 gap-3">
          {discMusics.map((m) => (
            <button key={m.id} {...bindTap('bm.music.item-open', { params: { subjectId: m.id } })} className="text-left bg-transparent border-none cursor-pointer">
              <div className="relative">
                <Img src={m.cover} className="w-full rounded-md object-cover aspect-square" />
                <CoverMark />
              </div>
              <div className="mt-1.5 text-sm font-semibold line-clamp-2" style={{ color: C.text }}>{m.title}</div>
              <div className="mt-0.5 text-xs truncate" style={{ color: C.sub }}>{m.artist ?? m.info ?? ''}</div>
              <div className="mt-0.5"><RatingLine rating={m.rating} size={10} /></div>
            </button>
          ))}
        </div>

        {/* 分类浏览:大标题+「全部 ›」+ 子区「pop ›」+ 3列封面网格(对齐真机 IMG_0379) */}
        <div className="flex items-baseline px-4 pt-5 pb-1">
          <span className="text-xl font-bold" style={{ color: C.text }}>分类浏览</span>
          <button {...bindTap('bm.music.category-open')} className="ml-auto text-xs bg-transparent border-none cursor-pointer" style={{ color: C.sub }}>全部 ›</button>
        </div>
        <button {...bindTap('bm.music.category-open')} className="flex items-center gap-1 px-4 py-1 bg-transparent border-none cursor-pointer">
          <span className="text-base font-semibold" style={{ color: C.text }}>pop</span>
          <span className="text-sm" style={{ color: C.sub }}>›</span>
        </button>
        <div className="px-4 pt-1 grid grid-cols-3 gap-3">
          {musics.slice(0, 3).map((m) => (
            <button key={m.id} {...bindTap('bm.music.item-open', { params: { subjectId: m.id } })} className="text-left bg-transparent border-none cursor-pointer">
              <div className="relative">
                <Img src={m.cover} className="w-full rounded-md object-cover aspect-square" />
                <CoverMark />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
