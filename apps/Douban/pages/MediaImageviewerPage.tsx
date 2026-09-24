// 全屏图片查看器(media.imageViewer,frame:f60ef9@t0023,IMG_0472 对齐):黑底大图 +
// 左上 ✕ 关闭 / 右上 ⋯ + 「n / N」页码胶囊 + 底部文案(2 行截断 …全文)+ 💬/👍/🔁/🔖/🎁 装饰行。
// 左右横滑切换(PointerEvent)+ 单击关闭;长按通过系统相册能力保存图片。
// 载荷经模块级 setter 传入(transition search 声明为空,无法带 query;易失可接受,刷新即重启)。
import React, { useRef, useState } from 'react';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { Img } from '../components/ui';
import { saveImageToAlbumWithSystem } from '../capabilities';

export interface ImageViewerPayload {
  images: string[];
  index: number;
  /** 底部装饰:来源内容的赞/回复数 */
  likeCount?: number;
  replyCount?: number;
  /** 底部文案(来源内容摘要,缺省用占位文案) */
  caption?: string;
}

const DEFAULT_PAYLOAD: ImageViewerPayload = {
  images: ['/@app-assets/Douban/images/bc_photo1.svg'],
  index: 0,
};

/** 缺省底部文案(虚构占位,来源页未传 caption 时展示) */
const FALLBACK_CAPTION =
  '这一段的光影氛围太好了,随手截了几张,每一帧都像剧照,导演的镜头语言真的在线,忍不住反复回看';

let pendingPayload: ImageViewerPayload | null = null;

/** 来源页在 beforeTrigger 里调用,随后 transition 落地本页读取。 */
export function setImageViewerPayload(payload: ImageViewerPayload) {
  pendingPayload = payload;
}

export default function MediaImageviewerPage() {
  const { bindTap, bindLongPress, bindDoubleTap, bindBack, back } = useDoubanGestures();
  const toast = useDoubanStore((s) => s.toast);
  const payloadRef = useRef<ImageViewerPayload | null>(null);
  if (payloadRef.current === null) {
    payloadRef.current = pendingPayload ?? DEFAULT_PAYLOAD;
    pendingPayload = null;
  }
  const { images, likeCount, replyCount, caption } = payloadRef.current;
  const [index, setIndex] = useState(() =>
    Math.min(Math.max(payloadRef.current?.index ?? 0, 0), Math.max(images.length - 1, 0)),
  );
  const [dragX, setDragX] = useState(0);
  const dragRef = useRef<{ startX: number; dragging: boolean; moved: boolean }>({
    startX: 0,
    dragging: false,
    moved: false,
  });

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = { startX: e.clientX, dragging: true, moved: false };
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.dragging) return;
    const dx = e.clientX - dragRef.current.startX;
    if (Math.abs(dx) > 8) dragRef.current.moved = true;
    setDragX(dx);
  };
  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.dragging) return;
    const dx = e.clientX - dragRef.current.startX;
    dragRef.current.dragging = false;
    setDragX(0);
    if (dx < -50 && index < images.length - 1) setIndex(index + 1);
    else if (dx > 50 && index > 0) setIndex(index - 1);
  };
  const swiped = () => dragRef.current.moved;
  /** 底部 🔖 收藏数装饰(载荷无该字段,按赞数确定性推导) */
  const markCount = Math.max(1, Math.floor((likeCount ?? 16) / 2));

  return (
    <div
      {...bindTap({ kind: 'action', id: 'media.viewer.dismiss' }, {
        onTrigger: () => {
          if (!swiped()) back();
        },
      })}
      className="flex flex-col h-full relative select-none"
      style={{ background: '#000' }}
      data-status-bar-foreground="light"
      data-navigation-bar-foreground="light"
    >
      {/* 顶栏:✕ 关闭(左)+ ⋯(右,装饰) */}
      <div className="absolute top-10 left-0 right-0 z-10 flex items-center justify-between px-3">
        <button
          {...bindBack({ stopPropagation: true })}
          className="w-10 h-10 flex items-center justify-center bg-transparent border-none cursor-pointer text-white"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M5 5l14 14M19 5L5 19" />
          </svg>
        </button>
        <span className="w-10 h-10 flex items-center justify-center text-white text-xl tracking-widest" onClick={(e) => e.stopPropagation()}>
          ⋯
        </span>
      </div>

      {/* 页码胶囊 n / N(右上区) */}
      <div className="absolute top-[88px] right-4 z-10 pointer-events-none">
        <span className="px-3 py-1 rounded-md text-[13px] text-white/90" style={{ background: 'rgba(60,60,60,0.7)' }}>
          {index + 1} / {images.length}
        </span>
      </div>

      {/* 横滑图片区(spec: media.viewer.swipe swipe-horizontal) */}
      <div
        className="flex-1 overflow-hidden touch-none"
        data-action="media.viewer.swipe"
        data-action-type="swipe-horizontal"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div
          className="flex h-full"
          style={{
            width: `${images.length * 100}%`,
            transform: `translateX(calc(-${index * (100 / images.length)}% + ${dragX}px))`,
            transition: dragRef.current.dragging ? 'none' : 'transform 0.25s ease-out',
          }}
        >
          {images.map((src, i) => (
            <div
              key={i}
              {...bindLongPress({ kind: 'action', id: 'media.viewer.save.wontfix' }, {
                onTrigger: () => {
                  const launched = saveImageToAlbumWithSystem(src, (result) => {
                    if (result.resultCode === 'OK') toast('图片已保存到相册');
                  });
                  if (!launched) toast('无法打开系统相册');
                },
              })}
              className="h-full flex items-center justify-center"
              style={{ width: `${100 / images.length}%` }}
            >
              <div
                {...bindDoubleTap({ kind: 'action', id: 'media.viewer.zoom.wontfix' }, {
                  onTrigger: () => toast('该功能暂未开放'),
                  onSingleTap: () => {
                    if (!swiped()) back();
                  },
                  stopPropagation: true,
                })}
                className="max-w-full max-h-full"
              >
                <Img src={src} className="max-w-full max-h-[70vh] object-contain" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 底部:文案 + 💬/👍/🔁/🔖/🎁 装饰行(非导航) */}
      <div className="shrink-0 px-5 pb-5 pt-2" onClick={(e) => e.stopPropagation()}>
        {(() => {
          const text = caption ?? FALLBACK_CAPTION;
          // 仅当文案够长会被截断时,才在第二行末追加灰色「…全文」
          const truncated = text.length > 32;
          return (
            <div className="text-[15px] leading-relaxed text-white line-clamp-2">
              {text}
              {truncated && <span className="text-white/50">…全文</span>}
            </div>
          );
        })()}
        <div className="mt-4 flex items-center justify-between text-white/85 text-sm">
          <span className="flex items-center gap-1.5">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
            </svg>
            {replyCount ?? 0}
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M7 10v12M15 5.88L14 10h5.83a2 2 0 011.92 2.56l-2.33 8A2 2 0 0117.5 22H4a2 2 0 01-2-2v-8a2 2 0 012-2h2.76a2 2 0 001.79-1.11L12 2h0a3.13 3.13 0 013 3.88z" />
            </svg>
            {likeCount ?? 0}
          </span>
          <span className="flex items-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 1l4 4-4 4" />
              <path d="M3 11V9a4 4 0 014-4h14" />
              <path d="M7 23l-4-4 4-4" />
              <path d="M21 13v2a4 4 0 01-4 4H3" />
            </svg>
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
            </svg>
            {markCount}
          </span>
          <span className="flex items-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
              <rect x="3" y="8" width="18" height="4" rx="1" />
              <path d="M12 8v13M5 12v9h14v-9" />
              <path d="M7.5 8a2.5 2.5 0 010-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 010 5" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}
