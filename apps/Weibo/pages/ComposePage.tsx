import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWeiboGestures } from '../hooks/useWeiboGestures';
import { useWeiboStore } from '../state';
import { useComposeSession, VISIBILITY_LABEL } from '../components/composeStore';
import { useStrings, useToast, Img, CenterDialog } from '../components/ui';
import { IcImage, IcAt, IcHash, IcGif, IcEmoji, IcPlus, IcClose, IcLocation, IcLock, IcRight } from '../res/icons';

export default function ComposePage() {
  const s = useStrings();
  const { bindTap, bindBack, back } = useWeiboGestures();
  const [searchParams, setSearchParams] = useSearchParams();
  const [toastNode, toast] = useToast();

  const me = useWeiboStore((st) => st.me);
  const locations = useWeiboStore((st) => st.locations);
  const drafts = useWeiboStore((st) => st.drafts);
  const publishStatus = useWeiboStore((st) => st.publishStatus);
  const saveDraft = useWeiboStore((st) => st.saveDraft);
  const deleteDraft = useWeiboStore((st) => st.deleteDraft);

  const session = useComposeSession();
  const initialized = useRef(false);
  const [tagRowVisible, setTagRowVisible] = useState(true);
  const [locExpanded, setLocExpanded] = useState(true);
  const [emojiOpen, setEmojiOpen] = useState(false);

  const prefillTopic = searchParams.get('topic');
  const draftId = searchParams.get('draft');
  const draftDialogOpen = searchParams.get('draft') === 'confirm' && !drafts.some((d) => d.id === 'confirm');
  const dialogOpen = searchParams.get('dialog') === 'draft';

  // 首次进入:重置会话并按来源预填(话题/草稿)。位置每次重选(qa:Q5=B)。
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    if (session.target !== 'compose' || (!prefillTopic && !draftId)) {
      if (session.target !== 'compose') session.reset('compose');
    }
    if (prefillTopic) session.set({ text: `${prefillTopic} ` });
    if (draftId && draftId !== 'confirm') {
      const d = drafts.find((x) => x.id === draftId);
      if (d) {
        session.set({ text: d.text, images: d.images, visibility: d.visibility as typeof session.visibility });
        deleteDraft(d.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasContent = session.text.trim().length > 0 || session.images.length > 0;

  const openDraftDialog = () => setSearchParams((p) => { p.set('dialog', 'draft'); return p; }, { replace: true });
  const closeDialog = () => setSearchParams((p) => { p.delete('dialog'); return p; }, { replace: true });

  const finish = () => { session.reset('compose'); back(); };

  const submit = () => {
    if (!hasContent) return;
    publishStatus({
      text: session.text.trim(),
      images: session.images,
      visibility: session.visibility,
      location: session.location ?? undefined,
    });
    toast(s.sendSuccess);
    window.setTimeout(finish, 500);
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* 顶栏 */}
      <div className="flex items-center h-12 px-3 shrink-0">
        <button
          {...(hasContent
            ? bindTap({ kind: 'action', id: 'compose.cancel.draftDialog' }, { onTrigger: openDraftDialog })
            : bindBack())}
          className="text-[15px] text-[#1A1A1A] bg-transparent border-none cursor-pointer"
        >
          {s.cancel}
        </button>
        <div className="flex-1 text-center leading-tight">
          <div className="text-[16px] font-semibold">发微博</div>
          <div className="text-[10px] text-[#BBBBBB] truncate">{me.name}</div>
        </div>
        <button
          {...bindTap({ kind: 'action', id: 'compose.send.submit' }, { onTrigger: submit })}
          disabled={!hasContent}
          className={`h-8 px-4 rounded-lg text-white text-[14px] border-none cursor-pointer ${hasContent ? 'bg-[#FF8200]' : 'bg-[#FFCC99]'}`}
        >
          {s.send}
        </button>
      </div>

      {/* 正文 */}
      <textarea
        autoFocus
        value={session.text}
        onChange={(e) => session.set({ text: e.target.value })}
        placeholder={s.composePlaceholder}
        data-action="compose.text.input"
        data-action-type="input"
        className="flex-1 px-3 text-[17px] leading-relaxed outline-none resize-none border-none"
      />

      {/* 图片区 */}
      {session.images.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5 px-3 pb-2">
          {session.images.map((img, i) => (
            <div key={i} className="relative aspect-square rounded overflow-hidden">
              <Img src={img} label="图" className="w-full h-full object-cover" />
              <span className="absolute bottom-0 left-0 text-[10px] text-white bg-black/50 px-1">编辑</span>
              <button
                {...bindTap({ kind: 'action', id: 'compose.image.remove' }, {
                  params: { imageIndex: i },
                  onTrigger: () => session.set({ images: session.images.filter((_, j) => j !== i) }),
                })}
                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/50 text-white border-none cursor-pointer flex items-center justify-center"
              >
                <IcClose size={12} />
              </button>
            </div>
          ))}
          {session.images.length < 9 && (
            <button
              {...bindTap('compose.image-add')}
              className="aspect-square border-2 border-dashed border-[#DDDDDD] rounded bg-transparent cursor-pointer flex items-center justify-center text-[#BBBBBB]"
            >
              <IcPlus size={28} />
            </button>
          )}
        </div>
      )}

      {/* 标签行 */}
      {tagRowVisible && (
        <div className="flex items-center gap-2 px-3 pb-1.5">
          <span className="text-[12px] text-[#5B5B5B] bg-[#F5F5F5] rounded-full px-2 py-1">📝 生活手记 &gt;</span>
          {session.supertopicName && (
            <span className="text-[12px] text-[#E68A3C] bg-[#FFF3E5] rounded-full px-2 py-1">◇{session.supertopicName}</span>
          )}
          <span className="flex-1" />
          <button
            {...bindTap({ kind: 'action', id: 'compose.tagRow.close' }, { onTrigger: () => setTagRowVisible(false) })}
            className="text-[#BBBBBB] bg-transparent border-none cursor-pointer p-0.5"
          >
            <IcClose size={14} />
          </button>
        </div>
      )}

      {/* 选项条 */}
      <div className="flex items-center gap-2 px-3 pb-1.5">
        {session.location ? (
          <button
            {...bindTap({ kind: 'action', id: 'compose.location.remove' }, { onTrigger: () => { session.set({ location: null }); setLocExpanded(true); } })}
            className="flex items-center gap-1 text-[12px] text-[#5077BE] bg-[#EEF3FB] rounded-full px-2 py-1 border-none cursor-pointer"
          >
            <IcLocation size={12} />
            {session.location}
            <IcClose size={11} />
          </button>
        ) : (
          <button
            {...bindTap({ kind: 'action', id: 'compose.location.expand' }, { onTrigger: () => setLocExpanded((v) => !v) })}
            className="flex items-center gap-1 text-[12px] text-[#5B5B5B] bg-[#F5F5F5] rounded-full px-2 py-1 border-none cursor-pointer"
          >
            <IcLocation size={12} />
            添加位置
          </button>
        )}
        <button
          {...bindTap('compose.supertopic-open')}
          className="flex items-center gap-1 text-[12px] text-[#5B5B5B] bg-[#F5F5F5] rounded-full px-2 py-1 border-none cursor-pointer"
        >
          ◇ {s.supertopic}
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'compose.declaration.stub' }, { onTrigger: () => toast(s.notOpen) })}
          className="text-[12px] text-[#5B5B5B] bg-[#F5F5F5] rounded-full px-2 py-1 border-none cursor-pointer"
        >
          内容声明
        </button>
        <span className="flex-1" />
        {session.text.length > 0 && <span className="text-[12px] text-[#9A9A9A]">{session.text.length}</span>}
        <button
          {...bindTap('compose.visibility-open', { params: {}, })}
          className="flex items-center gap-1 text-[12px] text-[#5B5B5B] bg-[#F5F5F5] rounded-full px-2 py-1 border-none cursor-pointer"
        >
          <IcLock size={12} />
          {VISIBILITY_LABEL[session.visibility]}
        </button>
      </div>

      {/* 位置推荐 chips 条 */}
      {locExpanded && !session.location && (
        <div className="flex items-center gap-2 px-3 pb-1.5 overflow-x-auto" data-scroll-container="loc-chips" data-scroll-direction="horizontal">
          {locations.slice(0, 5).map((loc) => (
            <button
              key={loc}
              {...bindTap({ kind: 'action', id: 'compose.location.select.target' }, {
                params: { target: loc },
                onTrigger: () => session.set({ location: loc }),
              })}
              className="shrink-0 text-[12px] text-[#5B5B5B] bg-[#F5F5F5] rounded-full px-2.5 py-1 border-none cursor-pointer"
            >
              {loc}
            </button>
          ))}
          <button
            onClick={() => setLocExpanded(false)}
            className="shrink-0 text-[#BBBBBB] bg-transparent border-none cursor-pointer"
          >
            <IcClose size={14} />
          </button>
        </div>
      )}

      {/* 工具条 */}
      <div className="flex items-center justify-around h-12 border-t border-[#F5F5F5] shrink-0" data-keep-keyboard="true">
        <button {...bindTap('compose.image-open')} className="bg-transparent border-none cursor-pointer text-[#5B5B5B] p-2">
          <IcImage size={24} />
        </button>
        <button {...bindTap('compose.mention-open')} className="bg-transparent border-none cursor-pointer text-[#5B5B5B] p-2">
          <IcAt size={24} />
        </button>
        <button {...bindTap('compose.topic-open')} className="bg-transparent border-none cursor-pointer text-[#5B5B5B] p-2">
          <IcHash size={24} />
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'compose.tools.stub' }, { onTrigger: () => toast(s.notOpen) })}
          className="bg-transparent border-none cursor-pointer text-[#5B5B5B] p-2"
        >
          <IcGif size={24} />
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'compose.tools.stub' }, { onTrigger: () => setEmojiOpen((v) => !v) })}
          className="bg-transparent border-none cursor-pointer text-[#5B5B5B] p-2"
          data-role="emoji-toggle"
        >
          <IcEmoji size={24} />
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'compose.tools.stub' }, { onTrigger: () => toast(s.notOpen) })}
          className="bg-transparent border-none cursor-pointer text-[#5B5B5B] p-2"
        >
          <IcPlus size={24} />
        </button>
      </div>

      {/* 浅版表情面板 */}
      {emojiOpen && (
        <div className="grid grid-cols-8 gap-2 px-3 py-2 border-t border-[#F5F5F5] shrink-0" data-keep-keyboard="true">
          {['😀', '😂', '🥹', '😍', '😭', '😡', '👍', '🙏', '❤️', '🔥', '🎉', '🌹', '🐶', '🐱', '⚽', '🍔'].map((e) => (
            <button key={e} onClick={() => session.append(e)} className="text-[22px] bg-transparent border-none cursor-pointer">
              {e}
            </button>
          ))}
        </div>
      )}

      {/* 草稿弹窗 */}
      {dialogOpen && (
        <CenterDialog
          text={s.draftAsk}
          leftLabel={s.draftDiscard}
          rightLabel={s.draftSave}
          onLeft={() => { closeDialog(); finish(); }}
          onRight={() => {
            saveDraft({ text: session.text, images: session.images, visibility: session.visibility });
            closeDialog();
            toast('已存入草稿箱');
            window.setTimeout(finish, 400);
          }}
        />
      )}

      {toastNode}
    </div>
  );
}
