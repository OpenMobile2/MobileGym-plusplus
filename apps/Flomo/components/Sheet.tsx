import React from 'react';
import * as TimeService from '@/os/TimeService';
import { useFlomoGestures } from '../hooks/useFlomoGestures';
import { useFlomoStore } from '../state';
import { C } from './ui';

/** 底部弹出菜单/面板:暗背景点击关闭(bindBack),内容贴底。 */
export function Sheet({ title, children }: { title?: React.ReactNode; children: React.ReactNode }) {
  const { bindBack } = useFlomoGestures();
  return (
    <div className="absolute inset-0 flex flex-col justify-end" data-status-bar-foreground="light">
      <div {...bindBack()} className="flex-1" style={{ background: 'rgba(0,0,0,0.35)' }} />
      <div className="rounded-t-2xl pb-7 pt-1" style={{ background: C.surface }}>
        {title && (
          <div className="text-center py-2.5 text-xs" style={{ color: C.sub }}>
            {title}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function Row({
  icon,
  label,
  danger,
  bind,
}: {
  icon?: React.ReactNode;
  label: string;
  danger?: boolean;
  bind: object;
}) {
  return (
    <button
      {...bind}
      className="w-full flex items-center gap-3 px-5 h-12 bg-transparent border-none cursor-pointer text-left"
      style={{ color: danger ? '#E5484D' : C.text, fontSize: 15 }}
    >
      {icon && <span className="w-5 flex justify-center" style={{ color: danger ? '#E5484D' : C.sub }}>{icon}</span>}
      {label}
    </button>
  );
}

/** 顶部图标行(分享/编辑/复制 这类横排图标)。 */
export function IconRow({ items }: { items: { icon: React.ReactNode; label: string; bind: object }[] }) {
  return (
    <div className="flex px-2 pt-2 pb-1">
      {items.map((it, i) => (
        <button
          key={i}
          {...it.bind}
          className="flex-1 flex flex-col items-center gap-1 py-2 bg-transparent border-none cursor-pointer"
          style={{ color: C.text, fontSize: 12 }}
        >
          <span style={{ color: C.text }}>{it.icon}</span>
          {it.label}
        </button>
      ))}
    </div>
  );
}

/** 删除撤销黑条:显示「已删除笔记 / 撤销」,4.5s 自动消失(spec P0:删除无二次确认,靠撤销反悔)。 */
export function UndoBar() {
  const { bindTap } = useFlomoGestures();
  const lastDeleted = useFlomoStore((s) => s.lastDeleted);
  const undoDelete = useFlomoStore((s) => s.undoDelete);
  React.useEffect(() => {
    if (!lastDeleted) return;
    const start = TimeService.realNow();
    const id = window.setInterval(() => {
      if (TimeService.realNow() - start > 4500) {
        (useFlomoStore as unknown as { setState: (p: object) => void }).setState({ lastDeleted: null });
        window.clearInterval(id);
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [lastDeleted]);
  if (!lastDeleted) return null;
  const n = lastDeleted.length;
  return (
    <div
      className="absolute left-3 right-3 bottom-6 h-12 rounded-xl flex items-center px-4 z-50"
      style={{ background: 'rgba(20,20,20,0.92)' }}
    >
      <span className="flex-1 text-white text-sm">{n > 1 ? `已删除 ${n} 条笔记` : '已删除笔记'}</span>
      <button
        {...bindTap({ kind: 'action', id: 'home.feed.deleteUndo.do' }, { onTrigger: () => undoDelete() })}
        className="bg-transparent border-none cursor-pointer font-medium"
        style={{ color: '#5BD494', fontSize: 14 }}
      >
        撤销
      </button>
    </div>
  );
}

/** 图片全屏预览(点图片打开,点任意处关闭)。 */
export function ImageLightbox() {
  const { bindTap } = useFlomoGestures();
  const src = useFlomoStore((s) => s.previewImage);
  const setPreviewImage = useFlomoStore((s) => s.setPreviewImage);
  if (!src) return null;
  return (
    <div
      {...bindTap({ kind: 'action', id: 'home.feed.imagePreview.close' }, { onTrigger: () => setPreviewImage(null) })}
      className="absolute inset-0 z-50 flex items-center justify-center cursor-pointer"
      style={{ background: 'rgba(0,0,0,0.92)' }}
    >
      <img src={src} alt="" className="max-w-full max-h-full object-contain" />
    </div>
  );
}

/** 全局 toast:读 lastToast,1.8s 自动消失。 */
export function Toast() {
  const lastToast = useFlomoStore((s) => s.lastToast);
  React.useEffect(() => {
    if (!lastToast) return;
    const start = TimeService.realNow();
    const id = window.setInterval(() => {
      if (TimeService.realNow() - start > 1800) {
        (useFlomoStore as unknown as { setState: (p: object) => void }).setState({ lastToast: null });
        window.clearInterval(id);
      }
    }, 200);
    return () => window.clearInterval(id);
  }, [lastToast]);
  if (!lastToast) return null;
  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 bottom-24 px-4 py-2 rounded-lg text-white text-sm z-50 pointer-events-none"
      style={{ background: 'rgba(0,0,0,0.8)' }}
    >
      {lastToast}
    </div>
  );
}
