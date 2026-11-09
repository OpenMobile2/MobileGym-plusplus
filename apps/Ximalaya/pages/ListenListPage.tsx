import React from 'react';
import { useParams } from 'react-router-dom';
import { useXimalayaGestures } from '../hooks/useXimalayaGestures';
import { useXimalayaStrings } from '../hooks/useXimalayaStrings';
import { useXimalayaStore } from '../state';
import { Img, TopBar, EmptyState, formatDuration, formatCount } from '../components/ui';
import { IcPlay, IcHeadphones } from '../res/icons';

export function ListenListPage() {
  const { id } = useParams<{ id: string }>();
  const { bindTap } = useXimalayaGestures();
  const s = useXimalayaStrings();
  const listenLists = useXimalayaStore((st) => st.listenLists);
  const tracks = useXimalayaStore((st) => st.tracks);
  const albums = useXimalayaStore((st) => st.albums);
  const playTrack = useXimalayaStore((st) => st.playTrack);

  const list = listenLists.find((l) => l.id === id);
  if (!list) {
    return (
      <div className="h-full flex flex-col pt-10 bg-[#F5F5F5]" data-status-bar-foreground="dark">
        <TopBar title="听单" />
        <EmptyState text="听单不存在" />
      </div>
    );
  }

  const items = list.trackIds.map((tid) => tracks.find((t) => t.id === tid)).filter(Boolean);
  const first = items[0];

  return (
    <div className="h-full flex flex-col pt-10 bg-[#F5F5F5]" data-status-bar-foreground="dark">
      <TopBar title={list.name} />
      <div className="flex-1 overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
        {/* 听单头 */}
        <div className="bg-white px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="text-[18px] font-semibold text-[#333]">{list.name}</span>
            {list.isPrivate && <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#F0F0F0] text-[#999]">私密</span>}
          </div>
          <div className="text-[12px] text-[#999] mt-1">共 {items.length} 个声音</div>
          {first && (
            <button
              {...bindTap('listenlist.play', { beforeTrigger: () => playTrack(first.albumId, first.id) })}
              className="mt-3 h-9 px-5 rounded-full bg-[#FE4543] text-white text-[14px] font-medium flex items-center gap-1.5 w-fit"
            >
              <IcPlay size={16} />{s.play_all}
            </button>
          )}
        </div>

        {/* 单集列表 */}
        <div className="bg-white mt-2">
          {items.length === 0 ? (
            <EmptyState text={s.empty_list} />
          ) : (
            items.map((t, i) => {
              const album = albums.find((a) => a.id === t!.albumId);
              return (
                <div
                  key={t!.id}
                  {...bindTap('listenlist.play', { beforeTrigger: () => playTrack(t!.albumId, t!.id) })}
                  className="flex items-center gap-3 px-4 py-3 border-b border-[#F5F5F5] active:bg-[#FAFAFA]"
                >
                  <span className="w-5 text-[14px] text-[#999] shrink-0">{i + 1}</span>
                  {album && <Img src={album.cover} className="w-11 h-11 rounded-lg object-cover shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] text-[#333] truncate">{t!.title}</div>
                    <div className="text-[11px] text-[#999] mt-1 flex items-center gap-2">
                      <span className="flex items-center gap-0.5"><IcHeadphones size={11} />{formatCount(t!.playCount)}</span>
                      <span>{formatDuration(t!.durationSec)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
