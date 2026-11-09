// 以片找片。节点 findfilm.page(spec:5 条交互)。
// 视觉证据:792(顶栏返回 + 「以片找片」标题;一条灰底提示胶囊;一张卡片栈 —— 上半是自动播放的
// 预览画面(带字幕与静音标),下半是取片源主色的暗卡:小海报 + 片名 + 评分/题材 chip 行 +
// 「年份 品类」+ 演员行 + 简介;卡底三枚圆键 不想看 / 看正片(大) / 想看)。
import React from 'react';
import { useTencentvideoGestures } from '../hooks/useTencentvideoGestures';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import { useTencentvideoStore } from '../state';
import { TV_COLORS as C } from '../constants';
import { TvImg } from '../components/Img';
import { EmptyState, TopBar } from '../components/ui';
import { IcBan, IcHeart, IcMute, IcPause, IcPlay, IcStar } from '../res/icons';

export default function FindfilmPagePage() {
  const { bindTap } = useTencentvideoGestures();
  const s = useTencentvideoStrings();

  const contents = useTencentvideoStore((s) => s.contents);
  const pickFilm = useTencentvideoStore((s) => s.pickFilm);
  const findfilm = useTencentvideoStore((s) => s.findfilm);
  const wantIds = useTencentvideoStore((s) => s.wantIds);
  const findfilmNext = useTencentvideoStore((s) => s.findfilmNext);
  const findfilmWantMark = useTencentvideoStore((s) => s.findfilmWantMark);
  const findfilmPreviewToggle = useTencentvideoStore((s) => s.findfilmPreviewToggle);

  const currentId = pickFilm.queue[findfilm.index % Math.max(1, pickFilm.queue.length)];
  const content = contents.find((c) => c.id === currentId);
  const wanted = currentId ? wantIds.includes(currentId) : false;

  return (
    <div className="flex flex-col h-full" style={{ background: C.pageBg }} data-status-bar-foreground="dark">
      <TopBar title={pickFilm.title} />

      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {/* 玩法提示条(证据 792 顶部灰底胶囊) */}
        <div
          className="mx-3 mt-1 mb-3 h-10 rounded-lg flex items-center justify-center text-[13px]"
          style={{ background: C.chipGray, color: C.textSub }}
        >
          {s.findfilmHint}
        </div>

        {!content ? (
          <EmptyState text={s.findfilmEmpty} />
        ) : (
          <div className="px-3 pb-4">
            {/* 卡片栈:后面露出一角的下一张(证据 792 卡顶的浅色边) */}
            <div className="mx-3 h-2 rounded-t-xl" style={{ background: C.chipGray }} />
            <div className="rounded-xl overflow-hidden" style={{ background: C.darkBg }}>
              {/* 预览画面:点按 = 播放/暂停 */}
              <div
                {...bindTap({ kind: 'action', id: 'findfilm.preview.toggle' }, {
                  onTrigger: findfilmPreviewToggle,
                })}
                className="relative w-full aspect-video cursor-pointer"
              >
                <TvImg
                  id={content.still ?? content.poster}
                  alt={content.title}
                  className="w-full h-full object-cover"
                />
                {content.recommend && (
                  <div className="absolute inset-x-0 bottom-3 text-center text-[15px] font-semibold text-white px-4 truncate">
                    {content.recommend}
                  </div>
                )}
                <span className="absolute bottom-2 right-2 text-white/85">
                  <IcMute size={16} />
                </span>
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/85">
                  {findfilm.previewOn ? <IcPause size={34} /> : <IcPlay size={34} />}
                </span>
              </div>

              {/* 卡身:用片源海报虚化打底 + 黑色压暗,还原真机「取片源主色」的暗卡 */}
              <div className="relative px-3 pt-3 pb-4 overflow-hidden">
                <TvImg
                  id={content.poster}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ filter: 'blur(26px) brightness(0.5)' }}
                />
                <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.55)' }} />
                <div className="relative">
                  <div className="flex gap-3">
                    <TvImg
                      id={content.poster}
                      alt={content.title}
                      className="shrink-0 w-[64px] aspect-[3/4] rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[18px] font-bold text-white truncate">{content.title}</div>
                      <div className="flex items-center gap-1.5 mt-1.5 overflow-hidden">
                        {typeof content.rating === 'number' && Number.isFinite(content.rating) && (
                          <span
                            className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-[3px] rounded text-[11px] leading-none text-white"
                            style={{ background: 'rgba(255,255,255,0.16)' }}
                          >
                            <IcStar size={10} />
                            评分 {content.rating.toFixed(1)}
                          </span>
                        )}
                        {(content.tags ?? []).map((t) => (
                          <span
                            key={t}
                            className="shrink-0 px-1.5 py-[3px] rounded text-[11px] leading-none text-white"
                            style={{ background: 'rgba(255,255,255,0.16)' }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                      <div className="text-[13px] mt-1.5" style={{ color: 'rgba(255,255,255,0.78)' }}>
                        {[content.year, content.category].filter(Boolean).join(' ')}
                      </div>
                      <div
                        className="text-[12px] mt-1 truncate"
                        style={{ color: 'rgba(255,255,255,0.66)' }}
                      >
                        {[content.director, ...(content.cast ?? []).map((p) => p.name)]
                          .filter(Boolean)
                          .join(' ')}
                      </div>
                    </div>
                  </div>
                  {content.desc && (
                    <div
                      className="text-[13px] leading-[20px] mt-3 line-clamp-3"
                      style={{ color: 'rgba(255,255,255,0.78)' }}
                    >
                      简介:{content.desc}
                    </div>
                  )}

                  {/* 三枚圆键:不想看 / 看正片(大) / 想看 */}
                  <div className="flex items-start justify-center gap-10 pt-5">
                    <CircleAction
                      label={pickFilm.buttons[0]}
                      icon={<IcBan size={22} />}
                      bind={bindTap({ kind: 'action', id: 'findfilm.dislike.next' }, {
                        onTrigger: findfilmNext,
                      })}
                    />
                    <CircleAction
                      label={pickFilm.buttons[1]}
                      icon={<IcPlay size={26} />}
                      big
                      bind={bindTap('detail.series.open.fromFindfilm', {
                        params: { contentId: content.id },
                      })}
                    />
                    <CircleAction
                      label={pickFilm.buttons[2]}
                      icon={<IcHeart size={22} />}
                      active={wanted}
                      bind={bindTap({ kind: 'action', id: 'findfilm.want.mark' }, {
                        onTrigger: findfilmWantMark,
                      })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** 卡底圆形动作键:半透明白底圆 + 白色图标 + 下方文案(证据 792) */
function CircleAction({
  label,
  icon,
  bind,
  big = false,
  active = false,
}: {
  label: string;
  icon: React.ReactNode;
  bind: object;
  big?: boolean;
  active?: boolean;
}) {
  return (
    <button
      {...bind}
      className="flex flex-col items-center gap-1.5 bg-transparent border-none p-0"
      style={{ color: '#FFFFFF' }}
    >
      <span
        className="flex items-center justify-center rounded-full"
        style={{
          width: big ? 54 : 46,
          height: big ? 54 : 46,
          background: active ? C.unlockRed : 'rgba(255,255,255,0.18)',
        }}
      >
        {icon}
      </span>
      <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.82)' }}>
        {label}
      </span>
    </button>
  );
}
