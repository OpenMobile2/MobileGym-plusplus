import React, { useRef } from 'react';
import { useFlomoStore } from '../state';
import { useFlomoGestures } from '../hooks/useFlomoGestures';
import { C } from '../components/ui';
import { IcTag, IcImage, IcBold, IcList, IcMore, IcArrowDown, IcSend } from '../res/icons';

export default function ComposeEditorPage() {
  const { bindTap, bindBack, back } = useFlomoGestures();
  const mode = useFlomoStore((s) => s.composeMode);
  const draft = useFlomoStore((s) => s.composeDraft);
  const images = useFlomoStore((s) => s.composeDraftImages);
  const currentMemoId = useFlomoStore((s) => s.currentMemoId);
  const memos = useFlomoStore((s) => s.memos);
  const setDraft = useFlomoStore((s) => s.setDraft);
  const insertDraft = useFlomoStore((s) => s.insertDraft);
  const addMemo = useFlomoStore((s) => s.addMemo);
  const updateMemo = useFlomoStore((s) => s.updateMemo);
  const clearDraft = useFlomoStore((s) => s.clearDraft);
  const removeDraftImage = useFlomoStore((s) => s.removeDraftImage);
  const toast = useFlomoStore((s) => s.toast);

  const src = mode === 'annotate' && currentMemoId ? memos.find((m) => m.id === currentMemoId) : null;
  const canSend = draft.trim().length > 0 || images.length > 0;
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  /** 加粗:作用于选中文字(有选区包 **;无选区插模板)。 */
  const applyBold = () => {
    const ta = taRef.current;
    if (ta && ta.selectionStart !== ta.selectionEnd) {
      const [a, b] = [ta.selectionStart, ta.selectionEnd];
      setDraft(draft.slice(0, a) + '**' + draft.slice(a, b) + '**' + draft.slice(b));
    } else {
      insertDraft('**加粗**');
    }
  };

  const send = () => {
    if (!canSend) {
      back();
      return;
    }
    if (mode === 'edit' && currentMemoId) {
      updateMemo(currentMemoId, draft);
      toast('笔记已保存');
    } else if (mode === 'annotate' && currentMemoId) {
      addMemo(draft, { sourceMemoId: currentMemoId });
      toast('笔记发布成功');
    } else {
      addMemo(draft, { images });
      toast('笔记发布成功');
    }
    clearDraft();
    back();
  };

  const tool = (node: React.ReactNode, bind: object, key: string) => (
    <button key={key} {...bind} className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer" style={{ color: C.sub }}>
      {node}
    </button>
  );

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      <div className="flex justify-end items-center px-3 h-10 shrink-0">
        <button {...bindBack()} className="bg-transparent border-none cursor-pointer" style={{ color: C.sub }} aria-label="收起">
          <IcArrowDown size={22} />
        </button>
      </div>

      {src && <div className="px-4 pb-1 text-sm" style={{ color: C.linkBlue }}>关联自:MEMO »</div>}

      {/* 编辑区:透明文字 textarea + 背后高亮层(#标签 变蓝) */}
      <div className="flex-1 relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 px-4 pt-1 whitespace-pre-wrap break-words pointer-events-none overflow-auto"
          style={{ fontSize: 16, lineHeight: 1.6, color: C.text }}
        >
          {draft.length === 0 ? (
            <span style={{ color: C.sub }}>现在的想法是…</span>
          ) : (
            highlightTags(draft)
          )}
          {'​'}
        </div>
        <textarea
          {...bindTap({ kind: 'action', id: 'compose.editor.input.text' }, { onTrigger: () => {} })}
          ref={taRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          autoFocus
          className="absolute inset-0 w-full h-full px-4 pt-1 bg-transparent border-none outline-none resize-none overflow-auto"
          style={{ fontSize: 16, lineHeight: 1.6, color: 'transparent', caretColor: C.green }}
        />
      </div>

      {images.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {images.map((src) => (
            <div key={src} className="relative w-20 h-20">
              <img src={src} alt="" className="w-full h-full object-cover rounded-lg" />
              <button
                {...bindTap({ kind: 'action', id: 'compose.editor.image.remove' }, {
                  stopPropagation: true,
                  onTrigger: () => removeDraftImage(src),
                })}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center border-none cursor-pointer text-white"
                style={{ background: 'rgba(0,0,0,0.65)', fontSize: 11, lineHeight: 1 }}
                aria-label="移除图片"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        data-keep-keyboard="true"
        className="flex items-center gap-1 px-2 h-12 shrink-0 border-t"
        style={{ borderColor: C.border, background: C.surface }}
      >
        {tool(<IcTag size={20} />, bindTap('compose.tagSuggest.open'), 'tag')}
        {tool(<IcImage size={20} />, bindTap('image.picker.open'), 'img')}
        {tool(<IcBold size={20} />, bindTap({ kind: 'action', id: 'compose.editor.bold.toggle' }, { onTrigger: applyBold }), 'bold')}
        {tool(<IcList size={20} />, bindTap('compose.listMenu.open'), 'list')}
        {tool(<IcMore size={20} />, bindTap('compose.moreToolbar.open'), 'more')}
        <div className="flex-1" />
        <button
          {...bindTap({ kind: 'action', id: 'compose.editor.send.submit' }, { onTrigger: send })}
          className="w-9 h-9 rounded-full flex items-center justify-center border-none cursor-pointer"
          style={{ background: canSend ? C.green : '#C8E6D4', color: '#fff' }}
          aria-label="发送"
        >
          <IcSend size={17} />
        </button>
      </div>
    </div>
  );
}

/** 编辑器高亮:#标签 变蓝(保持原字符宽度,与透明 textarea 对齐)。 */
function highlightTags(text: string): React.ReactNode {
  return text.split(/(#[^\s#]+)/g).map((p, i) =>
    /^#[^\s#]+$/.test(p) ? (
      <span key={i} style={{ color: C.tagText }}>{p}</span>
    ) : (
      <React.Fragment key={i}>{p}</React.Fragment>
    ),
  );
}
