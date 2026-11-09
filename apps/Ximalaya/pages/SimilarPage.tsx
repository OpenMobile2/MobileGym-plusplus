import React from 'react';
import { useParams } from 'react-router-dom';
import { useXimalayaGestures } from '../hooks/useXimalayaGestures';
import { useXimalayaStore } from '../state';
import { Img, TopBar, VipTag, formatCount } from '../components/ui';
import { IcHeadphones } from '../res/icons';

export function SimilarPage() {
  const { bindTap } = useXimalayaGestures();
  const { id } = useParams<{ id: string }>();
  const albums = useXimalayaStore((st) => st.albums);

  const source = albums.find((a) => a.id === id);
  // 相似推荐:同品类优先,其余其次,排除自身(合成推荐流)
  const similar = albums
    .filter((a) => a.id !== id)
    .sort((a, b) => {
      const sa = source && a.category === source.category ? 0 : 1;
      const sb = source && b.category === source.category ? 0 : 1;
      return sa - sb;
    });

  return (
    <div className="h-full flex flex-col pt-10 bg-[#F5F5F5]" data-status-bar-foreground="dark">
      <TopBar title="找相似" />
      <div className="flex-1 overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
        {/* 来源专辑信息条 */}
        {source && (
          <div className="mx-3 mt-3 bg-white rounded-xl p-2.5 flex items-center gap-3">
            <Img src={source.cover} className="w-12 h-12 rounded-lg object-cover shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-[#999]">与该专辑相似</div>
              <div className="text-[14px] text-[#333] font-medium truncate">{source.title}</div>
            </div>
          </div>
        )}

        {/* 相似推荐网格 */}
        <div className="px-3 mt-4 mb-4">
          <div className="text-[15px] font-semibold text-[#333] mb-2">相似推荐</div>
          <div className="grid grid-cols-3 gap-3">
            {similar.map((a) => (
              <div
                key={a.id}
                {...bindTap('similar.album-open', { params: { id: a.id } })}
                className="flex flex-col"
              >
                <div className="relative">
                  <Img src={a.cover} className="w-full aspect-square rounded-lg object-cover" />
                  {a.isVip && <span className="absolute left-1 top-1"><VipTag /></span>}
                </div>
                <div className="mt-1 text-[12px] text-[#333] leading-snug line-clamp-2">{a.title}</div>
                <div className="mt-0.5 flex items-center gap-0.5 text-[11px] text-[#999]">
                  <IcHeadphones size={11} />
                  {formatCount(a.playCount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
