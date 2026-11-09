import React from 'react';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, Img, TopBar, Chip, MarkBtn, SegRow, fmtCount } from '../components/ui';
import { Sheet } from '../components/Sheet';

// 即将播出(影视共用):热度/时间排序 + 重复「日期分组」(组头日期·平台 → 16:9 预告大卡 →
// 条目块 → 三行简介 → chips 行)+ 筛选浮层。两种排序都保持分组呈现。
export default function TvUpcomingPage() {
  const { bindTap } = useDoubanGestures();
  const subjects = useDoubanStore((s) => s.subjects);
  const discussions = useDoubanStore((s) => s.discussions);
  const marks = useDoubanStore((s) => s.marks);
  const addHistory = useDoubanStore((s) => s.addHistory);
  const toast = useDoubanStore((s) => s.toast);
  const [sort, setSort] = React.useState<'heat' | 'time'>('heat');
  const [showFilter, setShowFilter] = React.useState(false);
  const [fTime, setFTime] = React.useState('全部');
  const [fType, setFType] = React.useState('全部');

  const allItems = React.useMemo(() => subjects.filter((s) => s.type === 'tv' || s.type === 'movie'), [subjects]);
  // 播出时间桶(数据无真实档期→按 id 确定性派生本周/本月/下月,保证筛选真收敛)
  const hashOf = (id: string) => { let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff; return h; };
  const timeBucket = (id: string) => ['本周', '本月', '下月'][hashOf(id) % 3];
  const isVariety = (s: (typeof allItems)[number]) => (s.genres ?? []).some((g) => ['真人秀', '综艺', '脱口秀'].includes(g));
  const items = React.useMemo(() => {
    let arr = allItems;
    if (fType === '电影') arr = arr.filter((s) => s.type === 'movie');
    else if (fType === '剧集') arr = arr.filter((s) => s.type === 'tv' && !isVariety(s));
    else if (fType === '综艺') arr = arr.filter((s) => s.type === 'tv' && isVariety(s));
    if (fTime !== '全部') arr = arr.filter((s) => timeBucket(s.id) === fTime);
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allItems, fType, fTime]);

  // 平台 / 日期 / 出演(全部虚构、确定性:按索引派生,禁 Date.now/random)。
  const PLATFORMS = [
    { name: '腾讯视频', icon: '🐧' },
    { name: '爱奇艺', icon: '🟢' },
    { name: 'Netflix', icon: '🔴' },
    { name: '优酷', icon: '🅾️' },
    { name: '湖南卫视', icon: '🍊' },
  ];
  const CAST = ['沈知遥', '陆时衍', '林望舒', '苏清晏', '江晚照', '顾南川', '白露', '温故知'];
  const dateLabel = (idx: number) => `7月${10 + idx * 2}日`;

  // 排序后再分组:每组 2 条 → 组头(日期·平台)。两种排序都分组。
  const sorted = React.useMemo(() => {
    const arr = [...items];
    if (sort === 'heat') arr.sort((a, b) => b.ratingCount - a.ratingCount);
    else arr.sort((a, b) => parseInt(b.year ?? '0', 10) - parseInt(a.year ?? '0', 10));
    return arr;
  }, [items, sort]);

  const groups = React.useMemo(() => {
    const out: { key: string; date: string; platform: { name: string; icon: string }; rows: typeof sorted }[] = [];
    for (let i = 0; i < sorted.length; i += 2) {
      const gi = out.length;
      out.push({
        key: `g${gi}`,
        date: dateLabel(gi),
        platform: PLATFORMS[gi % PLATFORMS.length],
        rows: sorted.slice(i, i + 2),
      });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorted]);

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      <TopBar title="即将播出" />

      {/* 头部计数「影视 N」+ 热度|时间分段胶囊 + 漏斗 ▽(对齐真机 IMG_0365) */}
      <div className="flex items-center gap-3 px-4 py-2 bg-white shrink-0">
        <span className="text-sm">
          <span className="font-bold" style={{ color: C.text }}>影视</span>
          <span className="ml-1" style={{ color: C.sub }}>{items.length}</span>
        </span>
        <span className="flex-1" />
        <SegRow
          options={['热度', '时间']}
          value={sort === 'heat' ? '热度' : '时间'}
          bindFor={(v) => bindTap({ kind: 'action', id: 'tv.upcoming.sort.select.target' }, { onTrigger: () => setSort(v === '热度' ? 'heat' : 'time') })}
          size="sm"
        />
        <button {...bindTap({ kind: 'action', id: 'tv.upcoming.filter.open' }, { onTrigger: () => setShowFilter(true) })} className="text-base bg-transparent border-none cursor-pointer shrink-0" style={{ color: C.sub }} aria-label="筛选">▽</button>
      </div>

      <div className="flex-1 overflow-y-auto pb-6" data-scroll-container="main" data-scroll-direction="vertical">
        {groups.length === 0 && (
          <div className="py-20 text-center text-sm" style={{ color: C.sub }}>该筛选下暂无即将播出内容</div>
        )}
        {groups.map((g) => (
          <div key={g.key} className="mt-3">
            {/* 组头:日期 · 平台 */}
            <div className="px-4 flex items-center gap-2">
              <span className="text-sm font-bold" style={{ color: C.text }}>{g.date}</span>
              <span className="text-xs" style={{ color: C.sub }}>· {g.platform.icon} {g.platform.name}</span>
            </div>

            {/* 16:9 预告大卡 */}
            <div className="px-4 pt-2">
              <button {...bindTap({ kind: 'action', id: 'tv.upcoming.trailer.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })} className="w-full rounded-lg overflow-hidden text-left border-none cursor-pointer relative" style={{ aspectRatio: '16 / 9' }}>
                <Img src={g.rows[0]?.cover ?? ''} className="w-full h-full object-cover" />
                <span className="absolute inset-0 flex items-center justify-center text-4xl text-white/90">▶</span>
                <span className="absolute bottom-2 right-2 text-[10px] text-white px-1 rounded" style={{ background: 'rgba(0,0,0,0.6)' }}>预告 01:32</span>
                {/* 底部轮播圆点(对齐真机 IMG_0365) */}
                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                  {[0, 1, 2].map((di) => (
                    <span key={di} className="rounded-full" style={{ width: di === 0 ? 12 : 5, height: 5, background: di === 0 ? '#fff' : 'rgba(255,255,255,0.55)' }} />
                  ))}
                </span>
              </button>
            </div>

            {/* 条目块 */}
            <div className="px-4 pt-2 space-y-3">
              {g.rows.map((s, ri) => {
                const cast = CAST[(groups.indexOf(g) * 2 + ri) % CAST.length];
                const wish = s.wishCount ?? Math.round(s.ratingCount * 0.6);
                const discuss = 60 + (s.ratingCount % 400);
                const disc = discussions.find((d) => d.subjectId === s.id);
                return (
                  <div key={s.id} className="bg-white rounded-lg p-3">
                    <div className="flex gap-3">
                      <button {...bindTap('tv.upcoming.item-open', { params: { itemId: s.id } })} className="flex gap-3 flex-1 min-w-0 text-left bg-transparent border-none cursor-pointer">
                        <Img src={s.cover} className="shrink-0 rounded object-cover" style={{ width: 60, height: 84 }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate" style={{ color: C.text }}>{s.title}</div>
                          {/* 「尚未播出」独立一行,info 可折行(对齐真机 IMG_0365) */}
                          <div className="mt-0.5 text-[11px]" style={{ color: C.sub }}>尚未播出</div>
                          <div className="mt-0.5 text-[11px] line-clamp-2" style={{ color: C.sub }}>{s.info}</div>
                          {/* 三行简介 */}
                          <div className="mt-1 text-[11px]" style={{ color: '#B9BEC6', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {s.intro ?? '剧情简介暂未公开,敬请期待正片上线。该剧改编自同名小说,讲述一段横跨十年的重逢与救赎，在时代洪流中彼此照亮。'}
                          </div>
                        </div>
                      </button>
                      <div className="shrink-0">
                        <MarkBtn label="想看" size="sm" marked={marks.some((m) => m.subjectId === s.id)} markedLabel="已想看" bind={bindTap('tv.upcoming.mark-open', { beforeTrigger: () => addHistory('subject', s.id) })} />
                      </div>
                    </div>
                    {/* chips 行 */}
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: '#FFF4E5', color: C.orange }}>{fmtCount(wish)}人想看</span>
                      <button {...(disc
                        ? bindTap('tv.upcoming.discussion-open', { params: { discussionId: disc.id } })
                        : bindTap({ kind: 'action', id: 'tv.upcoming.discussion.empty' }, { onTrigger: () => toast('暂无讨论') })
                      )} className="text-[11px] px-2 py-0.5 rounded-full cursor-pointer border-none" style={{ background: C.greenSoft, color: C.green }}>{discuss}人在讨论</button>
                      <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: C.bg, color: C.sub }}>{cast} 出演</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 筛选浮层 */}
      {showFilter && (
        <Sheet title="筛选">
          <div className="px-4 pb-2">
            <div className="text-xs mb-2 font-semibold" style={{ color: C.text }}>播出时间</div>
            <div className="flex gap-2 flex-wrap">
              {['全部', '本周', '本月', '下月'].map((t) => (
                <Chip key={t} label={t} active={fTime === t} bind={bindTap({ kind: 'action', id: 'tv.upcoming.filter.apply' }, { onTrigger: () => setFTime(t) })} />
              ))}
            </div>
            <div className="text-xs mt-4 mb-2 font-semibold" style={{ color: C.text }}>类型</div>
            <div className="flex gap-2 flex-wrap">
              {['全部', '电影', '剧集', '综艺'].map((t) => (
                <Chip key={t} label={t} active={fType === t} bind={bindTap({ kind: 'action', id: 'tv.upcoming.filter.apply' }, { onTrigger: () => setFType(t) })} />
              ))}
            </div>
          </div>
          <div className="flex gap-3 px-4 pt-3">
            <button {...bindTap({ kind: 'action', id: 'tv.upcoming.filter.apply' }, { onTrigger: () => setShowFilter(false) })} className="flex-1 h-10 rounded-full text-sm cursor-pointer" style={{ background: 'transparent', color: C.sub, border: `1px solid ${C.border}` }}>取消</button>
            <button {...bindTap({ kind: 'action', id: 'tv.upcoming.filter.apply' }, { onTrigger: () => setShowFilter(false) })} className="flex-1 h-10 rounded-full text-sm text-white cursor-pointer border-none" style={{ background: C.green }}>确定</button>
          </div>
        </Sheet>
      )}
    </div>
  );
}
