// apps/GoogleDrive/pages/PreviewPage.tsx — 文件预览（pdf / image / gdoc / unsupported 四态）
// pdf：白底、连续竖向滚动多页、页间 #ECECF1 间隔（IMG_2275，Q7 确认非分页翻）
// image：纯黑底，顶栏也在黑底上（IMG_2294，与 pdf 白底顶栏是两套视觉）
import React, { useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { GD } from '../res/colors';
import { DIM } from '../res/dimens';
import { PREVIEW_BY_KIND } from '../constants';
import { IcClose, IcMore, IcGemini, IcComment, IcSearch } from '../res/icons';
import { useGoogleDriveGestures } from '../hooks/useGoogleDriveGestures';
import { useGoogleDriveStrings } from '../hooks/useGoogleDriveStrings';
import { useGoogleDriveStore } from '../state';
import { ItemIcon, showToast } from '../components/common';
import { FlowBody, PagedBody } from '../components/PreviewBody';

export const PreviewPage: React.FC = () => {
  const s = useGoogleDriveStrings();
  const { id = '' } = useParams();
  const { bindBack, bindTap } = useGoogleDriveGestures();
  const items = useGoogleDriveStore(st => st.items);
  const trashed = useGoogleDriveStore(st => st.trashedIds);
  const [chromeVisible, setChromeVisible] = useState(true);
  const [imageIndex, setImageIndex] = useState(0);

  // 图片态可左右滑切换：同一目录下的其它图片构成一组
  const imageCount = useMemo(() => {
    const cur = items[id];
    if (!cur) return 1;
    const group = Object.values(items).filter(
      it => it.kind === 'image' && it.parentId === cur.parentId && !trashed.includes(it.id),
    );
    return Math.max(1, group.length);
  }, [items, trashed, id]);

  const item = items[id];
  if (!item) return null;
  const mode = PREVIEW_BY_KIND[item.kind];
  const dark = mode === 'image';

  const TopBar = (
    <div
      className="shrink-0 flex items-center"
      style={{ height: DIM.topBarH, paddingLeft: 4, paddingRight: 4, background: dark ? '#000' : GD.surface }}
    >
      <button {...bindBack()} className="w-11 h-11 flex items-center justify-center" aria-label={s.a11y_close}>
        <IcClose size={22} color={dark ? '#fff' : GD.text} />
      </button>
      <span className="text-[15px] flex-1 truncate mx-1" style={{ color: dark ? '#fff' : GD.text }}>{item.name}</span>
      {mode === 'pdf' && (
        <button
          data-action="googledrive.preview.find.unavailable"
          onClick={() => showToast(s.toast_feature_unavailable)}
          className="w-10 h-10 flex items-center justify-center"
          aria-label={s.a11y_preview_find}
        >
          <IcSearch size={19} color={dark ? '#fff' : GD.text} />
        </button>
      )}
      <button
        data-action="googledrive.preview.comments.unavailable"
        onClick={() => showToast(s.toast_feature_unavailable)}
        className="w-10 h-10 flex items-center justify-center"
        aria-label={s.a11y_preview_comments}
      >
        <IcComment size={19} color={dark ? '#fff' : GD.text} />
      </button>
      <button {...bindTap('googledrive.preview.gemini.open', { params: { ctx: id } })} className="w-10 h-10 flex items-center justify-center" aria-label={s.a11y_gemini}>
        <IcGemini size={19} color={dark ? '#fff' : GD.text} />
      </button>
      <button
        {...bindTap('googledrive.preview.menu.open', { params: { id, item: id } })}
        className="w-10 h-10 flex items-center justify-center"
        aria-label={s.a11y_more}
      >
        <IcMore size={19} color={dark ? '#fff' : GD.text} />
      </button>
    </div>
  );

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: dark ? '#000' : GD.surface }}
      data-status-bar-foreground={dark ? 'light' : 'dark'}
    >
      <div className="pt-10" style={{ background: dark ? '#000' : GD.surface }} />
      {(chromeVisible || !dark) && TopBar}

      {mode === 'pdf' && (
        <div
          className="flex-1 overflow-y-auto"
          data-scroll-container="main"
          data-scroll-direction="vertical"
          style={{ background: GD.previewGap }}
        >
          <PagedBody name={item.name} body={item.preview} />
        </div>
      )}

      {mode === 'image' && (
        <ImageStage
          index={imageIndex}
          onToggleChrome={() => setChromeVisible(v => !v)}
          onPrev={() => setImageIndex(i => (i - 1 + imageCount) % imageCount)}
          onNext={() => setImageIndex(i => (i + 1) % imageCount)}
        />
      )}

      {mode === 'gdoc' && (
        <div className="flex-1 overflow-y-auto bg-white" data-scroll-container="main" data-scroll-direction="vertical">
          <FlowBody name={item.name} body={item.preview} />
        </div>
      )}

      {/*
        不支持的类型：Drive 仍会显示能拿到的内容（比如 .ipynb 的纯文本），
        顶部保留「不支持预览」的提示条 —— 提示与内容并存，而不是只给一个空图标。
      */}
      {mode === 'unsupported' && (
        <div className="flex-1 overflow-y-auto bg-white" data-scroll-container="main" data-scroll-direction="vertical">
          <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: GD.cardBg }}>
            <ItemIcon item={item} size={16} />
            <span className="text-[12px]" style={{ color: GD.textSecondary }}>{s.preview_unsupported}</span>
          </div>
          <FlowBody name={item.name} body={item.preview} />
        </div>
      )}

      {/* 底部「Ask Gemini ×」悬浮 chip：四态都有 */}
      {chromeVisible && <PreviewGeminiChip ctx={id} />}
    </div>
  );
};

/**
 * 图片舞台：点击显隐顶栏，左右滑切换上一张/下一张。
 * 跟手交互一律 PointerEvent（平台规则），不并行维护 touch 与 mouse 两套逻辑。
 */
const ImageStage: React.FC<{
  index: number;
  onToggleChrome: () => void;
  onPrev: () => void;
  onNext: () => void;
}> = ({ index, onToggleChrome, onPrev, onNext }) => {
  const startX = useRef<number | null>(null);
  const moved = useRef(false);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    startX.current = e.clientX;
    moved.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (startX.current !== null && Math.abs(e.clientX - startX.current) > 8) moved.current = true;
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const from = startX.current;
    startX.current = null;
    if (from === null) return;
    const dx = e.clientX - from;
    if (dx < -48) onNext();
    else if (dx > 48) onPrev();
    else if (!moved.current) onToggleChrome();
  };

  const palettes = [
    { a: '#1A73E8', b: '#D93025', label: 'ACL 2026' },
    { a: '#1E8E3E', b: '#F9AB00', label: 'NeurIPS' },
    { a: '#8E5FD9', b: '#1A73E8', label: 'ICML' },
  ];
  const p = palettes[index % palettes.length];

  return (
    <div
      data-action="googledrive.preview.toggleChrome"
      data-swipe-left-action="googledrive.preview.nextImage"
      data-swipe-right-action="googledrive.preview.prevImage"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => { startX.current = null; }}
      className="flex-1 flex items-center justify-center overflow-hidden"
      style={{ touchAction: 'pan-y' }}
    >
      <div className="w-full flex items-center justify-center" style={{ background: '#fff', height: 110 }}>
        <span className="text-[22px] font-bold" style={{ color: p.a }}>{p.label}</span>
        <span className="text-[22px] font-bold ml-2" style={{ color: p.b }}>SAN DIEGO</span>
      </div>
    </div>
  );
};

const PreviewGeminiChip: React.FC<{ ctx: string }> = ({ ctx }) => {
  const s = useGoogleDriveStrings();
  const { bindTap } = useGoogleDriveGestures();
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <div className="absolute left-1/2 -translate-x-1/2 bottom-6 z-[90] flex items-center gap-2 h-10 pl-3 pr-1 rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.28)]">
      <button {...bindTap('googledrive.preview.gemini.open', { params: { ctx } })} className="flex items-center gap-2 h-full">
        <IcGemini size={16} color={GD.blue} />
        <span className="text-[13px]" style={{ color: GD.text }}>{s.menu_ask_gemini}</span>
      </button>
      <button
        data-action="googledrive.selection.dismissGeminiChip"
        onClick={() => setVisible(false)}
        className="w-8 h-8 flex items-center justify-center"
        aria-label={s.a11y_close}
      >
        <IcClose size={14} color={GD.textSecondary} />
      </button>
    </div>
  );
};
