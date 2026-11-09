// 徽章墙(badge.wall,/user/:userId/badges,IMG_0248/0393,frame:a7b8cd@t0008):
// 全页深橄榄绿主题:头部(头像/昵称/加入年份/右侧金色大数字N枚 + 桂冠纹样) +
// 活动/大师/系列/纪念 四分区(金色右对齐 x/y 枚计数)。大师区带 MASTER SERIES 水印 + 进度条。
// 本人=空态(0枚全灰);他人(桔梗 2枚)=部分点亮,系列点亮徽章带金色日期条「— 2022.09.01 —」。
// 徽章格/分区标题 → toast「该功能暂未开放」。
import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { TopBar, Avatar, C, TheEnd } from '../components/ui';

/** 深橄榄绿主题皮肤 */
const OLIVE_BG = '#2E3A26';
const OLIVE_CARD = 'rgba(255,255,255,0.05)';
const OLIVE_CARD_LIT = 'rgba(245,166,35,0.10)';

/** 系列点亮徽章的获得日期(确定性静态,禁 new Date/Date.now) */
const SERIES_DATE = '2022.09.01';

/** 分区徽章池(emoji + 名称,静态货架)。activity/master/series/memorial 四区。 */
const SECTIONS: {
  key: string;
  title: string;
  total: number;
  /** 大师区:大卡 + 进度条 */
  master?: boolean;
  badges: { emoji: string; name: string; progress?: string }[];
}[] = [
  {
    key: 'series', title: '系列徽章', total: 3,
    badges: [
      { emoji: '🧙', name: '《哈利·波特》"9¾"徽章' },
      { emoji: '👽', name: '《异形》"抱脸"徽章' },
      { emoji: '🦇', name: '《蝙蝠侠》"暗夜"徽章' },
    ],
  },
  {
    key: 'memorial', title: '纪念徽章', total: 10,
    badges: [
      { emoji: '💯', name: '迪士尼奇妙…' }, { emoji: '2️⃣5️⃣', name: '豆瓣2025年…' },
      { emoji: '2️⃣4️⃣', name: '豆瓣2024年…' }, { emoji: '2️⃣3️⃣', name: '豆瓣2023年…' },
    ],
  },
  {
    key: 'activity', title: '活动徽章', total: 319,
    badges: [
      { emoji: '🏃', name: '播客7月收听…' }, { emoji: '🫥', name: '拯救前额叶' },
      { emoji: '🏅', name: '播客6月收听…' }, { emoji: '🐱', name: '三彩阿白' },
      { emoji: '🏆', name: '阿黑捧杯' }, { emoji: '🐋', name: '创作小岛·夏…' },
      { emoji: '🎧', name: '播客5月收听…' }, { emoji: '🍩', name: '彩虹甜甜圈' },
    ],
  },
  {
    key: 'master', title: '大师徽章', total: 21, master: true,
    badges: [
      { emoji: '🌙', name: '张爱玲"银月"徽章', progress: '0/10' },
      { emoji: '🎀', name: '奥黛丽·赫本"丽人"徽章', progress: '0/20' },
    ],
  },
];

export default function BadgeWallPage() {
  const { bindTap } = useDoubanGestures();
  const toast = useDoubanStore((s) => s.toast);
  const routeParams = useParams();
  const currentUser = useDoubanStore((s) => s.currentUser);
  const users = useDoubanStore((s) => s.users);

  const rawId = routeParams.userId ?? 'self';
  const user = useMemo(() => {
    if (rawId === 'self' || rawId === currentUser.id) return currentUser;
    return users.find((u) => u.id === rawId) ?? currentUser;
  }, [rawId, users, currentUser]);

  const owned = user.badges ?? 0;
  // 点亮数量:按用户徽章总数在各分区内均摊(仅用于视觉点亮,不追求精确)
  const litCount = useMemo(() => {
    const total = SECTIONS.reduce((n, s) => n + s.badges.length, 0);
    return owned === 0 ? 0 : Math.min(total, owned);
  }, [owned]);

  // 分区排序:有点亮徽章的分区浮在空分区之前(按货架顺序均摊点亮,确定性)
  const orderedSections = useMemo(() => {
    let remaining = litCount;
    const allocated = SECTIONS.map((sec) => {
      const litHere = Math.max(0, Math.min(sec.badges.length, remaining));
      remaining -= litHere;
      return { sec, litHere };
    });
    return [...allocated.filter((x) => x.litHere > 0), ...allocated.filter((x) => x.litHere === 0)];
  }, [litCount]);

  return (
    <div className="flex flex-col h-full" style={{ background: OLIVE_BG }} data-status-bar-foreground="light">
      <TopBar title="徽章墙" dark bg={OLIVE_BG} borderless />
      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
        style={{ background: OLIVE_BG }}
      >
        {/* 头部:头像/昵称/加入年份 + 右侧桂冠纹样 + 金色大数字 */}
        <div className="relative px-5 pt-4 pb-6 flex items-center justify-between">
          {/* 桂冠纹样(右上淡金水印) */}
          <svg
            className="absolute right-3 top-1"
            width="150" height="90" viewBox="0 0 150 90" fill="none"
            style={{ opacity: 0.28 }}
            aria-hidden
          >
            <g stroke={C.gold} strokeWidth="2" fill="none" strokeLinecap="round">
              <path d="M75 82 C40 78 22 55 22 26" />
              <path d="M75 82 C110 78 128 55 128 26" />
              {[26, 38, 50, 62].map((y, i) => (
                <g key={`l${i}`}>
                  <path d={`M${22 + i * 3} ${y} q-14 -6 -20 4`} />
                  <path d={`M${128 - i * 3} ${y} q14 -6 20 4`} />
                </g>
              ))}
            </g>
          </svg>
          <div className="flex items-center gap-3 min-w-0">
            <Avatar src={user.avatar} size={52} className="border-2 border-white/20" />
            <div className="min-w-0">
              <div className="text-white font-semibold text-base truncate">{user.name}</div>
              <div className="text-white/50 text-xs mt-0.5">{user.joinedText ?? '加入豆瓣'}</div>
            </div>
          </div>
          <div className="text-right shrink-0 relative">
            <div className="text-4xl font-bold leading-none" style={{ color: C.gold }}>{owned}</div>
            <div className="text-white/50 text-xs mt-1">枚徽章</div>
          </div>
        </div>

        {/* 分区 */}
        <div className="px-4 pb-2">
          {orderedSections.map(({ sec, litHere }) => {
            const isMaster = !!sec.master;
            return (
              <div key={sec.key} className="mb-6 relative">
                {/* 大师区:MASTER SERIES 大字水印 */}
                {isMaster && (
                  <div
                    className="absolute -top-3 left-0 text-3xl font-black tracking-widest pointer-events-none select-none"
                    style={{ color: 'rgba(255,255,255,0.06)' }}
                    aria-hidden
                  >
                    MASTER SERIES
                  </div>
                )}
                {/* 分区标题行:标题(白) + 右对齐金色 litHere/total 枚 */}
                <button
                  {...bindTap({ kind: 'action', id: 'badge.section.more.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
                  className="relative w-full flex items-center justify-between bg-transparent border-none cursor-pointer text-left mb-3"
                >
                  <span className="text-[19px] font-bold text-white">{sec.title} <span className="text-sm font-normal text-white/50">›</span></span>
                  <span className="text-sm font-semibold" style={{ color: C.gold }}>{litHere}/{sec.total} 枚</span>
                </button>

                {isMaster ? (
                  // 大师徽章:大卡 + 进度条
                  <div className="grid grid-cols-2 gap-3">
                    {sec.badges.map((b, i) => {
                      const lit = i < litHere;
                      return (
                        <button
                          key={b.name}
                          {...bindTap({ kind: 'action', id: 'badge.item.detail.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
                          className="flex flex-col items-center gap-2 rounded-2xl px-3 pt-6 pb-4 border-none cursor-pointer"
                          style={{ background: lit ? OLIVE_CARD_LIT : OLIVE_CARD }}
                        >
                          <span
                            className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                            style={{ filter: lit ? 'none' : 'grayscale(1)', opacity: lit ? 1 : 0.5 }}
                          >
                            {b.emoji}
                          </span>
                          <span className="text-xs text-center leading-tight line-clamp-1 w-full" style={{ color: lit ? '#fff' : 'rgba(255,255,255,0.65)' }}>
                            {b.name}
                          </span>
                          {b.progress && (
                            <div className="w-full flex items-center gap-2 mt-1">
                              <span className="text-[10px]" style={{ color: C.gold }}>{b.progress}</span>
                              <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.12)' }}>
                                <div className="h-full rounded-full" style={{ width: lit ? '100%' : '0%', background: C.gold }} />
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  // 普通分区:4列徽章格
                  <div className="grid grid-cols-4 gap-3">
                    {sec.badges.map((b, i) => {
                      const lit = i < litHere;
                      const showDate = lit && sec.key === 'series';
                      return (
                        <button
                          key={b.name}
                          {...bindTap({ kind: 'action', id: 'badge.item.detail.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
                          className="flex flex-col items-center gap-1.5 rounded-xl px-1 py-2.5 border-none cursor-pointer"
                          style={{ background: lit ? OLIVE_CARD_LIT : OLIVE_CARD }}
                        >
                          <span
                            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                            style={{ filter: lit ? 'none' : 'grayscale(1)', opacity: lit ? 1 : 0.5 }}
                          >
                            {b.emoji}
                          </span>
                          <span className="text-[10px] text-center leading-tight line-clamp-1 w-full px-0.5" style={{ color: lit ? '#fff' : 'rgba(255,255,255,0.55)' }}>
                            {b.name}
                          </span>
                          {showDate && (
                            <span className="text-[9px] tracking-wide" style={{ color: C.gold }}>— {SERIES_DATE} —</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <TheEnd />
      </div>
    </div>
  );
}
