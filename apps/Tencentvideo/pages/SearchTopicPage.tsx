import React, { useMemo } from 'react';
import { useTencentvideoGestures } from '../hooks/useTencentvideoGestures';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import { useTvQuery } from '../hooks/useTvParams';
import { useTencentvideoStore } from '../state';
import { TV_COLORS as C } from '../constants';
import { EmptyState, TopBar } from '../components/ui';
import { TvImg } from '../components/Img';
import { PosterCard } from '../components/PosterCard';

export default function SearchTopicPage() {
  const { bindTap } = useTencentvideoGestures();
  const s = useTencentvideoStrings();
  const topicId = useTvQuery('topicId');
  const discussions = useTencentvideoStore((s) => s.discussions);
  const contents = useTencentvideoStore((s) => s.contents);

  const topic = discussions.find((d) => d.id === topicId);
  const host = contents.find((c) => c.id === topic?.contentId);
  const relatedPosts = useMemo(() => {
    if (!topic) return [];
    const hostTags = new Set(host?.tags ?? []);
    return discussions.filter((d) => {
      if (d.id === topic.id) return true;
      const content = contents.find((c) => c.id === d.contentId);
      return d.contentId === topic.contentId || content?.tags.some((tag) => hostTags.has(tag));
    });
  }, [topic, host, discussions, contents]);
  const relatedWorks = useMemo(() => {
    const hostTags = new Set(host?.tags ?? []);
    return contents
      .filter((c) => c.id === host?.id || c.tags.some((tag) => hostTags.has(tag)))
      .slice(0, 6);
  }, [host, contents]);

  if (!topic) {
    return (
      <div className="flex flex-col h-full" style={{ background: C.pageBg }} data-status-bar-foreground="dark">
        <TopBar title={s.topicTitle} />
        <EmptyState text={s.topicUnavailable} />
      </div>
    );
  }
  const reads = topic.comments * 128 + topic.shares * 37;

  return (
    <div className="flex flex-col h-full" style={{ background: C.chipGray }} data-status-bar-foreground="dark">
      <TopBar title={s.topicTitle} />
      <div className="flex-1 overflow-y-auto pb-6" data-scroll-container="main" data-scroll-direction="vertical">
        <section className="px-4 py-4" style={{ background: C.pageBg }}>
          <div className="text-[22px] font-bold" style={{ color: C.text }}># {topic.title}</div>
          <div className="mt-1 text-[12px]" style={{ color: C.textSub }}>
            {reads.toLocaleString()}{s.topicReads} · {relatedPosts.length + topic.comments}{s.topicDiscussions}
          </div>
          <div className="mt-3 text-[14px] leading-[21px]" style={{ color: C.text }}>{topic.content}</div>
        </section>

        {host && (
          <button
            {...bindTap('detail.series.open.fromTopic', { params: { contentId: host.id } })}
            className="mx-3 mt-3 w-[calc(100%-24px)] flex items-center gap-3 rounded-xl border-none p-3 text-left"
            style={{ background: C.pageBg }}
          >
            <TvImg id={host.poster} alt={host.title} className="w-14 aspect-[3/4] rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-semibold truncate" style={{ color: C.text }}>{host.title}</div>
              <div className="text-[12px] mt-1 line-clamp-2" style={{ color: C.textSub }}>{host.desc}</div>
              <div className="text-[12px] mt-1" style={{ color: C.primary }}>{s.topicViewRelated}</div>
            </div>
          </button>
        )}

        <div className="px-3 pt-4 pb-2 text-[17px] font-bold" style={{ color: C.text }}>{s.topicDiscussionTitle}</div>
        <div className="mx-3 rounded-xl overflow-hidden" style={{ background: C.pageBg }}>
          {relatedPosts.map((post) => (
            <div key={post.id} className="px-3 py-3 border-b last:border-b-0" style={{ borderColor: C.chipGray }}>
              <div className="text-[13px] font-semibold" style={{ color: C.text }}>{post.author}</div>
              <div className="text-[13px] mt-1 leading-[19px]" style={{ color: C.text }}>{post.content}</div>
              <div className="text-[11px] mt-1" style={{ color: C.textSub }}>
                {post.comments}{s.topicComments} · {post.shares}{s.topicShares}
              </div>
            </div>
          ))}
        </div>

        <div className="px-3 pt-4 pb-2 text-[17px] font-bold" style={{ color: C.text }}>{s.topicRelatedWorks}</div>
        <div className="flex gap-2 overflow-x-auto px-3 scrollbar-none" data-scroll-container="relatedWorks" data-scroll-direction="horizontal">
          {relatedWorks.map((item) => (
            <div key={item.id} className="shrink-0 w-[104px]">
              <PosterCard content={item} size="sm" bind={bindTap('detail.series.open.fromTopic', { params: { contentId: item.id } })} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
