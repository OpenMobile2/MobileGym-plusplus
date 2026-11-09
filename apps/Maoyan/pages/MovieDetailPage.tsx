import React from 'react';
import { useParams } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { useMaoyanStore } from '../state';
import { useMaoyanGestures } from '../hooks/useMaoyanGestures';
import { usePanel, useToast, Img, Score, WishCount, Stars, RecoverPage, NOT_OPEN, MY, TopBar } from '../components/ui';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcHeart, IcStar, IcShare, IcLike, IcArrowDown, IcArrowUp, IcEdit, IcArrowRight } from '../res/icons';
import { sharePlainText } from '@/os/shareBridge';
import { saveImageToAlbum } from '@/os/albumBridge';
import * as TimeService from '@/os/TimeService';

/** 电影详情页:海报自适应沉浸主题(anchor_detail_shangbao.jpg;design-tokens §3) */
export default function MovieDetailPage() {
  const { id } = useParams();
  const { bindTap, back } = useMaoyanGestures();
  const s = useAppStrings(strings, stringsEn);
  const [toast, showToast] = useToast();
  const { value: share } = usePanel('share');
  const [expanded, setExpanded] = React.useState(false);
  const [tab, setTab] = React.useState('影评');

  const movie = useMaoyanStore((st) => st.movies.find((m) => m.id === id));
  const reviews = useMaoyanStore((st) => st.reviews);
  const wishMovies = useMaoyanStore((st) => st.wishMovies);
  const watched = useMaoyanStore((st) => st.watched);
  const toggleWishMovie = useMaoyanStore((st) => st.toggleWishMovie);
  const toggleReviewLike = useMaoyanStore((st) => st.toggleReviewLike);
  const recordSynopsisExpanded = useMaoyanStore((st) => st.recordSynopsisExpanded);

  if (!movie) return <RecoverPage title={s.tabMovie} text={s.movieNotFound} />;
  // 分享渠道(品牌色可辨识,与网易云分享面板同构)
  const shareChannels = [
    { key: 'wechat', name: s.shareWechat, icon: '💬', color: '#07C160' },
    { key: 'moments', name: s.shareMoments, icon: '🌈', color: '#4B9EF8' },
    { key: 'qq', name: s.shareQQ, icon: '🐧', color: '#12B7F5' },
    { key: 'save', name: s.shareSaveImage, icon: '⬇', color: '#8A8A8E' },
  ];
  const wished = wishMovies.includes(movie.id);
  const myWatch = watched[movie.id];
  const shareText = myWatch && myWatch.stars > 0
    ? `【${s.merchantName}】《${movie.title}》 我打了${myWatch.stars}分:${myWatch.text}`
    : `【${s.merchantName}】《${movie.title}》 ${movie.genres.join(' ')} ${movie.releaseNote}`;
  const movieReviews = reviews.filter((r) => r.movieId === movie.id);

  return (
    <div className="flex flex-col h-full relative" data-status-bar-foreground="light" style={{ background: movie.themeColor }}>
      {toast}
      <TopBar
        title={<span className="text-white">电影</span>}
        variant="dark"
        bg={movie.themeColor}
        rightContent={(
          <button
            {...bindTap({ kind: 'action', id: 'detail.share.disabled' }, {
              // 系统分享(ACTION_SEND),由 IntentResolver 决定落到哪个 App
              onTrigger: () => {
                const launched = sharePlainText(shareText, {
                  onResult: (r) => { if (r.resultCode === 'OK') showToast(s.shareSuccess); },
                });
                if (!launched) showToast(s.noShareApp);
              },
            })}
            className="bg-transparent border-none cursor-pointer text-white"
          >
            <IcShare size={18} />
          </button>
        )}
      />
      <div className="flex-1 overflow-y-auto" data-scroll-container="detail-scroll" data-scroll-direction="vertical">
        {/* 头部:海报 + 信息 */}
        <div className="flex gap-3 px-4 pt-2 pb-4">
          <Img src={movie.poster} className="w-[96px] h-[128px] object-cover rounded shrink-0" />
          <div className="flex-1 min-w-0 text-white">
            <div className="text-[19px] font-bold">{movie.title}</div>
            <div className="text-[12px] opacity-70 mt-0.5 truncate">{movie.titleEn}</div>
            <div className="text-[12px] opacity-80 mt-2">{movie.genres.join(' ')}</div>
            <div className="text-[12px] opacity-80 mt-1">{movie.releaseNote} {movie.duration}分钟</div>
            <div className="flex gap-2 mt-3">
              <button
                {...bindTap({ kind: 'action', id: 'detail.wish.toggle' }, { onTrigger: () => toggleWishMovie(movie.id) })}
                className={`flex-1 flex items-center justify-center gap-1 h-9 rounded-md text-[13px] border-none cursor-pointer ${wished ? 'bg-app-surface/30 text-white' : 'bg-app-surface/15 text-white'}`}
              >
                <IcHeart size={14} fill={wished ? MY.wishOrange : 'none'} className={wished ? 'text-[#FFA820]' : ''} />
                {wished ? s.wished : s.wish}
              </button>
              <button
                {...bindTap('detail.watched-open', { params: { id: movie.id } })}
                className="flex-1 flex items-center justify-center gap-1 h-9 rounded-md text-[13px] bg-app-surface/15 text-white border-none cursor-pointer"
              >
                <IcStar size={14} fill={myWatch ? MY.scoreOrange : 'none'} className={myWatch ? 'text-[#FFB400]' : ''} />
                {myWatch && myWatch.stars > 0 ? `${s.watched} ${myWatch.stars}分` : s.watched}
              </button>
            </div>
          </div>
        </div>

        {/* 评分卡 */}
        <div className="mx-3 rounded-lg p-3 bg-black/25 text-white flex items-center gap-4">
          {movie.score > 0 ? (
            <>
              <div>
                <div className="text-[11px] opacity-70">{s.score}</div>
                <div className="flex items-end gap-1"><Score value={movie.score} size="l" /><Stars score10={movie.score} /></div>
              </div>
              <div className="border-l border-white/20 pl-4">
                <div className="text-[11px] opacity-70">{s.wishCount}</div>
                <WishCount value={movie.wishCount} />
              </div>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <div>
                <div className="text-[11px] opacity-70">猫眼想看</div>
                <div className="flex items-end gap-1"><WishCount value={movie.wishCount} /><span className="text-[11px] opacity-70">{s.wishCount}</span></div>
              </div>
              {movie.previewScore > 0 && (
                <div className="border-l border-white/20 pl-4">
                  <div className="text-[11px] opacity-70">点映评分</div>
                  <Score value={movie.previewScore} size="l" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* 简介 */}
        <div className="px-4 mt-4 text-white">
          <div className="text-[14px] font-semibold mb-1.5">{s.synopsis}</div>
          <div className={`text-[12px] leading-relaxed opacity-80 ${expanded ? '' : 'line-clamp-3'}`}>{movie.synopsis}</div>
          <button
            {...bindTap({ kind: 'action', id: 'detail.synopsis.toggle' }, { onTrigger: () => setExpanded((v) => { const next = !v; if (next) recordSynopsisExpanded(movie.id); return next; }) })}
            className="mt-1 text-[12px] bg-transparent border-none cursor-pointer text-white/70 flex items-center gap-0.5"
          >
            {expanded ? '收起' : '展开'}{expanded ? <IcArrowUp size={12} /> : <IcArrowDown size={12} />}
          </button>
        </div>

        {/* 演职人员 */}
        <div className="px-4 mt-4 text-white">
          <div className="flex items-center mb-2">
            <span className="text-[14px] font-semibold">{s.castCrew}</span>
            <button
              {...bindTap({ kind: 'action', id: 'detail.cast.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
              className="ml-auto text-[12px] text-white/60 bg-transparent border-none cursor-pointer flex items-center"
            >
              全部{movie.cast.length}人<IcArrowRight size={12} />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto" data-scroll-container="cast-row" data-scroll-direction="horizontal">
            {movie.cast.map((c) => (
              <div key={c.name} className="w-16 shrink-0 text-center">
                <Img src={c.avatar} className="w-16 h-16 object-cover rounded-md" />
                <div className="text-[11px] mt-1 truncate">{c.name}</div>
                <div className="text-[10px] opacity-60 truncate">{c.role}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 白色区:tab + 热评 + 影片资料 */}
        <div className="bg-app-surface rounded-t-2xl mt-4">
          <div className="flex gap-6 px-4 pt-3 border-b border-app-border">
            {['影评', '详细信息', '推荐'].map((t) => (
              <button
                key={t}
                {...bindTap({ kind: 'action', id: 'detail.tab.select.target' }, { params: { target: t }, onTrigger: () => setTab(t) })}
                className={`pb-2 bg-transparent border-none cursor-pointer text-[14px] ${tab === t ? 'text-app-text font-bold border-b-2 border-[#DC4038]' : 'text-app-text-muted'}`}
              >
                {t}{t === '影评' && <sup className="text-[10px] text-(--app-c-text-3)"> {movieReviews.length}</sup>}
              </button>
            ))}
          </div>

          {tab === '影评' && (
            <div className="px-4 py-3">
              <div className="flex items-center mb-2">
                <span className="text-[14px] font-semibold text-app-text">{s.hotReviews}</span>
                {/* 已评过分就是"编辑短评"(点进去是编辑态,标签必须一致) */}
                <button
                  {...bindTap('detail.review.write-open', { params: { id: movie.id } })}
                  className="ml-auto flex items-center gap-1 text-[12px] text-white rounded-full px-3 py-1 border-none cursor-pointer"
                  style={{ background: MY.ctaGradient }}
                >
                  <IcEdit size={12} />{myWatch && myWatch.stars > 0 ? s.editReview : s.writeReview}
                </button>
              </div>
              {movieReviews.length === 0 && (
                <div className="text-[13px] text-(--app-c-text-3) py-6 text-center">暂无短评,快来写第一条吧</div>
              )}
              {movieReviews.slice(0, 3).map((r) => (
                <div key={r.id} className="py-2.5 border-b border-app-border">
                  <div className="flex items-center gap-2">
                    <Img src={r.avatar} className="w-7 h-7 rounded-full object-cover" />
                    <span className="text-[12px] font-medium text-app-text">{r.user}</span>
                    {r.mine && <span className="text-[9px] text-[#DC4038] border border-[#DC4038] rounded px-0.5">我的</span>}
                    <Stars score10={r.stars} />
                  </div>
                  <div className="text-[13px] text-(--app-c-text-2) mt-1.5 leading-relaxed line-clamp-3">{r.text}</div>
                  <div className="flex items-center mt-1.5 text-[11px] text-(--app-c-text-3)">
                    <span>{r.region}</span>
                    <button
                      {...bindTap({ kind: 'action', id: 'detail.review.like.toggle' }, { params: { id: r.id }, onTrigger: () => toggleReviewLike(r.id) })}
                      className="ml-auto flex items-center gap-1 bg-transparent border-none cursor-pointer text-(--app-c-text-3)"
                    >
                      <IcLike size={13} />{r.likes}
                    </button>
                  </div>
                </div>
              ))}
              {movieReviews.length > 0 && (
                <button
                  {...bindTap('detail.reviews-open', { params: { id: movie.id } })}
                  className="w-full py-3 text-[13px] text-[#DC4038] bg-transparent border-none cursor-pointer"
                >
                  查看全部{movieReviews.length}条短评 ›
                </button>
              )}
            </div>
          )}

          {tab === '详细信息' && (
            <div className="px-4 py-3 text-[13px] text-(--app-c-text-2) leading-relaxed">
              <div className="font-semibold mb-1">影片资料</div>
              <div>出品发行:猫眼影业(模拟)</div>
              <div>技术参数:{movie.duration}分钟 / {movie.formats.join(' / ')}</div>
              <div>上映日期:{movie.releaseNote}</div>
            </div>
          )}
          {tab === '推荐' && (
            <div className="px-4 py-3 text-[13px] text-(--app-c-text-3)">喜欢这部影片的人也喜欢:
              <RecommendRow currentId={movie.id} />
            </div>
          )}
        </div>
      </div>

      {/* 底部 CTA */}
      {movie.status === 'hot' || movie.presale ? (
        <button
          {...bindTap('detail.buy-open', { params: { id: movie.id } })}
          className="shrink-0 mx-3 mb-2 h-11 rounded-full text-white text-[16px] font-bold border-none cursor-pointer"
          style={{ background: MY.ctaGradient }}
        >
          {movie.status === 'hot' ? `${s.buyTicketCta}` : `${s.presale}购票`}
        </button>
      ) : null}

      {/* 分享卡弹层(?share=open):发布短评后自动弹出。
          右上角分享已改走系统分享桥(sharePlainText),不再进这里 */}
      {share === 'open' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => back()} />
          <div className="relative bg-app-surface rounded-xl w-[80%] p-4 flex flex-col items-center">
            <div className="text-[14px] font-semibold text-app-text self-start mb-2">{s.shareTo}</div>
            <Img src={movie.poster} className="w-24 h-32 object-cover rounded" />
            <div className="text-[15px] font-bold mt-2 text-app-text">《{movie.title}》</div>
            {myWatch && myWatch.stars > 0 ? (
              <>
                <div className="flex items-center gap-1 mt-1"><Score value={myWatch.stars} size="m" /><span className="text-[13px]" style={{ color: MY.scoreOrange }}>分 棒极了!</span></div>
                <div className="text-[12px] text-app-text-muted mt-1 line-clamp-2">{myWatch.text}</div>
              </>
            ) : (
              <div className="text-[12px] text-app-text-muted mt-1 line-clamp-2">{movie.genres.join(' ')} · {movie.releaseNote}</div>
            )}
            <div className="flex gap-4 mt-4">
              {shareChannels.map((c) => (
                <button
                  key={c.name}
                  {...bindTap({ kind: 'action', id: 'sharecard.channel.share' }, {
                    params: { option: c.key },
                    // 分享=系统分享(ACTION_SEND);保存图片=系统相册(MediaService+ContentResolver)
                    // 两者都不再用"假成功 toast"
                    onTrigger: () => {
                      if (c.key === 'save') {
                        void (async () => {
                          const saved = await saveImageToAlbum(movie.poster, {
                            album: 'Saved',
                            fileName: `maoyan_${movie.id}_${TimeService.now()}.jpg`,
                            mimeType: 'image/jpeg',
                          });
                          showToast(saved ? s.savedToAlbum : s.saveFailed);
                        })();
                        return;
                      }
                      const launched = sharePlainText(shareText, {
                        onResult: (r) => { if (r.resultCode === 'OK') showToast(s.shareSuccess); },
                      });
                      if (!launched) showToast(s.noShareApp);
                    },
                  })}
                  className="text-[11px] text-app-text-muted bg-transparent border-none cursor-pointer flex flex-col items-center gap-1"
                >
                  <span className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[16px]" style={{ background: c.color }}>
                    {c.icon}
                  </span>
                  {c.name}
                </button>
              ))}
            </div>
            <button onClick={() => back()} className="mt-4 text-[13px] text-(--app-c-text-3) bg-transparent border-none cursor-pointer">{s.cancel}</button>
          </div>
        </div>
      )}
    </div>
  );
}

function RecommendRow({ currentId }: { currentId: string }) {
  const movies = useMaoyanStore((st) => st.movies);
  const others = movies.filter((m) => m.id !== currentId).slice(0, 4);
  return (
    <div className="flex gap-2 mt-2">
      {others.map((m) => (
        <div key={m.id} className="w-[72px]">
          <Img src={m.poster} className="w-[72px] h-24 object-cover rounded" />
          <div className="text-[11px] text-(--app-c-text-2) truncate mt-1">{m.title}</div>
        </div>
      ))}
    </div>
  );
}
