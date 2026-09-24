import React, { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import * as TimeService from '@/os/TimeService';
import { useXimalayaGestures } from '../hooks/useXimalayaGestures';
import { useXimalayaStrings } from '../hooks/useXimalayaStrings';
import { useXimalayaStore } from '../state';
import { Img, VipTag, Sheet, EmptyState, TopBar, formatCount, formatDuration, showToast, wontfix } from '../components/ui';
import {
  IcNavBack, IcShare, IcMore, IcSort, IcSearch, IcDownload, IcHeadphones, IcTicket,
  IcRss, IcCheck, IcChevronRight, IcComment, IcClose, IcGift, IcForward15, IcCopyright,
} from '../res/icons';

const DL_QUALITIES = ['标准', '高清', '超高清'];

function trackDate(ts: number): string {
  const d = TimeService.fromTimestamp(ts);
  return `${d.getMonth() + 1}-${d.getDate()}`;
}

export function AlbumPage() {
  const { id } = useParams<{ id: string }>();
  const [sp] = useSearchParams();
  const panel = sp.get('panel');
  const { bindTap, bindBack, back } = useXimalayaGestures();
  const s = useXimalayaStrings();

  const albums = useXimalayaStore((st) => st.albums);
  const tracks = useXimalayaStore((st) => st.tracks);
  const anchors = useXimalayaStore((st) => st.anchors);
  const comments = useXimalayaStore((st) => st.comments);
  const subscribedAlbumIds = useXimalayaStore((st) => st.subscribedAlbumIds);
  const toggleSubscribe = useXimalayaStore((st) => st.toggleSubscribe);
  const playTrack = useXimalayaStore((st) => st.playTrack);

  const [tab, setTab] = useState<'episodes' | 'reviews'>('episodes');
  const [asc, setAsc] = useState(true);
  const [introOpen, setIntroOpen] = useState(false);
  const [menuTrackId, setMenuTrackId] = useState<string | null>(null);

  const album = albums.find((a) => a.id === id);

  if (!album) {
    return (
      <div className="h-full flex flex-col pt-10 bg-white" data-status-bar-foreground="dark">
        <TopBar title="专辑详情" />
        <div className="flex-1 overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
          <EmptyState text={s.empty_list} />
        </div>
      </div>
    );
  }

  const subscribed = subscribedAlbumIds.includes(album.id);
  const anchor = anchors.find((a) => a.id === album.anchorId);
  const albumComments = comments.filter((c) => c.albumId === album.id);
  const firstTrackId = album.trackIds[0];

  const ordered = album.trackIds
    .map((tid) => tracks.find((t) => t.id === tid))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));
  const episodeList = asc ? ordered : [...ordered].reverse();
  const menuTrack = menuTrackId ? tracks.find((t) => t.id === menuTrackId) : null;

  return (
    <div className="h-full flex flex-col pt-10" style={{ background: album.themeColor }} data-status-bar-foreground="light">
      {/* 顶栏:返回/分享/更多 */}
      <div className="shrink-0 h-11 flex items-center px-1 text-white">
        <button {...bindBack()} aria-label="返回" className="w-9 h-9 flex items-center justify-center">
          <IcNavBack size={26} />
        </button>
        <div className="flex-1 truncate text-[15px] font-medium px-1">{album.title}</div>
        <button {...bindTap('album.share-open', { params: { id: album.id } })} aria-label="分享" className="w-9 h-9 flex items-center justify-center">
          <IcShare size={20} />
        </button>
        <button {...bindTap('album.moremenu-open', { params: { id: album.id } })} aria-label="更多" className="w-9 h-9 flex items-center justify-center">
          <IcMore size={22} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
        {/* 封面/标题/主播 */}
        <div className="px-4 pb-4 text-white" style={{ background: album.themeColor }}>
          <div className="flex gap-3">
            <Img src={album.cover} className="w-24 h-24 rounded-xl object-cover shrink-0" />
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="text-[17px] font-semibold leading-snug line-clamp-2">{album.title}</div>
              <div className="mt-1 flex items-center gap-1 flex-wrap">
                {album.isVip && <VipTag />}
                {album.finished ? (
                  <span className="text-[11px] opacity-90">完结</span>
                ) : (
                  <span className="text-[11px] opacity-90">连载中</span>
                )}
              </div>
              <button
                {...bindTap('album.anchor-open', { params: { id: album.anchorId } })}
                className="mt-auto flex items-center gap-1 text-[13px] opacity-95"
              >
                <IcRss size={14} />
                <span className="truncate">{album.anchorName}</span>
                <IcChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* 统计:月票/播放量/集数 */}
          <div className="mt-3 flex items-center gap-5 text-white/95">
            <div className="flex flex-col">
              <span className="text-[15px] font-semibold flex items-center gap-1"><IcTicket size={14} />{formatCount(album.monthlyTicket)}</span>
              <span className="text-[11px] opacity-80">月票</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] font-semibold flex items-center gap-1"><IcHeadphones size={14} />{formatCount(album.playCount)}</span>
              <span className="text-[11px] opacity-80">播放量</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] font-semibold">{album.trackCount}</span>
              <span className="text-[11px] opacity-80">集数</span>
            </div>
          </div>

          {/* 标签 + 简介 */}
          {album.tags.length > 0 && (
            <div className="mt-3 flex items-center gap-1.5 flex-wrap">
              {album.tags.map((t) => (
                <span key={t} className="text-[11px] px-1.5 py-0.5 rounded bg-white/20">{t}</span>
              ))}
            </div>
          )}
          <button onClick={() => setIntroOpen((v) => !v)} className="mt-2 text-left text-[12px] leading-relaxed opacity-90 w-full">
            <span className={introOpen ? '' : 'line-clamp-1'}>{album.intro}</span>
            <span className="opacity-70">{introOpen ? ' 收起' : ' 更多'}</span>
          </button>
        </div>

        {/* 白色内容区 */}
        <div className="bg-white rounded-t-2xl min-h-[320px] pb-6">
          {/* Tab:节目列表/评价/找相似/橱窗 */}
          <div className="flex items-center gap-5 px-4 h-11 border-b border-[#F2F2F2] text-[14px] text-[#666]">
            <button
              {...bindTap({ kind: 'action', id: 'album.tab.select.opt' }, { params: { tab: 'episodes' }, onTrigger: () => setTab('episodes') })}
              className={tab === 'episodes' ? 'text-[#333] font-semibold' : ''}
            >节目列表</button>
            <button
              {...bindTap({ kind: 'action', id: 'album.tab.select.opt' }, { params: { tab: 'reviews' }, onTrigger: () => setTab('reviews') })}
              className={tab === 'reviews' ? 'text-[#333] font-semibold' : ''}
            >评价</button>
            <button {...bindTap('album.similar-open', { params: { id: album.id } })}>找相似</button>
            <button {...bindTap({ kind: 'action', id: 'album.showcase.wontfix' }, { onTrigger: wontfix })}>橱窗</button>
          </div>

          {tab === 'episodes' ? (
            <>
              {/* 正倒序 / 搜索 / 下载 */}
              <div className="flex items-center justify-between px-4 h-10 text-[13px] text-[#666]">
                <button
                  {...bindTap({ kind: 'action', id: 'album.sort.toggle' }, { onTrigger: () => setAsc((v) => !v) })}
                  className="flex items-center gap-1"
                >
                  <IcSort size={15} />{asc ? '正序' : '倒序'}
                  <span className="text-[#999]">共{album.trackCount}集</span>
                </button>
                <div className="flex items-center gap-4">
                  <button {...bindTap({ kind: 'action', id: 'album.listsearch.wontfix' }, { onTrigger: wontfix })} aria-label="搜索"><IcSearch size={17} /></button>
                  <button {...bindTap('album.download-open', { params: { id: album.id } })} aria-label="下载"><IcDownload size={17} /></button>
                </div>
              </div>

              <div>
                {episodeList.map((t, i) => (
                  <div
                    key={t.id}
                    {...bindTap('album.player-open', { beforeTrigger: () => playTrack(album.id, t.id) })}
                    className="flex items-center gap-3 px-4 py-2.5 active:bg-[#F7F7F7]"
                  >
                    <span className="w-5 text-[13px] text-[#BBB] shrink-0">{asc ? i + 1 : ordered.length - i}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] text-[#333] truncate">{t.title}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[#999]">
                        <span className="flex items-center gap-0.5"><IcHeadphones size={11} />{formatCount(t.playCount)}</span>
                        <span>{formatDuration(t.durationSec)}</span>
                        <span>{trackDate(t.updatedAt)}</span>
                        {t.isVip && <VipTag />}
                      </div>
                    </div>
                    <button
                      {...bindTap('album.itemmenu-open', {
                        params: { id: album.id },
                        stopPropagation: true,
                        beforeTrigger: () => setMenuTrackId(t.id),
                      })}
                      aria-label="更多"
                      className="w-8 h-8 flex items-center justify-center text-[#999] shrink-0"
                    >
                      <IcMore size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="px-4 pt-3">
              {/* 推荐值 */}
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-[26px] font-bold text-[#FE4543]">{album.recommendPct ?? 95}%</span>
                <span className="text-[13px] text-[#999]">好评推荐</span>
              </div>
              {albumComments.length === 0 ? (
                <EmptyState text="还没有评价" />
              ) : (
                <div className="flex flex-col gap-4">
                  {albumComments.map((c) => (
                    <div key={c.id} className="flex gap-2.5">
                      <Img src={c.avatar} className="w-8 h-8 rounded-full object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] text-[#999]">{c.userName}</div>
                        <div className="text-[14px] text-[#333] leading-relaxed mt-0.5">{c.content}</div>
                        <div className="mt-1 flex items-center gap-3 text-[11px] text-[#BBB]">
                          <span>{c.region}</span>
                          <span className="flex items-center gap-0.5"><IcCheck size={11} />{formatCount(c.likeCount)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 底部:订阅 / 开始播放 */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-2.5 bg-white border-t border-[#F2F2F2]">
        <button
          {...bindTap({ kind: 'action', id: 'album.subscribe.toggle' }, { onTrigger: () => toggleSubscribe(album.id) })}
          className={
            'h-10 px-5 rounded-full text-[14px] font-medium flex items-center gap-1 ' +
            (subscribed ? 'bg-[#F2F2F2] text-[#999]' : 'bg-[#FFF0EF] text-[#FE4543]')
          }
        >
          {subscribed ? <IcCheck size={16} /> : null}
          {subscribed ? s.subscribed : s.subscribe}
        </button>
        <button
          {...bindTap('album.player-open', { beforeTrigger: () => firstTrackId && playTrack(album.id, firstTrackId) })}
          className="flex-1 h-10 rounded-full bg-[#FE4543] text-white text-[15px] font-medium flex items-center justify-center gap-1"
        >
          <IcHeadphones size={18} />开始播放
        </button>
      </div>

      {/* 下载音质弹层 */}
      {panel === 'downloadquality' && (
        <Sheet title="选择下载音质" onCloseNode={<button {...bindBack()} className="absolute right-3 text-[#999]"><IcClose size={18} /></button>}>
          <div className="pb-4">
            {DL_QUALITIES.map((q) => (
              <button
                key={q}
                {...bindTap(
                  { kind: 'action', id: 'dlquality.select2.select.opt' },
                  { params: { q }, onTrigger: () => { showToast(s.added_to_download); back(); } },
                )}
                className="w-full h-12 px-5 flex items-center justify-between text-[15px] text-[#333] border-b border-[#F7F7F7]"
              >
                {q}
                <IcDownload size={16} className="text-[#999]" />
              </button>
            ))}
          </div>
        </Sheet>
      )}

      {/* 分享面板 */}
      {panel === 'share' && (
        <Sheet title={s.share} onCloseNode={<button {...bindBack()} className="absolute right-3 text-[#999]"><IcClose size={18} /></button>}>
          <div className="p-5 flex gap-6">
            {['微信', '朋友圈', '微博', '复制链接'].map((label) => (
              <button
                key={label}
                {...bindTap({ kind: 'action', id: 'share.thirdparty.wontfix3' }, { onTrigger: wontfix })}
                className="flex flex-col items-center gap-1.5 text-[12px] text-[#666]"
              >
                <span className="w-11 h-11 rounded-full bg-[#F2F2F2] flex items-center justify-center text-[#999]"><IcShare size={20} /></span>
                {label}
              </button>
            ))}
          </div>
        </Sheet>
      )}

      {/* 节目项…菜单 */}
      {panel === 'itemmenu' && (
        <Sheet title={menuTrack?.title ?? '节目'} onCloseNode={<button {...bindBack()} className="absolute right-3 text-[#999]"><IcClose size={18} /></button>}>
          <div className="pb-4">
            <button {...bindTap('player.comment-open')} className="w-full h-12 px-5 flex items-center gap-3 text-[15px] text-[#333]">
              <IcComment size={18} className="text-[#999]" />去评价
            </button>
            <button onClick={wontfix} className="w-full h-12 px-5 flex items-center gap-3 text-[15px] text-[#333]">
              <IcSort size={18} className="text-[#999]" />置顶
            </button>
            <button {...bindTap('album.similar-open', { params: { id: album.id } })} className="w-full h-12 px-5 flex items-center gap-3 text-[15px] text-[#333]">
              <IcSearch size={18} className="text-[#999]" />找相似
            </button>
            <button {...bindTap('album.share-open', { params: { id: album.id } })} className="w-full h-12 px-5 flex items-center gap-3 text-[15px] text-[#333]">
              <IcShare size={18} className="text-[#999]" />分享
            </button>
            <button
              {...bindTap({ kind: 'action', id: 'album.subscribe.toggle' }, { onTrigger: () => { toggleSubscribe(album.id); back(); } })}
              className="w-full h-12 px-5 flex items-center gap-3 text-[15px] text-[#333]"
            >
              <IcCheck size={18} className="text-[#999]" />{subscribed ? '取消订阅' : s.subscribe}
            </button>
          </div>
        </Sheet>
      )}

      {/* 顶栏更多菜单 */}
      {panel === 'moremenu' && (
        <Sheet title="更多" onCloseNode={<button {...bindBack()} className="absolute right-3 text-[#999]"><IcClose size={18} /></button>}>
          <div className="pb-4">
            <button {...bindTap('album.similar-open', { params: { id: album.id } })} className="w-full h-12 px-5 flex items-center gap-3 text-[15px] text-[#333]">
              <IcSearch size={18} className="text-[#999]" />找相似
            </button>
            <button
              {...bindTap({ kind: 'action', id: 'album.more.gift.wontfix' }, { onTrigger: wontfix })}
              className="w-full h-12 px-5 flex items-center gap-3 text-[15px] text-[#333]"
            >
              <IcGift size={18} className="text-[#999]" />赠送亲友
            </button>
            <button
              {...bindTap({ kind: 'action', id: 'album.more.skiphead.wontfix' }, { onTrigger: wontfix })}
              className="w-full h-12 px-5 flex items-center gap-3 text-[15px] text-[#333]"
            >
              <IcForward15 size={18} className="text-[#999]" />跳过头尾
            </button>
            <button
              {...bindTap({ kind: 'action', id: 'album.more.copyright.wontfix' }, { onTrigger: wontfix })}
              className="w-full h-12 px-5 flex items-center gap-3 text-[15px] text-[#333]"
            >
              <IcCopyright size={18} className="text-[#999]" />版权申诉
            </button>
          </div>
        </Sheet>
      )}
    </div>
  );
}
