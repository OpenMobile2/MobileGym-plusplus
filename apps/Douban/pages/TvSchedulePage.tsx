import React from 'react';
import * as TimeService from '@/os/TimeService';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, Img, RatingLine, TopBar, EmptyState, MarkBtn } from '../components/ui';

/** 标题前红圈播放图标(可播放的剧集/综艺条目) */
function PlayBadge() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" className="shrink-0">
      <circle cx="7" cy="7" r="7" fill={C.danger} />
      <path d="M5.6 4.6v4.8l4-2.4z" fill="#fff" />
    </svg>
  );
}

// 播出时间表:周几tab + 类型下拉 + 剧集行。
export default function TvSchedulePage() {
  const { bindTap } = useDoubanGestures();
  const subjects = useDoubanStore((s) => s.subjects);
  const marks = useDoubanStore((s) => s.marks);
  const addHistory = useDoubanStore((s) => s.addHistory);
  const [day, setDay] = React.useState('all');
  const [showType, setShowType] = React.useState(false);
  const [type, setType] = React.useState('全部类型');
  const [showSort, setShowSort] = React.useState(false);
  const [sort, setSort] = React.useState('热度');

  const tvs = React.useMemo(() => subjects.filter((s) => s.type === 'tv' || s.type === 'movie'), [subjects]);

  // 当日周几由 TimeService 取(禁 new Date);0=周日…6=周六。
  const todayIdx = TimeService.getDate().getDay();
  const WEEK_IDS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const WEEK_CN: Record<string, string> = { sun: '周日', mon: '周一', tue: '周二', wed: '周三', thu: '周四', fri: '周五', sat: '周六' };
  const todayId = WEEK_IDS[todayIdx];
  const days = [
    { id: 'all', label: '全部' },
    ...['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((id) => ({
      id,
      label: id === todayId ? `今日${WEEK_CN[id]}` : WEEK_CN[id],
    })),
  ];
  // 简单按 day 派生条数(模拟每日更新数量)
  const dayCounts: Record<string, number> = { all: tvs.length, mon: 3, tue: 1, wed: 5, thu: 4, fri: 2, sat: 3, sun: 2 };
  const regionOf = (info?: string) => (info ?? '').split('/')[0].trim();
  const inAny = (info: string | undefined, ks: string[]) => ks.some((k) => regionOf(info).includes(k));
  const shown = React.useMemo(() => {
    // 类型:国产剧/欧美剧/日韩剧 按 info 地区;综艺按 genres
    let typed = tvs;
    if (type === '国产剧') typed = tvs.filter((s) => inAny(s.info, ['中国', '华语', '香港', '台湾']));
    else if (type === '欧美剧') typed = tvs.filter((s) => inAny(s.info, ['美国', '英国', '法国', '德国', '意大利', '加拿大']));
    else if (type === '日韩剧') typed = tvs.filter((s) => inAny(s.info, ['日本', '韩国']));
    else if (type === '综艺') typed = tvs.filter((s) => (s.genres ?? []).some((g) => ['真人秀', '综艺', '脱口秀'].includes(g)));
    const base = day === 'all' ? typed : typed.slice(0, dayCounts[day] ?? 0);
    const list = [...base];
    if (sort === '热度') list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    else if (sort === '更新') list.sort((a, b) => (b.episodes ?? 0) - (a.episodes ?? 0));
    else if (sort === '时间') list.sort((a, b) => a.title.localeCompare(b.title, 'zh-Hans-CN'));
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, tvs, sort, type]);
  const types = ['全部类型', '国产剧', '欧美剧', '日韩剧', '综艺'];
  const sorts = ['热度', '时间', '更新'];

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      <TopBar title="播出时间表" />

      {/* 周几tab:文字Tab + 选中短黑下划线(对齐真机 IMG_0363) */}
      <div className="flex gap-5 px-4 py-2 bg-white overflow-x-auto shrink-0" data-scroll-container="weekday-tabs" data-scroll-direction="horizontal">
        {days.map((d) => {
          const active = day === d.id;
          return (
            <button key={d.id} {...bindTap({ kind: 'action', id: 'tv.schedule.weekday.select.target' }, { onTrigger: () => setDay(d.id) })} className="flex flex-col items-center shrink-0 bg-transparent border-none cursor-pointer px-0">
              <span className="text-sm" style={{ color: active ? C.text : C.sub, fontWeight: active ? 700 : 400 }}>{d.label}</span>
              <span className="mt-1 rounded-full" style={{ width: 22, height: 2.5, background: active ? C.text : 'transparent' }} />
            </button>
          );
        })}
      </div>

      {/* 计数行 + 类型下拉(选类型 ˅)+ 排序下拉(仅「全部」tab) */}
      <div className="flex items-center justify-between px-4 py-2 bg-white shrink-0">
        <span className="text-xs" style={{ color: C.sub }}>{day === 'all' ? '本周更新' : ''} {shown.length} 部</span>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button {...bindTap({ kind: 'action', id: 'tv.schedule.type.select.target' }, { onTrigger: () => { setShowType((v) => !v); setShowSort(false); } })} className="text-xs px-2.5 py-1 rounded-full bg-transparent cursor-pointer" style={{ color: type === '全部类型' ? C.sub : C.text, border: `1px solid ${C.border}`, background: '#F7F8F9' }}>{type === '全部类型' ? '选类型' : type} ˅</button>
            {showType && (
              <div className="absolute right-0 top-8 z-20 bg-white rounded-lg py-1 shadow" style={{ border: `1px solid ${C.border}` }}>
                {types.map((t) => (
                  <button key={t} {...bindTap({ kind: 'action', id: 'tv.schedule.type.select.target' }, { onTrigger: () => { setType(t); setShowType(false); } })} className="block w-28 text-left px-3 py-1.5 text-xs bg-transparent border-none cursor-pointer" style={{ color: type === t ? C.green : C.text }}>{t}</button>
                ))}
              </div>
            )}
          </div>
          {day === 'all' && (
            <div className="relative">
              <button {...bindTap({ kind: 'action', id: 'tv.schedule.sort.select.target' }, { onTrigger: () => { setShowSort((v) => !v); setShowType(false); } })} className="text-xs px-2.5 py-1 rounded-full bg-transparent cursor-pointer" style={{ color: C.text, border: `1px solid ${C.border}`, background: '#F7F8F9' }}>排序 ˅</button>
              {showSort && (
                <div className="absolute right-0 top-8 z-20 bg-white rounded-lg py-1 shadow" style={{ border: `1px solid ${C.border}` }}>
                  {sorts.map((o) => (
                    <button key={o} {...bindTap({ kind: 'action', id: 'tv.schedule.sort.select.target' }, { onTrigger: () => { setSort(o); setShowSort(false); } })} className="block w-28 text-left px-3 py-1.5 text-xs bg-transparent border-none cursor-pointer" style={{ color: sort === o ? C.green : C.text }}>{o}</button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-6" data-scroll-container="main" data-scroll-direction="vertical">
        {shown.length === 0 ? (
          <EmptyState text="当日暂无更新" />
        ) : (
          // 白底通栏列表(细分割线),非灰底圆角卡(对齐真机 IMG_0363)
          <div className="bg-white">
            {shown.map((s, idx) => {
              // 每条更新文案各异(确定性,按索引派生);非可播放条目(idx%3===2)不显示红播放图标。
              const upDay = WEEK_CN[WEEK_IDS[(idx + 1) % 7]];
              const playable = idx % 3 !== 2;
              return (
                <div key={s.id} className="flex gap-3 items-start px-4 py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
                  <Img src={s.cover} className="shrink-0 rounded object-cover" style={{ width: 100, height: 140 }} />
                  <button {...bindTap('tv.schedule.item-open', { params: { itemId: s.id } })} className="flex-1 min-w-0 text-left bg-transparent border-none cursor-pointer self-stretch">
                    <div className="flex items-center gap-1">
                      {playable && <PlayBadge />}
                      <span className="text-[15px] font-semibold truncate" style={{ color: C.text }}>{s.title}</span>
                    </div>
                    <div className="mt-1"><RatingLine rating={s.rating} size={11} /></div>
                    <div className="mt-1 text-[11px] leading-4 line-clamp-2" style={{ color: C.sub }}>{s.info}</div>
                    <div className="mt-1.5 flex gap-2 flex-wrap">
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: '#F2F3F5', color: C.sub }}>每{upDay}更新</span>
                      {s.episodes != null && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: '#F2F3F5', color: C.text }}>更新至{s.episodes}集</span>}
                    </div>
                  </button>
                  <MarkBtn label="想看" size="sm" marked={marks.some((m) => m.subjectId === s.id)} markedLabel="已想看" bind={bindTap('tv.schedule.mark-open', { beforeTrigger: () => addHistory('subject', s.id) })} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
