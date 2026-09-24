import React, { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useWeiboGestures } from '../hooks/useWeiboGestures';
import { useWeiboStore } from '../state';
import { useComposeSession, VISIBILITY_LABEL } from '../components/composeStore';
import { RichText } from '../components/StatusCard';
import { useStrings, useToast, Img, CenterDialog } from '../components/ui';
import { IcImage, IcAt, IcHash, IcGif, IcEmoji, IcPlus, IcLock, IcClose } from '../res/icons';

const REPOST_CHIPS = ['鹿晗关晓彤', '台风巴威', '世界杯', '演唱会门票'];

export default function RepostComposePage() {
  const s = useStrings();
  const { id = '' } = useParams();
  const { bindTap, bindBack, back } = useWeiboGestures();
  const [searchParams, setSearchParams] = useSearchParams();
  const [toastNode, toast] = useToast();

  const me = useWeiboStore((st) => st.me);
  const statuses = useWeiboStore((st) => st.statuses);
  const users = useWeiboStore((st) => st.users);
  const submitRepost = useWeiboStore((st) => st.submitRepost);
  const saveDraft = useWeiboStore((st) => st.saveDraft);

  const session = useComposeSession();
  const initialized = useRef(false);
  const [alsoComment, setAlsoComment] = useState(false);
  const [chipsVisible, setChipsVisible] = useState(true);

  const original = statuses.find((x) => x.id === id);
  const origAuthor = original ? (original.userId === 'me' ? me : users.find((u) => u.id === original.userId)) : undefined;
  const dialogOpen = searchParams.get('dialog') === 'draft';

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    if (session.target !== 'repost') session.reset('repost');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // qa:Q3=A:仅预置chips未打字视同空,直接退;有正文才弹草稿
  const typed = session.text.trim().length > 0;
  const finish = () => { session.reset('compose'); back(); };
  const openDialog = () => setSearchParams((p) => { p.set('dialog', 'draft'); return p; }, { replace: true });
  const closeDialog = () => setSearchParams((p) => { p.delete('dialog'); return p; }, { replace: true });

  const submit = () => {
    submitRepost(id, session.text.trim(), alsoComment);
    toast(s.sendSuccess);
    window.setTimeout(finish, 500);
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="flex items-center h-12 px-3 shrink-0">
        <button
          {...(typed
            ? bindTap({ kind: 'action', id: 'repost.cancel.draftDialog' }, { onTrigger: openDialog })
            : bindBack())}
          className="text-[15px] text-[#1A1A1A] bg-transparent border-none cursor-pointer"
        >
          {s.cancel}
        </button>
        <div className="flex-1 text-center leading-tight">
          <div className="text-[16px] font-semibold">转发微博</div>
          <div className="text-[10px] text-[#BBBBBB] truncate">{me.name}</div>
        </div>
        <button
          {...bindTap({ kind: 'action', id: 'repost.send.submit' }, { onTrigger: submit })}
          className="h-8 px-4 rounded-lg text-white text-[14px] border-none cursor-pointer bg-[#FF8200]"
        >
          {s.send}
        </button>
      </div>

      <textarea
        autoFocus
        value={session.text}
        onChange={(e) => session.set({ text: e.target.value })}
        placeholder={s.repostPlaceholder}
        data-action="repost.text.input"
        data-action-type="input"
        className="h-28 px-3 text-[16px] leading-relaxed outline-none resize-none border-none shrink-0"
      />

      {/* 引用卡 */}
      {original && (
        <div className="mx-3 bg-[#F7F7F7] rounded-md p-2 flex gap-2 shrink-0">
          {original.images[0] && (
            <Img src={original.images[0]} label="图" className="w-12 h-12 rounded object-cover shrink-0" />
          )}
          <RichText
            text={`@${origAuthor?.name ?? '微博用户'}:${original.text.slice(0, 70)}${original.text.length > 70 ? '…' : ''}`}
            className="text-[13px] text-[#5B5B5B] leading-snug"
          />
        </div>
      )}

      {/* 推荐话题 chips */}
      {chipsVisible && (
        <div className="flex items-center gap-2 px-3 py-2 overflow-x-auto shrink-0" data-scroll-container="repost-chips" data-scroll-direction="horizontal">
          {REPOST_CHIPS.map((c) => (
            <button
              key={c}
              {...bindTap({ kind: 'action', id: 'repost.topicChip.insert' }, {
                onTrigger: () => session.append(`#${c}# `),
              })}
              className="shrink-0 text-[12px] text-[#5077BE] bg-[#EEF3FB] rounded-full px-2.5 py-1 border-none cursor-pointer"
            >
              #{c}#
            </button>
          ))}
          <button onClick={() => setChipsVisible(false)} className="shrink-0 text-[#BBBBBB] bg-transparent border-none cursor-pointer">
            <IcClose size={14} />
          </button>
        </div>
      )}

      <span className="flex-1" />

      {/* 选项行 */}
      <div className="flex items-center gap-3 px-3 pb-1.5 shrink-0">
        <label
          {...bindTap({ kind: 'action', id: 'repost.alsoComment.toggle' }, { onTrigger: () => setAlsoComment((v) => !v) })}
          className="flex items-center gap-1 text-[12px] text-[#5B5B5B] cursor-pointer"
        >
          <span className={`w-4 h-4 rounded-sm border flex items-center justify-center text-[10px] ${alsoComment ? 'bg-[#FF8200] border-[#FF8200] text-white' : 'border-[#CCCCCC]'}`}>
            {alsoComment ? '✓' : ''}
          </span>
          {s.alsoComment}
        </label>
        <button
          {...bindTap({ kind: 'action', id: 'repost.tools.stub' }, { onTrigger: () => toast(s.notOpen) })}
          className="text-[12px] text-[#5B5B5B] bg-[#F5F5F5] rounded-full px-2 py-1 border-none cursor-pointer"
        >
          ◇ {s.supertopic}
        </button>
        <span className="flex-1" />
        <button
          {...bindTap('repost.visibility-open', { params: {} })}
          className="flex items-center gap-1 text-[12px] text-[#5B5B5B] bg-[#F5F5F5] rounded-full px-2 py-1 border-none cursor-pointer"
        >
          <IcLock size={12} />
          {VISIBILITY_LABEL[session.visibility]}
        </button>
      </div>

      {/* 工具条 */}
      <div className="flex items-center justify-around h-12 border-t border-[#F5F5F5] shrink-0" data-keep-keyboard="true">
        <button
          {...bindTap({ kind: 'action', id: 'repost.tools.stub' }, { onTrigger: () => toast(s.notOpen) })}
          className="bg-transparent border-none cursor-pointer text-[#5B5B5B] p-2"
        >
          <IcImage size={24} />
        </button>
        <button {...bindTap('repost.mention-open', { params: { from: 'repost' } })} className="bg-transparent border-none cursor-pointer text-[#5B5B5B] p-2">
          <IcAt size={24} />
        </button>
        <button {...bindTap('repost.topic-open', { params: { from: 'repost' } })} className="bg-transparent border-none cursor-pointer text-[#5B5B5B] p-2">
          <IcHash size={24} />
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'repost.tools.stub' }, { onTrigger: () => toast(s.notOpen) })}
          className="bg-transparent border-none cursor-pointer text-[#5B5B5B] p-2"
        >
          <IcGif size={24} />
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'repost.tools.stub' }, { onTrigger: () => toast(s.notOpen) })}
          className="bg-transparent border-none cursor-pointer text-[#5B5B5B] p-2"
        >
          <IcEmoji size={24} />
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'repost.tools.stub' }, { onTrigger: () => toast(s.notOpen) })}
          className="bg-transparent border-none cursor-pointer text-[#5B5B5B] p-2"
        >
          <IcPlus size={24} />
        </button>
      </div>

      {dialogOpen && (
        <CenterDialog
          text={s.draftAsk}
          leftLabel={s.draftDiscard}
          rightLabel={s.draftSave}
          onLeft={() => { closeDialog(); finish(); }}
          onRight={() => {
            saveDraft({ text: session.text, images: [], visibility: session.visibility });
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
