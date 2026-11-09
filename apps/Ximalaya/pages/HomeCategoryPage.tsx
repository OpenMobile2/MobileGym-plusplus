import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useXimalayaGestures } from '../hooks/useXimalayaGestures';
import { useXimalayaStore } from '../state';
import { Img, VipTag, formatCount, wontfix } from '../components/ui';
import { IcNavBack, IcShare, IcHeadphones, IcChevronDown } from '../res/icons';

const SUB_TABS = ['全部', '推荐'] as const;
const SORTS = ['综合排序', '播放最多', '最近更新'] as const;
// 体裁落地页的筛选 chips(点击本地筛选/示意,非死区)
const FILTER_ROWS: { label: string; chips: string[] }[] = [
  { label: '全部分类', chips: ['有声书', '广播剧', '娱乐', '有声图书'] },
  { label: '小说分类', chips: ['男频', '女频'] },
  { label: '播讲形式', chips: ['多人', '双人', '单人'] },
  { label: '是否付费', chips: ['付费', '免费'] },
  { label: '是否完本', chips: ['完结', '连载中'] },
];

export function HomeCategoryPage() {
  const { bindTap, bindBack } = useXimalayaGestures();
  const [sp] = useSearchParams();
  const cat = sp.get('cat') || '小说';
  const albums = useXimalayaStore((st) => st.albums);

  const [tab, setTab] = useState<'全部' | '推荐'>('全部');
  const [sort, setSort] = useState('综合排序');
  const [expand, setExpand] = useState(false);
  const [genre, setGenre] = useState<string>('');

  // 该体裁的专辑;不足时用其它专辑作「为你推荐」补充
  const inCat = albums.filter((a) => a.category === cat);
  const others = albums.filter((a) => a.category !== cat);
  const sortFn = (a: typeof albums) =>
    [...a].sort((x, y) =>
      sort === '播放最多' ? y.playCount - x.playCount
      : sort === '最近更新' ? (y.trackIds.length - x.trackIds.length)
      : (y.recommendPct ?? 0) - (x.recommendPct ?? 0),
    );
  const primary = sortFn(inCat.length ? inCat : albums);
  const updateWan = (12 + (cat.length * 7) % 30) / 10; // 合成「N万更新」

  const AlbumRow = ({ a }: { a: typeof albums[number] }) => (
    <div {...bindTap('catsub.album-open', { params: { id: a.id } })} className="flex gap-3 px-4 py-3">
      <Img src={a.cover} className="w-[72px] h-[72px] rounded-lg object-cover shrink-0" />
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="text-[15px] text-[#333] font-medium leading-snug line-clamp-2">{a.title}</div>
        <div className="text-[12px] text-[#999] truncate mt-0.5">{a.intro}</div>
        <div className="mt-auto flex items-center gap-1.5 flex-wrap text-[11px]">
          {a.isVip && <VipTag />}
          {(a.recommendPct ?? 0) >= 95 && <span className="text-[#FE4543]">神作必听</span>}
          <span className="text-[#999]">{a.category}</span>
          {a.finished && <span className="text-[#999]">· 完结</span>}
          <span className="text-[#999] flex items-center gap-0.5"><IcHeadphones size={11} />{formatCount(a.playCount)}</span>
        </div>
        <div className="text-[11px] text-[#BBB] mt-0.5 truncate">{a.anchorName}</div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col pt-10 bg-[#F5F5F5]" data-status-bar-foreground="light">
      {/* 红色渐变头 */}
      <div className="shrink-0 bg-gradient-to-b from-[#C0392B] to-[#F5F5F5] px-4 pb-1">
        <div className="h-9 flex items-center justify-between text-white">
          <button {...bindBack()} aria-label="返回"><IcNavBack size={26} /></button>
          <button onClick={wontfix} aria-label="分享"><IcShare size={20} /></button>
        </div>
        <div className="text-[24px] font-bold text-white leading-tight">{cat}</div>
        <div className="text-[12px] text-white/80 mb-1">{updateWan.toFixed(1)}万更新</div>
      </div>

      {/* 白卡:全部/推荐 Tab + 排序 + 筛选 */}
      <div className="shrink-0 bg-white rounded-t-2xl -mt-1 pt-2">
        <div className="flex items-center justify-center gap-16 h-10 text-[16px]">
          {SUB_TABS.map((t) => (
            <button
              key={t}
              {...bindTap({ kind: 'action', id: 'catsub.tab.select.opt' }, { params: { tab: t }, onTrigger: () => setTab(t) })}
              className={'relative pb-1 ' + (tab === t ? 'text-[#333] font-semibold' : 'text-[#999]')}
            >
              {t}
              {tab === t && <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-5 h-[3px] rounded-full bg-[#FE4543]" />}
            </button>
          ))}
        </div>
        {tab === '全部' && (
          <div className="px-4 py-2 border-t border-[#F5F5F5]">
            <div className="flex items-center gap-5 text-[13px]">
              {SORTS.map((so) => (
                <button
                  key={so}
                  {...bindTap({ kind: 'action', id: 'catsub.sort.select.opt' }, { params: { sort: so }, onTrigger: () => setSort(so) })}
                  className={sort === so ? 'text-[#FE4543]' : 'text-[#666]'}
                >{so}</button>
              ))}
              <button onClick={() => setExpand((v) => !v)} className="ml-auto flex items-center gap-0.5 text-[#666]">
                {expand ? '收起' : '筛选'}<IcChevronDown size={14} className={expand ? 'rotate-180' : ''} />
              </button>
            </div>
            {expand && (
              <div className="mt-2 flex flex-col gap-2">
                {FILTER_ROWS.map((row) => (
                  <div key={row.label} className="flex items-start gap-2">
                    <span className="text-[12px] text-[#BBB] w-16 shrink-0 pt-1">{row.label}</span>
                    <div className="flex flex-wrap gap-2">
                      {row.chips.map((c) => (
                        <button
                          key={c}
                          {...bindTap({ kind: 'action', id: 'catsub.genre.select.opt' }, { params: { genre: c }, onTrigger: () => setGenre((g) => (g === c ? '' : c)) })}
                          className={'px-2.5 h-6 rounded text-[12px] ' + (genre === c ? 'bg-[#FDECEA] text-[#FE4543]' : 'bg-[#F5F5F5] text-[#666]')}
                        >{c}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 列表 */}
      <div className="flex-1 overflow-y-auto bg-white" data-scroll-container data-scroll-direction="vertical">
        {tab === '推荐' && (
          <div className="px-4 pt-3">
            <div className="text-[15px] font-semibold text-[#333] mb-2">最热经典</div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {primary.slice(0, 6).map((a) => (
                <div key={a.id} {...bindTap('catsub.album-open', { params: { id: a.id } })} className="flex flex-col">
                  <Img src={a.cover} className="w-full aspect-square rounded-lg object-cover" />
                  <div className="text-[12px] text-[#333] line-clamp-2 mt-1 leading-tight">{a.title}</div>
                </div>
              ))}
            </div>
            <div className="text-[15px] font-semibold text-[#333] mb-1">为你推荐</div>
          </div>
        )}
        {primary.map((a) => <AlbumRow key={a.id} a={a} />)}
        {inCat.length > 0 && others.length > 0 && (
          <>
            <div className="px-4 py-2 text-[13px] text-[#999] bg-[#FAFAFA]">为你推荐</div>
            {sortFn(others).map((a) => <AlbumRow key={`o_${a.id}`} a={a} />)}
          </>
        )}
      </div>
    </div>
  );
}
