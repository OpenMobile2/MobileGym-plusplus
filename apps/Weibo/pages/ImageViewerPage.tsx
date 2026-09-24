import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWeiboGestures } from '../hooks/useWeiboGestures';
import { useWeiboStore } from '../state';
import { useStrings, useToast, Img } from '../components/ui';
import { IcBack } from '../res/icons';
import { saveImageToAlbum } from '@/os/albumBridge';
import * as TimeService from '@/os/TimeService';

export default function ImageViewerPage() {
  const s = useStrings();
  const { id = '', idx = '0' } = useParams();
  const { bindTap, bindBack } = useWeiboGestures();
  const [toastNode, toast] = useToast();
  const statuses = useWeiboStore((st) => st.statuses);

  const status = statuses.find((x) => x.id === id);
  const images = status?.images ?? [];
  const [cur, setCur] = useState(Math.min(parseInt(idx, 10) || 0, Math.max(images.length - 1, 0)));
  const dragStart = React.useRef<number | null>(null);

  return (
    <div className="flex flex-col h-full bg-black relative" data-status-bar-foreground="light">
      <div className="flex items-center h-11 px-2 shrink-0 z-10">
        <button {...bindBack()} className="bg-transparent border-none cursor-pointer text-white p-1"><IcBack size={22} /></button>
        <div className="flex-1 text-center text-[14px] text-white">{cur + 1} / {images.length}</div>
        <div className="w-8" />
      </div>
      <div
        className="flex-1 flex items-center justify-center overflow-hidden"
        data-scroll-container="image-viewer"
        data-scroll-direction="horizontal"
        data-action="imageViewer.page.swipe"
        data-action-type="other"
        onPointerDown={(e) => { dragStart.current = e.clientX; e.currentTarget.setPointerCapture(e.pointerId); }}
        onPointerUp={(e) => {
          if (dragStart.current === null) return;
          const dx = e.clientX - dragStart.current;
          if (dx < -50) setCur((c) => Math.min(c + 1, images.length - 1));
          else if (dx > 50) setCur((c) => Math.max(c - 1, 0));
          dragStart.current = null;
        }}
      >
        <Img src={images[cur]} label="图" className="max-w-full max-h-full object-contain" />
      </div>
      <div className="flex items-center justify-end px-4 h-12 shrink-0 z-10">
        <button
          {...bindTap({ kind: 'action', id: 'imageViewer.save.do' }, {
            onTrigger: () => {
              const src = images[cur];
              if (!src) { toast(s.notOpen); return; }
              void saveImageToAlbum(src, {
                album: 'Saved',
                fileName: `weibo_${id}_${cur}_${TimeService.now()}.jpg`,
                mimeType: 'image/jpeg',
              }).then((saved) => toast(saved ? '已保存到系统相册' : s.notOpen));
            },
          })}
          className="text-[13px] text-white bg-white/20 rounded-full px-3 py-1.5 border-none cursor-pointer"
        >
          保存图片
        </button>
      </div>
      {toastNode}
    </div>
  );
}
