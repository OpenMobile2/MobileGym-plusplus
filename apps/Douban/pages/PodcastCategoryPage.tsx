import React, { useMemo, useState } from 'react';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, Img, RatingLine } from '../components/ui';

// 节点: podcast.category —— 分类找播客。
// evidence: IMG_0356/0357/0353
// emoji 分类 chips(与 bm.podcast 页「分类找播客」色块分类集一致)
const CATEGORIES: { emoji: string; label: string }[] = [
  { emoji: '💼', label: '商业科技' },
  { emoji: '🪴', label: '自我成长' },
  { emoji: '🧬', label: '健康与生活' },
  { emoji: '🌏', label: '科学与自然' },
  { emoji: '📜', label: '人文历史' },
  { emoji: '🎬', label: '影视娱乐' },
  { emoji: '📖', label: '阅读' },
  { emoji: '📰', label: '新闻资讯' },
];

// 分类 → 播客 genres 关键词(数据无 category 字段,按 genres 命中筛选)
const CATEGORY_GENRES: Record<string, string[]> = {
  商业科技: ['商业', '职场', '科技'],
  自我成长: ['成长', '职场', '情感', '生活'],
  健康与生活: ['生活', '健康', '情感'],
  科学与自然: ['科学', '自然'],
  人文历史: ['历史', '文化', '人文'],
  影视娱乐: ['电影', '音乐', '娱乐', '影视'],
  阅读: ['读书', '阅读', '文化'],
  新闻资讯: ['新闻', '资讯', '时事'],
};

export default function PodcastCategoryPage() {
  const { bindBack, bindTap } = useDoubanGestures();
  const toast = useDoubanStore((s) => s.toast);
  const subjects = useDoubanStore((s) => s.subjects);
  const podcastSubscriptions = useDoubanStore((s) => s.podcastSubscriptions);
  const togglePodcastSubscription = useDoubanStore((s) => s.togglePodcastSubscription);

  const [cat, setCat] = useState('商业科技');
  const podcasts = useMemo(() => {
    const kws = CATEGORY_GENRES[cat] ?? [];
    return subjects.filter(
      (s) => s.type === 'podcast' && (s.genres ?? []).some((g) => kws.includes(g)),
    );
  }, [subjects, cat]);

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      {/* 顶栏:‹ + 居中纯文字标题(真机 IMG_0357 无搜索图标) */}
      <div className="flex items-center h-11 px-1 shrink-0 bg-white border-b" style={{ borderColor: C.border }}>
        <button {...bindBack()} className="w-10 h-10 flex items-center justify-center text-2xl bg-transparent border-none cursor-pointer" style={{ color: C.text }}>‹</button>
        <div className="flex-1 text-center font-semibold text-base" style={{ color: C.text }}>分类找播客</div>
        <div className="w-10 h-10 shrink-0" />
      </div>

      {/* 分类 tab 横滑 */}
      <div className="shrink-0 flex gap-1 px-3 py-2 overflow-x-auto bg-white border-b" style={{ borderColor: C.border }} data-scroll-container="cats" data-scroll-direction="horizontal">
        {CATEGORIES.map((c) => {
          const active = cat === c.label;
          return (
            <button
              key={c.label}
              {...bindTap({ kind: 'action', id: 'podcast.category.tab.select.target' }, { params: { target: c.label }, onTrigger: () => setCat(c.label) })}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border-none cursor-pointer shrink-0"
              style={{ background: active ? '#2A2A2A' : '#F2F3F5', color: active ? '#fff' : C.sub, fontWeight: active ? 600 : 400 }}
            >
              <span className="text-[13px]">{c.emoji}</span>
              {c.label}
            </button>
          );
        })}
      </div>

      {/* 播客列表 */}
      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {podcasts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-sm gap-2" style={{ color: C.sub }}>
            <span className="text-3xl">🎧</span>
            该分类暂无播客
          </div>
        )}
        {podcasts.map((p) => {
          const subscribed = podcastSubscriptions.includes(p.id);
          return (
            <div key={p.id} className="flex gap-3 items-start bg-white px-4 py-3 border-b" style={{ borderColor: '#F5F6F7' }}>
              <button
                {...bindTap('podcast.category.item-open', { params: { episodeId: p.id } })}
                className="flex gap-3 flex-1 min-w-0 bg-transparent border-none cursor-pointer text-left p-0"
              >
                <Img src={p.cover} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-semibold truncate" style={{ color: C.text }}>{p.showName ?? p.title}</div>
                  {p.rating != null && <div className="mt-1"><RatingLine rating={p.rating} /></div>}
                  <div className="mt-1 text-xs line-clamp-2" style={{ color: C.sub }}>{p.intro ?? p.title}</div>
                </div>
              </button>
              <button
                {...bindTap({ kind: 'action', id: 'podcast.category.subscribe.toggle' }, { onTrigger: () => { togglePodcastSubscription(p.id); toast(subscribed ? '已取消订阅' : '订阅成功'); } })}
                className="px-3.5 h-7 rounded-full text-xs cursor-pointer shrink-0 self-center flex items-center gap-1"
                style={subscribed ? { background: '#F2F3F5', color: C.sub, border: 'none' } : { background: '#FFF4E5', color: C.orange, border: 'none' }}
              >
                {subscribed ? '✓ 已订阅' : '♡ 订阅'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
