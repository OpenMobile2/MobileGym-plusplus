import React from 'react';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, SectionHeader } from '../components/ui';
import { ChannelTopBar } from '../components/ChannelTopBar';

// 书影音-同城频道(静态 stub):所有内容点击 -> 「该功能暂未开放」toast;唯一正路=切频道/搜索。
export default function BmCityStubPage() {
  const { bindTap } = useDoubanGestures();
  const notifications = useDoubanStore((s) => s.notifications);
  const toast = useDoubanStore((s) => s.toast);
  const unread = React.useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);
  const wontfix = bindTap({ kind: 'action', id: 'bm.city.content.wontfix' }, { onTrigger: () => toast('该功能暂未开放') });

  const channels: { ch: string; label: string }[] = [
    { ch: 'movie', label: '电影' },
    { ch: 'tv', label: '电视' },
    { ch: 'book', label: '读书' },
    { ch: 'podcast', label: '播客' },
    { ch: 'music', label: '音乐' },
    { ch: 'city', label: '同城' },
  ];
  const activities = [
    { title: '脱口秀之夜 · 爆笑专场', place: '鼓楼西剧场', date: '2026-07-08', tag: '猫眼售票', skin: 'linear-gradient(160deg,#3A2E4A,#1E1830)' },
    { title: '当代艺术特展 · 光的迁徙', place: 'UCCA', date: '2026-07-12', tag: '精选', skin: 'linear-gradient(160deg,#264A5C,#14303F)' },
    { title: '现场音乐 · 民谣拼盘', place: '疆进酒', date: '2026-07-15', tag: '猫眼售票', skin: 'linear-gradient(160deg,#4A3A2E,#2E2018)' },
    { title: '话剧 · 暗恋桃花源', place: '保利剧院', date: '2026-07-20', tag: '精选', skin: 'linear-gradient(160deg,#3E4A34,#232C1D)' },
  ];

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      <ChannelTopBar
        menuBinding={bindTap('bm.city.drawer-open')}
        searchBinding={bindTap('bm.city.search-open')}
        audioBinding={bindTap({ kind: 'action', id: 'bm.city.headset.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
        messageBinding={bindTap('bm.city.message-open')}
        searchText="搜索同城活动"
        unread={unread}
      />

      {/* 二级频道Tab条:六个Tab均匀铺满,当前项黑粗+短黑下划线(对齐真机 t0005) */}
      <div className="flex items-center h-10 shrink-0 bg-white overflow-x-auto" data-scroll-container="channel-tabs" data-scroll-direction="horizontal">
        {channels.map((c) => {
          const active = c.ch === 'city';
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
              {...bindTap('bm.city.channelTab-open', { params: { channel: c.ch } })}
              className="flex-1 min-w-0 flex flex-col items-center justify-center pt-1.5 bg-transparent border-none cursor-pointer"
            >
              {inner}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto pb-6" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 城市 + 筛选条(两段式:当前城市:北京 › | 类型 时间 地点 ›) */}
        <div className="flex items-center gap-3 px-4 py-3 bg-white">
          <button {...wontfix} className="flex items-center gap-1 text-sm bg-transparent border-none cursor-pointer" style={{ color: C.text }}>
            当前城市:<span className="font-semibold" style={{ color: C.green }}>北京</span> ›
          </button>
          <span className="flex-1" />
          <button {...wontfix} className="text-xs bg-transparent border-none cursor-pointer" style={{ color: C.sub }}>类型 时间 地点 ›</button>
        </div>

        {/* 热门活动:横滑竖海报大卡(2:3 海报 + 标题2行 + 日期) */}
        <SectionHeader title="热门活动" />
        <div className="flex gap-3 px-4 pb-2 overflow-x-auto" data-scroll-container="hot-activities" data-scroll-direction="horizontal">
          {activities.map((a) => (
            <button key={a.title} {...wontfix} className="shrink-0 w-32 text-left bg-transparent border-none cursor-pointer p-0">
              <div className="relative w-32 rounded-lg overflow-hidden flex items-end p-2" style={{ height: 192, background: a.skin }}>
                <span className="absolute top-1.5 left-1.5 text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,0,0,0.4)', color: '#fff' }}>{a.tag}</span>
                <span className="text-3xl">🎭</span>
              </div>
              <div className="mt-1.5 text-xs font-semibold line-clamp-2" style={{ color: C.text }}>{a.title}</div>
              <div className="mt-0.5 text-[11px]" style={{ color: C.sub }}>{a.date}</div>
              <div className="text-[11px] truncate" style={{ color: C.sub }}>{a.place}</div>
            </button>
          ))}
        </div>

        {/* 售票入口:整宽米底卡(对齐真机同城「售票」区,暂未开放 stub) */}
        <div className="px-4 pt-2 pb-1">
          <button {...wontfix} className="w-full flex items-center gap-3 rounded-xl p-3.5 text-left border-none cursor-pointer" style={{ background: '#FFF4E5' }}>
            <span className="text-2xl shrink-0">🎟️</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold" style={{ color: C.text }}>在线购票</div>
              <div className="text-[11px] mt-0.5" style={{ color: C.sub }}>演出 · 展览 · 现场演出一站购</div>
            </div>
            <span className="text-xs shrink-0" style={{ color: C.sub }}>全部 99 ›</span>
          </button>
        </div>

        {/* 精选:白卡横排(缩略图 + 标题 + 副信息),点击 -> 暂未开放 */}
        <SectionHeader title="精选" />
        <div className="px-4 space-y-2.5">
          {[
            { title: '夏夜露天电影展 · 星空放映', place: '朝阳公园', date: '2026-07-18', emoji: '🎬' },
            { title: '独立书店市集 · 旧纸的温度', place: '798艺术区', date: '2026-07-22', emoji: '📚' },
            { title: '城市漫步 · 老巷里的手艺人', place: '什刹海', date: '2026-07-25', emoji: '🚶' },
          ].map((f) => (
            <button key={f.title} {...wontfix} className="w-full flex items-center gap-3 rounded-xl p-2.5 text-left border-none cursor-pointer bg-white" style={{ border: `1px solid ${C.border}` }}>
              <span className="w-14 h-14 rounded-lg shrink-0 flex items-center justify-center text-2xl" style={{ background: C.surface, border: `1px solid ${C.border}` }}>{f.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold line-clamp-2" style={{ color: C.text }}>{f.title}</div>
                <div className="mt-0.5 text-[11px]" style={{ color: C.sub }}>{f.date} · {f.place}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
