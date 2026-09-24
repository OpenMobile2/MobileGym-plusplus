import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useXimalayaGestures } from '../hooks/useXimalayaGestures';
import { TopBar, Sheet, Img, wontfix, formatCount, formatDuration } from '../components/ui';
import { useXimalayaStore } from '../state';
import { IcSparkles, IcShare, IcClose, IcHeadphones } from '../res/icons';

const SHARE_CHANNELS = ['微信', '朋友圈', 'QQ', '微博', '复制链接', '海报'];

export function SoundDetailPage() {
  const { id } = useParams();
  const [sp] = useSearchParams();
  const { bindTap, bindBack } = useXimalayaGestures();
  const tracks = useXimalayaStore((st) => st.tracks);
  const albums = useXimalayaStore((st) => st.albums);

  const track = tracks.find((t) => t.id === id) ?? tracks[0];
  const album = albums.find((a) => a.id === track.albumId) ?? albums[0];
  // 同专辑其它节目(课程连载)
  const seriesTrackIds = album.trackIds ?? [];
  const series = seriesTrackIds.map((tid) => tracks.find((t) => t.id === tid)).filter(Boolean).slice(0, 8);

  const sharePanel = sp.get('panel') === 'share';

  return (
    <div className="h-full flex flex-col pt-10 bg-white" data-status-bar-foreground="dark">
      <TopBar
        title="节目详情"
        right={
          <div className="flex items-center gap-3 pr-1">
            <button
              {...bindTap({ kind: 'action', id: 'sounddetail.ai.wontfix' }, { onTrigger: wontfix })}
              className="flex items-center gap-0.5 text-[13px] text-[#7A5B2E]"
              aria-label="AI摘要"
            ><IcSparkles size={16} />摘要</button>
            <button {...bindTap('sound.share-open', { params: { id: track.id } })} aria-label="分享" className="text-[#333]">
              <IcShare size={20} />
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
        {/* 头部信息 */}
        <div className="flex gap-3 px-4 pt-3">
          <Img src={album.cover} className="w-16 h-16 rounded-lg object-cover shrink-0" />
          <div className="min-w-0 flex flex-col justify-center">
            <div className="text-[16px] font-semibold text-[#333] leading-snug line-clamp-2">{track.title}</div>
            <div className="text-[12px] text-[#999] mt-1 flex items-center gap-2">
              <span className="truncate">{album.anchorName}</span>
              <span className="flex items-center gap-0.5"><IcHeadphones size={11} />{formatCount(track.playCount)}</span>
              <span>{formatDuration(track.durationSec)}</span>
            </div>
          </div>
        </div>

        {/* 节目详情正文 = AI 文稿 */}
        <div className="px-4 mt-4">
          <div className="text-[15px] font-semibold text-[#333] mb-2">节目详情</div>
          <p className="text-[14px] text-[#444] leading-7 whitespace-pre-wrap">{track.transcript}</p>
        </div>

        {/* 课程连载 */}
        {series.length > 0 && (
          <div className="px-4 mt-6 mb-6">
            <div className="text-[15px] font-semibold text-[#333] mb-2">课程连载</div>
            <div className="flex flex-col divide-y divide-[#F2F2F2]">
              {series.map((t) => (
                <div key={t!.id} className={'py-2.5 flex items-center justify-between ' + (t!.id === track.id ? 'text-[#FE4543]' : 'text-[#333]')}>
                  <span className="text-[14px] truncate flex-1 min-w-0">{t!.title}</span>
                  <span className="text-[12px] text-[#999] ml-2">{formatDuration(t!.durationSec)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 分享面板 */}
      {sharePanel && (
        <Sheet
          title="分享"
          onCloseNode={
            <button {...bindBack()} className="absolute right-3 text-[#999]" aria-label="关闭"><IcClose size={20} /></button>
          }
        >
          <div className="grid grid-cols-4 gap-y-5 p-5">
            {SHARE_CHANNELS.map((c) => (
              <button
                key={c}
                {...bindTap({ kind: 'action', id: 'share.thirdparty.wontfix2' }, { onTrigger: wontfix })}
                className="flex flex-col items-center gap-1.5 text-[12px] text-[#333]"
              >
                <span className="w-11 h-11 rounded-full bg-[#F2F2F2] flex items-center justify-center text-[#999]"><IcShare size={20} /></span>
                {c}
              </button>
            ))}
          </div>
        </Sheet>
      )}
    </div>
  );
}
