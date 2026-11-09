// 小组Tab主页(group.tab,frame:1779a1@t0025):
// 顶部(☰/胶囊搜索/耳机/信封)+ 我的小组横滑(封面+未读角标)+ 发现小组信息流(组卡+加入按钮+热帖预览)
// + 底部5Tab(小组选中,ChromeTabbar 由 AppShell 渲染)。
import React, { useMemo } from 'react';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, Img, SectionHeader } from '../components/ui';
import type { DoubanGroup } from '../types';

/** 我的小组未读角标(seed 无未读字段,按热度派生一个稳定的假角标) */
function unreadOf(g: DoubanGroup): number {
  return g.id === 'g_banshu' ? 20 : g.id === 'g_naicha' ? 5 : 0;
}

/** 封面左下角未读气泡(灰黑 speech bubble + 白字,尾角在左下) */
function UnreadBubble({ n }: { n: number }) {
  return (
    <span
      className="absolute bottom-0 left-0 min-w-4 h-4 px-1 flex items-center justify-center text-[10px] text-white leading-none"
      style={{ background: 'rgba(45,48,54,0.85)', borderRadius: '8px 8px 8px 2px' }}
    >
      {n}
    </span>
  );
}

/** 热帖行图标:橙色实心气泡 + 内白细纹 */
function HotBubbleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" className="shrink-0" style={{ display: 'block' }}>
      <path
        d="M4 4h16a2 2 0 012 2v9a2 2 0 01-2 2H9l-5 4v-4H4a2 2 0 01-2-2V6a2 2 0 012-2z"
        fill="#FF9900"
      />
      <path d="M7 9h10M7 12.5h6" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** 组卡热帖预览行(橙实心气泡图标 + 灰数字 + 标题) */
function HotRow({ replyCount, title, bind }: { replyCount: number; title: string; bind: object }) {
  return (
    <div {...bind} className="px-2.5 py-1.5 flex items-center gap-1.5 text-xs cursor-pointer">
      <span className="shrink-0 flex items-center gap-1">
        <HotBubbleIcon />
        <span style={{ color: '#B9BEC6' }}>{replyCount}</span>
      </span>
      <span className="flex-1 truncate" style={{ color: C.text }}>{title}</span>
    </div>
  );
}

export default function GroupTabPage() {
  const { bindTap } = useDoubanGestures();
  const toast = useDoubanStore((s) => s.toast);
  const groups = useDoubanStore((s) => s.groups);
  const groupPosts = useDoubanStore((s) => s.groupPosts);
  const joinGroupDirect = useDoubanStore((s) => s.joinGroupDirect);

  const myGroups = useMemo(() => groups.filter((g) => g.joined), [groups]);
  const discoverGroups = useMemo(() => groups.filter((g) => !g.joined), [groups]);

  // 每组取前 1~2 条热帖(标题 + 回应数)做预览行
  const hotPostsOf = useMemo(() => {
    const m = new Map<string, { title: string; replyCount: number }[]>();
    for (const p of groupPosts) {
      if (!p.groupId) continue;
      const list = m.get(p.groupId) ?? [];
      if (list.length < 2) {
        list.push({ title: p.title, replyCount: p.replyCount });
        m.set(p.groupId, list);
      }
    }
    return (gid: string) => m.get(gid) ?? [];
  }, [groupPosts]);

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      {/* 顶部栏:☰ / 胶囊搜索 / 耳机 / 信封 */}
      <div className="flex items-center gap-2 px-3 h-12 shrink-0 bg-white">
        <button
          {...bindTap('groupTab.drawer-open')}
          className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer shrink-0"
          style={{ color: C.green }}
          aria-label="菜单"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <button
          {...bindTap('groupTab.search-open')}
          className="flex-1 flex items-center gap-2 h-9 rounded-full px-3.5 border-none cursor-pointer text-sm text-left min-w-0"
          style={{ background: '#F2F3F5', color: C.sub }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <span className="truncate">暑期档新片预售遇冷</span>
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'groupTab.feedGroup.join' }, { params: { pre: 1 }, onTrigger: () => toast('该功能暂未开放') })}
          className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer shrink-0"
          style={{ color: C.green }}
          aria-label="播放列表"
        >
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
            <path d="M3 18v-6a9 9 0 0118 0v6" />
            <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" />
          </svg>
        </button>
        <span className="w-9 h-9 flex items-center justify-center shrink-0" style={{ color: C.green }}>
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M22 6l-10 7L2 6" />
          </svg>
        </span>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 我的小组:横滑封面 */}
        <div className="bg-white pt-1 pb-3">
          <SectionHeader
            title="我的小组"
            moreText="全部"
            moreProps={bindTap('groupTab.mine-open')}
          />
          <div className="flex gap-3 px-4 overflow-x-auto" data-scroll-container="mine" data-scroll-direction="horizontal">
            {myGroups.map((g) => {
              const unread = unreadOf(g);
              return (
                <button
                  key={g.id}
                  {...bindTap('groupTab.group-open', { params: { groupId: g.id } })}
                  className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer shrink-0 w-16"
                >
                  <span className="relative block">
                    <Img src={g.icon} className="w-14 h-14 rounded-xl object-cover" />
                    {unread > 0 && <UnreadBubble n={unread} />}
                  </span>
                  <span className="text-[11px] truncate w-full text-center" style={{ color: C.text }}>{g.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 发现小组:组卡流 */}
        <div className="mt-2 bg-white pb-4">
          <SectionHeader
            title="发现小组"
            moreText="更多"
            moreProps={bindTap('groupTab.discover-open')}
          />
          {discoverGroups.map((g) => {
            const hots = hotPostsOf(g.id);
            const isDirect = g.joinType === 'direct';
            return (
              <div key={g.id} className="px-4 py-3 border-t" style={{ borderColor: '#F2F3F5' }}>
                <div className="flex items-center gap-3">
                  <span {...bindTap('groupTab.feedGroup-open', { params: { groupId: g.id } })} className="cursor-pointer shrink-0">
                    <Img src={g.icon} className="w-11 h-11 rounded-xl object-cover" />
                  </span>
                  <span
                    {...bindTap('groupTab.feedGroup-open', { params: { groupId: g.id } })}
                    className="flex-1 min-w-0 cursor-pointer"
                  >
                    <span className="block text-[15px] font-semibold truncate" style={{ color: C.text }}>{g.name}</span>
                    <span className="block text-xs mt-0.5 truncate" style={{ color: C.sub }}>{g.members.toLocaleString()} {g.memberNoun ?? '成员'}</span>
                  </span>
                  <button
                    {...bindTap({ kind: 'action', id: 'groupTab.feedGroup.join' }, {
                      params: { groupId: g.id },
                      onTrigger: () => {
                        if (g.joined) return;
                        if (isDirect) {
                          joinGroupDirect(g.id);
                          toast(`已加入「${g.name}」`);
                        } else if (g.joinType === 'quiz') {
                          toast('该组需答题入组,进入小组页答题');
                        } else if (g.joinType === 'apply') {
                          toast('该组为申请制,进入小组页申请');
                        } else {
                          toast('该组仅可关注');
                        }
                      },
                    })}
                    className="px-3 h-7 rounded-full text-xs cursor-pointer shrink-0"
                    style={
                      g.joined
                        ? { background: 'transparent', color: C.sub, border: `1px solid ${C.border}` }
                        : { background: C.greenSoft, color: C.green, border: 'none' }
                    }
                  >
                    {g.joined ? '已加入' : '+ 加入'}
                  </button>
                </div>
                {hots.length > 0 && (
                  <div className="mt-2 ml-14 rounded-lg overflow-hidden" style={{ background: '#F7F7F7' }}>
                    {hots.map((h, i) => (
                      <HotRow
                        key={i}
                        replyCount={h.replyCount}
                        title={h.title}
                        bind={bindTap('groupTab.feedGroup-open', { params: { groupId: g.id } })}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
