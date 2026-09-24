import React, { useMemo, useState } from 'react';
import { useFlomoStore } from '../state';
import { useFlomoGestures } from '../hooks/useFlomoGestures';
import type { TransitionId } from '../navigation.declaration';
import { dayKey } from '../utils/format';
import { C } from '../components/ui';
import {
  IcInbox, IcFilterImage, IcFilterLink, IcFilterAudio, IcFilterTag, IcMic,
  IcReview, IcAi, IcDice, IcMindMap, IcTrash, IcHelp, IcSort, IcSettings, IcTag, IcBell,
} from '../res/icons';

function Item({ icon, label, count, bind, longBind }: { icon: React.ReactNode; label: string; count?: number; bind: object; longBind?: object }) {
  return (
    <button
      {...bind}
      {...(longBind || {})}
      className="w-full flex items-center gap-3 h-10 px-4 bg-transparent border-none cursor-pointer text-left rounded-lg"
      style={{ color: C.text, fontSize: 14 }}
    >
      <span className="w-5 flex justify-center" style={{ color: C.sub }}>{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {count != null && <span style={{ color: C.sub, fontSize: 12 }}>{count}</span>}
    </button>
  );
}

export default function TagDrawerPage() {
  const { bindTap, bindLongPress } = useFlomoGestures();
  const user = useFlomoStore((s) => s.user);
  const tags = useFlomoStore((s) => s.tags);
  const memos = useFlomoStore((s) => s.memos);
  const setCurrentTag = useFlomoStore((s) => s.setCurrentTag);
  const setCurrentFilter = useFlomoStore((s) => s.setCurrentFilter);
  const setCurrentDate = useFlomoStore((s) => s.setCurrentDate);
  const toast = useFlomoStore((s) => s.toast);
  const liveCount = memos.filter((m) => !m.deleted).length;
  const [shaking, setShaking] = useState(false);
  const shake = () => {
    setShaking(true);
    window.setTimeout(() => setShaking(false), 450);
  };

  // 真实日期热力图:91 天,锚定最近一条笔记的日期
  const cells = useMemo(() => {
    const live = memos.filter((m) => !m.deleted);
    const countByDay = new Map<string, number>();
    let refTs = 0;
    for (const m of live) {
      const k = dayKey(m.createdAt);
      countByDay.set(k, (countByDay.get(k) ?? 0) + 1);
      if (m.createdAt > refTs) refTs = m.createdAt;
    }
    if (refTs === 0) refTs = 1782000000000;
    const N = 91;
    return Array.from({ length: N }, (_, i) => {
      const ts = refTs - (N - 1 - i) * 86400000;
      const k = dayKey(ts);
      return { date: k, count: countByDay.get(k) ?? 0 };
    });
  }, [memos]);

  const filterBind = (tid: TransitionId, f: 'images' | 'links' | 'audio' | 'untagged' | 'wechat') =>
    bindTap(tid, { beforeTrigger: () => setCurrentFilter(f) });

  const topTags = tags.filter((t) => !t.parentId);

  return (
    <div className="absolute inset-0 flex" data-status-bar-foreground="dark">
      <div className="w-[82%] h-full overflow-y-auto flex flex-col" style={{ background: C.surface }}>
        {/* 顶部资料区 */}
        <div className="px-4 pt-6 pb-3">
          <div className="flex items-center gap-3">
            <button {...bindTap('tag.drawer.avatarClose')} className="border-none bg-transparent cursor-pointer p-0">
              <img src={user.avatar} alt="" className="w-12 h-12 rounded-2xl object-cover" />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold" style={{ color: C.text }}>{user.name}</span>
                {user.pro && (
                  <button {...bindTap('tag.drawer.proOpen')} className="px-1.5 rounded text-white text-[10px] border-none cursor-pointer" style={{ background: C.green }}>PRO</button>
                )}
              </div>
            </div>
            <button {...bindTap('notifications.open')} className="w-9 h-9 rounded-full flex items-center justify-center bg-transparent border-none cursor-pointer" style={{ color: C.text }} aria-label="通知">
              <IcBell size={18} />
            </button>
            <button {...bindTap('settings.main.open')} className="w-9 h-9 rounded-full flex items-center justify-center bg-transparent border-none cursor-pointer" style={{ color: C.text }} aria-label="设置">
              <IcSettings size={18} />
            </button>
          </div>
          {/* 统计标签 + mini 热力图 */}
          <button {...bindTap('tag.drawer.statsOpen')} className="w-full flex gap-4 mt-3 bg-transparent border-none cursor-pointer text-left">
            <span style={{ color: C.sub, fontSize: 12 }}>{user.memoCount} 笔记</span>
            <span style={{ color: C.sub, fontSize: 12 }}>{user.tagCount} 标签</span>
            <span style={{ color: C.sub, fontSize: 12 }}>{user.days} 天</span>
          </button>
          <div className="mt-2">
            <style>{'@keyframes flomoHeatShake{10%,90%{transform:translateX(-1px)}20%,80%{transform:translateX(2px)}30%,50%,70%{transform:translateX(-4px)}40%,60%{transform:translateX(4px)}}'}</style>
            <div
              className="grid gap-1"
              style={{ gridTemplateColumns: 'repeat(13, 1fr)', animation: shaking ? 'flomoHeatShake 0.45s' : undefined }}
            >
              {cells.map((c) =>
                c.count > 0 ? (
                  <button
                    key={c.date}
                    {...bindTap('tag.drawer.heatmapDay', {
                      beforeTrigger: () => {
                        setCurrentFilter('byDate');
                        setCurrentDate(c.date);
                      },
                    })}
                    className="rounded-sm border-none cursor-pointer p-0"
                    style={{ aspectRatio: '1 / 1', background: heatColor(c.count) }}
                    aria-label={`${c.date} ${c.count}条`}
                  />
                ) : (
                  <button
                    key={c.date}
                    {...bindTap({ kind: 'action', id: 'tag.drawer.heatmapEmpty' }, { onTrigger: shake })}
                    className="rounded-sm border-none cursor-pointer p-0"
                    style={{ aspectRatio: '1 / 1', background: '#EAEFEC' }}
                    aria-label={`${c.date} 无记录`}
                  />
                ),
              )}
            </div>
            <div className="flex mt-1 text-[10px]" style={{ color: C.sub }}>
              <span className="flex-1">5月</span>
              <span className="flex-1 text-center">6月</span>
              <span className="flex-1 text-right">7月</span>
            </div>
          </div>
        </div>

        <div className="h-px mx-4 mb-1" style={{ background: C.border }} />

        {/* 全部笔记 + 嵌套内容筛选 */}
        <Item icon={<IcInbox size={16} />} label="全部笔记" count={liveCount} bind={bindTap('tag.drawer.allNotes')} />
        <div className="ml-7 pl-1 border-l" style={{ borderColor: C.border }}>
          <Item icon={<IcFilterImage size={16} />} label="有图片" bind={filterBind('filter.byType.images', 'images')} />
          <Item icon={<IcFilterAudio size={16} />} label="有语音" bind={filterBind('filter.byType.audio', 'audio')} />
          <Item icon={<IcFilterLink size={16} />} label="有链接" bind={filterBind('filter.byType.links', 'links')} />
          <Item icon={<IcFilterTag size={16} />} label="无标签" bind={filterBind('filter.byType.untagged', 'untagged')} />
        </div>
        <Item icon={<IcMic size={16} />} label="微信输入" bind={filterBind('filter.byType.wechat', 'wechat')} />

        <div className="h-px mx-4 my-1" style={{ background: C.border }} />

        {/* 功能入口 */}
        <Item icon={<IcReview size={16} />} label="每日回顾" bind={bindTap('review.daily.fromDrawer')} />
        <Item icon={<IcAi size={16} />} label="AI 清单" bind={bindTap('ai.insight.fromDrawer')} />
        <Item icon={<IcAi size={16} />} label="Agent" bind={bindTap({ kind: 'action', id: 'tag.drawer.agent.open' }, { onTrigger: () => toast('该功能暂未开放') })} />
        <Item icon={<IcDice size={16} />} label="随机漫步" bind={bindTap('review.random.fromDrawer')} />
        <Item icon={<IcMindMap size={16} />} label="认知地图" bind={bindTap('mind.map.open')} />

        <div className="h-px mx-4 my-1" style={{ background: C.border }} />

        {/* 自创标签(含二级标签,子标签缩进) */}
        <div className="px-4 py-1 text-xs" style={{ color: C.sub }}>标签</div>
        {topTags.map((t) => {
          const children = tags.filter((c) => c.parentId === t.id);
          return (
            <React.Fragment key={t.id}>
              <Item
                icon={<IcTag size={16} />}
                label={t.name}
                count={t.count}
                bind={bindTap('tag.filter.fromDrawer', { beforeTrigger: () => setCurrentTag(t.id) })}
                longBind={bindLongPress({ kind: 'action', id: 'tag.drawer.tag.longpress' }, { onTrigger: () => {} })}
              />
              {children.length > 0 && (
                <div className="ml-7 pl-1 border-l" style={{ borderColor: C.border }}>
                  {children.map((c) => (
                    <Item
                      key={c.id}
                      icon={<span style={{ color: C.sub, fontSize: 13 }}>#</span>}
                      label={c.name.includes('/') ? c.name.split('/').slice(1).join('/') : c.name}
                      count={c.count}
                      bind={bindTap('tag.filter.fromDrawer', { beforeTrigger: () => setCurrentTag(c.id) })}
                    />
                  ))}
                </div>
              )}
            </React.Fragment>
          );
        })}

        <div className="h-px mx-4 my-1" style={{ background: C.border }} />

        {/* 底部入口 */}
        <Item icon={<IcTrash size={16} />} label="回收站" bind={bindTap('trash.page.open')} />
        <Item icon={<IcHelp size={16} />} label="帮助中心" bind={bindTap({ kind: 'action', id: 'tag.drawer.help.open' }, { onTrigger: () => toast('该功能暂未开放') })} />
        <Item icon={<IcSort size={16} />} label="标签管理" bind={bindTap('tag.manage.open')} />
        <div className="h-6" />
      </div>

      {/* 右侧遮罩,点击关闭 */}
      <DrawerBackdrop />
    </div>
  );
}

function DrawerBackdrop() {
  const { bindBack } = useFlomoGestures();
  return <div {...bindBack()} className="flex-1 h-full" style={{ background: 'rgba(0,0,0,0.35)' }} />;
}

// 按当日笔记数着色(仅 count>0 调用)
function heatColor(count: number): string {
  if (count >= 3) return '#2E9E63';
  if (count === 2) return '#45B57C';
  return '#79C9A0';
}
