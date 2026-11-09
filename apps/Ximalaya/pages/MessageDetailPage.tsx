import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useXimalayaGestures } from '../hooks/useXimalayaGestures';
import { useXimalayaStore } from '../state';
import { TopBar, EmptyState, showToast } from '../components/ui';
import { IcChevronRight, IcCheck } from '../res/icons';

const INTER_TABS = ['全部', '评论', '点赞'] as const;
const VOTE_OPTIONS = ['悬疑推理', '历史人文', '玄幻奇幻', '治愈助眠'];

export function MessageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { bindTap } = useXimalayaGestures();
  const navigate = useNavigate();
  const messages = useXimalayaStore((st) => st.messages);
  const albums = useXimalayaStore((st) => st.albums);
  const tracks = useXimalayaStore((st) => st.tracks);
  const playTrack = useXimalayaStore((st) => st.playTrack);
  const thread = messages.find((m) => m.id === id);
  const [tab, setTab] = useState<string>('全部');
  const [voted, setVoted] = useState<string | null>(null);

  // 互动消息点击跳评论:需要设置专辑上下文
  const srcAlbumId = albums[0]?.id ?? '';
  const srcTrackId = tracks.find((t) => t.albumId === srcAlbumId)?.id ?? '';
  const goComment = () => {
    if (srcAlbumId && srcTrackId) playTrack(srcAlbumId, srcTrackId);
    navigate('/comment');
  };

  if (!thread) {
    return (
      <div className="h-full flex flex-col pt-10 bg-[#F5F5F5]" data-status-bar-foreground="dark">
        <TopBar title="消息" />
        <EmptyState text="消息不存在" />
      </div>
    );
  }

  const isInteractive = thread.kind === 'interactive';
  const isTingjian = thread.kind === 'tingjian';
  const items =
    isInteractive && tab !== '全部'
      ? thread.items.filter((it) => it.title === tab)
      : thread.items;

  return (
    <div className="h-full flex flex-col pt-10 bg-[#F5F5F5]" data-status-bar-foreground="dark">
      <TopBar title={thread.name} />

      {isInteractive && (
        <div className="shrink-0 flex items-center gap-6 px-4 h-11 bg-white border-b border-[#F2F2F2] text-[15px]">
          {INTER_TABS.map((t) => {
            const active = t === tab;
            return (
              <button
                key={t}
                {...bindTap({ kind: 'action', id: 'msgdetail.tab.select.opt' }, { params: { tab: t }, onTrigger: () => setTab(t) })}
                className={active ? 'text-[#333] font-semibold border-b-2 border-[#FE4543] pb-1' : 'text-[#999] pb-1'}
              >
                {t}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex-1 overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
        {isTingjian ? (
          // 听见:投票卡(单选)
          <div className="m-3 bg-white rounded-xl p-4">
            <div className="text-[15px] text-[#333] font-medium mb-3">{thread.items[0]?.body ?? '本周话题投票'}</div>
            <div className="flex flex-col gap-2">
              {VOTE_OPTIONS.map((opt) => {
                const active = voted === opt;
                return (
                  <button
                    key={opt}
                    {...bindTap({ kind: 'action', id: 'msgdetail.vote.select.opt' }, { params: { opt }, onTrigger: () => { setVoted(opt); showToast('投票成功'); } })}
                    className={'flex items-center justify-between px-3 h-11 rounded-lg border text-[14px] ' + (active ? 'border-[#FE4543] bg-[#FFF0EF] text-[#FE4543]' : 'border-[#EEE] text-[#333]')}
                  >
                    <span>{opt}</span>
                    {active && <IcCheck size={18} />}
                  </button>
                );
              })}
            </div>
          </div>
        ) : isInteractive ? (
          // 互动消息:赞/评了你的卡,点跳评论页
          <div className="mt-2">
            {items.length === 0 ? (
              <EmptyState text="暂无内容" />
            ) : (
              items.map((it) => (
                <div
                  key={it.id}
                  {...bindTap({ kind: 'action', id: 'msgdetail.comment-open' }, { onTrigger: goComment })}
                  className="flex items-center gap-3 px-4 py-3 bg-white border-b border-[#F5F5F5] active:bg-[#FAFAFA]"
                >
                  <span className="shrink-0 text-[11px] px-1.5 py-0.5 rounded bg-[#FFF0EF] text-[#FE4543]">{it.title}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] text-[#333] truncate">{it.body}</div>
                  </div>
                  <IcChevronRight size={18} className="text-[#CCC] shrink-0" />
                </div>
              ))
            )}
          </div>
        ) : (
          // 系统通知 / 官方调研 / 主播消息:时间分组通知列表
          <div className="mt-2 flex flex-col gap-3 px-3">
            {thread.items.map((it) => (
              <div key={it.id} className="bg-white rounded-xl p-4">
                <div className="text-[15px] text-[#333] font-medium">{it.title}</div>
                <div className="text-[14px] text-[#666] leading-relaxed mt-2">{it.body}</div>
                {thread.kind === 'survey' && (
                  <button
                    {...bindTap({ kind: 'action', id: 'msgdetail.survey.wontfix' }, { onTrigger: () => showToast('该功能暂未开放') })}
                    className="mt-3 flex items-center gap-1 text-[13px] text-[#FE4543]"
                  >
                    点击填写<IcChevronRight size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
