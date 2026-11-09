import React from 'react';
import { useParams } from 'react-router-dom';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { usePullRefresh, rotate } from '../hooks/usePullRefresh';
import { useDoubanStore } from '../state';
import { C, Img, RatingLine, TopBar, Chip, EmptyState, MarkBtn } from '../components/ui';
import { Sheet } from '../components/Sheet';
import type { DoubanSubject } from '../types';
import { payWithSystem } from '../capabilities';

// 榜单详情(通用:图书/音乐/影视/单集榜),param=listId。
// 由 subjectId 派生的稳定「其他版本」数量(真机 116/256 式真实数字,确定性派生非随机)。
function editionCount(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  return 6 + (h % 250);
}

export default function RanklistDetailPage() {
  const { bindTap } = useDoubanGestures();
  const { listId } = useParams();
  const subjects = useDoubanStore((s) => s.subjects);
  const addHistory = useDoubanStore((s) => s.addHistory);
  const rankings = useDoubanStore((s) => s.rankings);
  const marks = useDoubanStore((s) => s.marks);
  const toast = useDoubanStore((s) => s.toast);
  const ranklistFilter = useDoubanStore((s) => s.ranklistFilter);
  const followedRankingIds = useDoubanStore((s) => s.followedRankingIds);
  const toggleFollowRanking = useDoubanStore((s) => s.toggleFollowRanking);

  const [group, setGroup] = React.useState('华语');
  const [groupDirty, setGroupDirty] = React.useState(false);
  const [showFilter, setShowFilter] = React.useState(false);
  const [cat, setCat] = React.useState(ranklistFilter && !/^\d{4}$/.test(ranklistFilter) ? ranklistFilter.split(',')[0] : '全部');

  const byId = React.useMemo(() => {
    const m: Record<string, DoubanSubject> = {};
    subjects.forEach((s) => (m[s.id] = s));
    return m;
  }, [subjects]);
  const ranking = React.useMemo(
    () => rankings.find((r) => r.id === listId) ?? rankings[0],
    [rankings, listId],
  );
  const { refreshMsg, seed, listRef, pullHandlers } = usePullRefresh('榜单已更新');
  const followed = ranking ? followedRankingIds.includes(ranking.id) : false;
  const isMusic = ranking?.kind === 'music';
  const rows = React.useMemo(() => {
    const matchKeys = (sub: DoubanSubject, keys: string[]) => {
      const hay = `${sub.title} ${(sub.genres ?? []).join(' ')} ${sub.info ?? ''} ${sub.year ?? ''}`;
      return keys.some((k) => hay.includes(k));
    };
    let list = (ranking?.items ?? []).map((it) => ({ note: it.note, sub: byId[it.subjectId] })).filter((x) => x.sub);
    const extraKeys = [
      ...(ranklistFilter ? ranklistFilter.split(',').filter(Boolean) : []),
      ...(cat !== '全部' ? [cat] : []),
    ];
    if (extraKeys.length > 0) {
      const filtered = list.filter((x) => matchKeys(x.sub!, extraKeys));
      if (filtered.length > 0) list = filtered;
    }
    if (groupDirty && (isMusic || ranking?.kind === 'tv')) {
      const groupKeys: Record<string, string[]> = {
        华语: ['华语', '中国', '香港', '台湾', '大陆'],
        欧美: ['欧美', '美国', '英国', '法国', '德国', '欧洲', '英剧', '美剧'],
        日韩: ['日韩', '日本', '韩国', '日语', '韩语', 'K-Pop', 'J-Pop', '日剧', '韩剧'],
      };
      const filtered = list.filter((x) => matchKeys(x.sub!, groupKeys[group] ?? [group]));
      if (filtered.length > 0) list = filtered;
    }
    return rotate(list, seed);
  }, [ranking, byId, seed, ranklistFilter, cat, group, groupDirty, isMusic]);
  const markLabel =
    ranking?.kind === 'book' ? '想读' : ranking?.kind === 'music' ? '想听' : '想看';
  const markedCount = rows.filter(({ sub }) => marks.some((m) => m.subjectId === sub!.id)).length;

  return (
    <div className="flex flex-col h-full relative" style={{ background: C.bg }} data-status-bar-foreground="dark">
      <TopBar title={ranking?.title ?? '榜单'} />
      {refreshMsg && (
        <div className="absolute left-0 right-0 top-14 z-20 flex justify-center pointer-events-none">
          <span className="px-4 py-1.5 rounded-full text-xs text-white shadow" style={{ background: C.green }}>{refreshMsg}</span>
        </div>
      )}
      <div ref={listRef} {...pullHandlers} className="flex-1 overflow-y-auto pb-6" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 榜单头(音乐榜仅保留标题栏,无关注头卡;book/tv 深色封面 hero + 关注) */}
        {!isMusic && (
        <div className="px-4 pt-4 pb-4 flex items-center gap-3" style={{ background: '#2E2A28' }}>
          <div className="w-16 h-20 rounded-md flex items-center justify-center text-3xl shrink-0" style={{ background: 'rgba(255,255,255,0.1)' }}>🏆</div>
          <div className="flex-1 min-w-0">
            <div className="text-base font-bold truncate" style={{ color: '#fff' }}>{ranking?.title}</div>
            <div className="text-xs mt-1" style={{ color: '#C9C2BC' }}>{ranking?.subtitle}</div>
            <div className="text-[11px] mt-0.5" style={{ color: '#9A938D' }}>1.5万人关注</div>
          </div>
          <button
            {...bindTap({ kind: 'action', id: 'ranklist.detail.follow.toggle' }, { onTrigger: () => { if (ranking) { toggleFollowRanking(ranking.id); toast(followed ? '已取消关注' : '关注成功'); } } })}
            className="px-4 h-8 rounded-full text-sm cursor-pointer shrink-0"
            style={followed ? { background: 'rgba(255,255,255,0.12)', color: '#C9C2BC', border: '1px solid rgba(255,255,255,0.3)' } : { background: '#fff', color: '#2E2A28', border: 'none' }}
          >
            {followed ? '已关注' : '+ 关注'}
          </button>
        </div>
        )}

        {isMusic ? (
          /* 音乐榜:顶栏下独占一行的左对齐下划线 tab(无进度/⚙) */
          <div className="flex px-4 bg-white border-b" style={{ borderColor: C.border }}>
            {['华语', '欧美', '日韩'].map((g) => {
              const active = group === g;
              return (
                <button
                  key={g}
                  {...bindTap({ kind: 'action', id: 'ranklist.detail.groupTab.select.target' }, { onTrigger: () => { setGroup(g); setGroupDirty(true); } })}
                  className="mr-6 py-2.5 bg-transparent border-none cursor-pointer relative text-sm"
                  style={{ color: active ? C.text : C.sub, fontWeight: active ? 700 : 400 }}
                >
                  {g}
                  {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-full" style={{ background: C.text }} />}
                </button>
              );
            })}
          </div>
        ) : (
          /* book/tv:进度行 + 分类/月份 chips + 漏斗 */
          <div className="flex items-center gap-2 px-4 py-2 bg-white overflow-x-auto" data-scroll-container="filter-chips" data-scroll-direction="horizontal">
            <span className="text-xs shrink-0" style={{ color: C.sub }}>已{markLabel.replace('想', '')}过 {markedCount}/{rows.length}</span>
            <span className="flex-1" />
            {ranking?.kind === 'tv' ? (
              ['华语', '欧美', '日韩'].map((g) => (
                <Chip key={g} label={g} size="sm" active={group === g} bind={bindTap({ kind: 'action', id: 'ranklist.detail.groupTab.select.target' }, { onTrigger: () => { setGroup(g); setGroupDirty(true); } })} />
              ))
            ) : (
              <button {...bindTap({ kind: 'action', id: 'ranklist.detail.period.select.target' }, { onTrigger: () => setCat(cat === '全部' ? '小说' : '全部') })} className="text-xs shrink-0 bg-transparent border-none cursor-pointer" style={{ color: C.sub }}>{cat} ▾</button>
            )}
            <button {...bindTap({ kind: 'action', id: 'ranklist.detail.filter.open' }, { onTrigger: () => setShowFilter(true) })} className="text-sm shrink-0 bg-transparent border-none cursor-pointer" style={{ color: C.sub }}>⚙</button>
          </div>
        )}

        {/* 排行行 */}
        {rows.length === 0 ? (
          <EmptyState text="暂无榜单数据" />
        ) : (
          <div className="px-4 pt-2 space-y-2">
            {rows.map(({ note, sub }, i) => {
              const marked = marks.some((m) => m.subjectId === sub!.id);
              return (
              <div key={sub!.id} className="flex gap-3 items-start bg-white rounded-lg p-3">
                <div className="w-6 text-center shrink-0">
                  <div className="text-lg font-bold" style={{ color: i < 3 ? C.danger : C.gold }}>{i + 1}</div>
                  {note && <div className="text-[9px]" style={{ color: note.includes('新') ? C.green : C.sub }}>{note}</div>}
                </div>
                {/* 外层为 div 避免 button 嵌套 button(DOM 违规);内层操作按钮 onClickCapture 阻止冒泡到行打开 */}
                <div {...bindTap('ranklist.detail.item-open', { params: { subjectId: sub!.id, itemId: sub!.id, kind: sub!.type } })} role="button" className="flex gap-3 flex-1 min-w-0 text-left cursor-pointer">
                  <Img src={sub!.cover} className="shrink-0 rounded object-cover" style={isMusic ? { width: 72, height: 72 } : { width: 52, height: 74 }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: C.text }}>{sub!.title}</div>
                    <div className="mt-1"><RatingLine rating={sub!.rating} size={10} /></div>
                    <div className="mt-1 text-[11px] truncate" style={{ color: C.sub }}>{sub!.info}</div>
                    {/* 音乐榜行内无版本/价签 chip(锁定决策) */}
                    {!isMusic && (
                      <div className="mt-1 flex items-center gap-2">
                        {sub!.buyPrice != null && (
                          <button {...bindTap({ kind: 'action', id: 'ranklist.detail.buy.wontfix' }, { onTrigger: () => {
                            const launched = payWithSystem(
                              { amount: sub!.buyPrice!, orderId: `subject-${sub!.id}`, subject: sub!.title },
                              (result) => { if (result.resultCode === 'OK') toast('支付成功'); },
                            );
                            if (!launched) toast('无法打开系统支付');
                          } })} onClickCapture={(e) => e.stopPropagation()} className="text-[10px] px-1.5 py-0.5 rounded border cursor-pointer" style={{ borderColor: C.gold, color: C.gold, background: 'transparent' }}>¥{sub!.buyPrice.toFixed(1)}</button>
                        )}
                        <button {...bindTap('ranklist.detail.edition-open', { params: { subjectId: sub!.id, itemId: sub!.id, kind: sub!.type } })} onClickCapture={(e) => e.stopPropagation()} className="text-[10px] px-1.5 py-0.5 rounded cursor-pointer border-none" style={{ background: '#F2F3F5', color: C.sub }}>还有其他{editionCount(sub!.id)}个版本 ›</button>
                      </div>
                    )}
                  </div>
                </div>
                <MarkBtn label={markLabel} marked={marked} markedLabel={`已${markLabel}`} bind={bindTap('ranklist.detail.mark-open', { beforeTrigger: () => addHistory('subject', sub!.id) })} />
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 筛选面板(轻实现:仅分类) */}
      {showFilter && (
        <Sheet title="筛选">
          <div className="px-4 pb-2">
            <div className="text-xs mb-2" style={{ color: C.sub }}>分类</div>
            <div className="flex gap-2 flex-wrap">
              {['全部', '小说', '历史', '传记', '科普'].map((ct) => (
                <Chip key={ct} label={ct} active={cat === ct} bind={bindTap({ kind: 'action', id: 'ranklist.detail.period.select.target' }, { onTrigger: () => { setCat(ct); setShowFilter(false); } })} />
              ))}
            </div>
          </div>
        </Sheet>
      )}
    </div>
  );
}
