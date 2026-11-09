import React, { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useWeiboGestures } from '../hooks/useWeiboGestures';
import { useWeiboStore } from '../state';
import { useComposeSession } from '../components/composeStore';
import { useStrings, useToast, CenterDialog } from '../components/ui';
import { ST_SECTIONS } from '../constants';
import { IcImage, IcAt, IcHash, IcGif, IcEmoji, IcPlus, IcLocation } from '../res/icons';

export default function SupertopicComposePage() {
  const s = useStrings();
  const { id = '' } = useParams();
  const { bindTap, bindBack, back } = useWeiboGestures();
  const [searchParams, setSearchParams] = useSearchParams();
  const [toastNode, toast] = useToast();

  const me = useWeiboStore((st) => st.me);
  const supertopics = useWeiboStore((st) => st.supertopics);
  const postToSupertopic = useWeiboStore((st) => st.postToSupertopic);
  const saveDraft = useWeiboStore((st) => st.saveDraft);

  const topic = supertopics.find((t) => t.id === id);
  const session = useComposeSession();
  const initialized = useRef(false);
  const [section, setSection] = useState<string>('周边');
  const [syncWeibo, setSyncWeibo] = useState(true);
  const dialogOpen = searchParams.get('dialog') === 'draft';

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    if (session.target !== 'stcompose') session.reset('stcompose');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const typed = session.text.trim().length > 0;
  const finish = () => { session.reset('compose'); back(); };
  const openDialog = () => setSearchParams((p) => { p.set('dialog', 'draft'); return p; }, { replace: true });
  const closeDialog = () => setSearchParams((p) => { p.delete('dialog'); return p; }, { replace: true });

  const submit = () => {
    if (!typed) return;
    postToSupertopic(id, session.text.trim(), syncWeibo);
    toast(s.sendSuccess);
    window.setTimeout(finish, 500);
  };

  return (
    <div className="flex flex-col h-full bg-[#161616] relative">
      <div className="flex items-center h-12 px-3 shrink-0">
        <button
          {...(typed
            ? bindTap({ kind: 'action', id: 'stCompose.cancel.draftDialog' }, { onTrigger: openDialog })
            : bindBack())}
          className="text-[15px] text-white bg-transparent border-none cursor-pointer"
        >
          {s.cancel}
        </button>
        <div className="flex-1 text-center leading-tight">
          <div className="text-[16px] font-semibold text-white">{topic?.name ?? '超话'}超话</div>
          <div className="text-[10px] text-[#888888] truncate">{me.name}</div>
        </div>
        <button
          {...bindTap({ kind: 'action', id: 'stCompose.send.submit' }, { onTrigger: submit })}
          disabled={!typed}
          className={`h-8 px-4 rounded-lg text-white text-[14px] border-none cursor-pointer ${typed ? 'bg-[#FF8200]' : 'bg-[#7A4A1F]'}`}
        >
          {s.send}
        </button>
      </div>

      {/* 版块 chips */}
      <div className="flex items-center gap-2 px-3 pb-2 overflow-x-auto shrink-0" data-scroll-container="st-sections" data-scroll-direction="horizontal">
        <span className="text-[12px] text-[#888888] shrink-0">版块?</span>
        {ST_SECTIONS.map((sec) => (
          <button
            key={sec}
            {...bindTap({ kind: 'action', id: 'stCompose.section.select.target' }, { params: { target: sec }, onTrigger: () => setSection(sec) })}
            className={`shrink-0 text-[12px] rounded-full px-2.5 py-1 border-none cursor-pointer ${section === sec ? 'bg-white text-[#1A1A1A]' : 'bg-[#2A2A2A] text-[#AAAAAA]'}`}
          >
            {section === sec ? '✦ ' : ''}{sec}
          </button>
        ))}
      </div>
      <div className="px-3 pb-1 text-[11px] text-[#777777] shrink-0">ⓘ 该超话设置了等级发帖,等级满足要求前将为你发布微博</div>

      {/* 正文 */}
      <div className="flex-1 px-3">
        <span className="text-[15px] text-[#5077BE]">◇{topic?.name} </span>
        <textarea
          autoFocus
          value={session.text}
          onChange={(e) => session.set({ text: e.target.value })}
          data-action="stCompose.text.input"
          data-action-type="input"
          className="w-full h-40 text-[16px] leading-relaxed outline-none resize-none border-none bg-transparent text-white"
        />
      </div>

      {/* 选项条 */}
      <div className="flex items-center gap-2 px-3 pb-1.5 shrink-0">
        <span className="flex items-center gap-1 text-[12px] text-[#AAAAAA] bg-[#2A2A2A] rounded-full px-2 py-1">
          <IcLocation size={12} /> 添加位置
        </span>
        <span className="text-[12px] text-[#AAAAAA] bg-[#2A2A2A] rounded-full px-2 py-1">内容声明</span>
        <span className="flex-1" />
        {session.text.length > 0 && <span className="text-[12px] text-[#777777]">{session.text.length}</span>}
        <label
          {...bindTap({ kind: 'action', id: 'stCompose.syncWeibo.toggle' }, { onTrigger: () => setSyncWeibo((v) => !v) })}
          className="flex items-center gap-1 text-[12px] text-[#AAAAAA] cursor-pointer"
        >
          <span className={`w-4 h-4 rounded-sm flex items-center justify-center text-[10px] ${syncWeibo ? 'bg-[#41C468] text-white' : 'border border-[#555555]'}`}>
            {syncWeibo ? '✓' : ''}
          </span>
          {s.syncWeibo}
        </label>
      </div>

      {/* 工具条 */}
      <div className="flex items-center justify-around h-12 border-t border-[#2A2A2A] shrink-0" data-keep-keyboard="true">
        {[IcImage, IcAt, IcHash, IcGif, IcEmoji, IcPlus].map((Icon, i) => (
          i === 1 ? (
            <button key={i} {...bindTap('stCompose.mention-open', { params: { from: 'stcompose' } })} className="bg-transparent border-none cursor-pointer text-[#AAAAAA] p-2">
              <Icon size={24} />
            </button>
          ) : (
            <button
              key={i}
              {...bindTap({ kind: 'action', id: 'stCompose.tools.stub' }, { onTrigger: () => toast(s.notOpen) })}
              className="bg-transparent border-none cursor-pointer text-[#AAAAAA] p-2"
            >
              <Icon size={24} />
            </button>
          )
        ))}
      </div>

      {dialogOpen && (
        <CenterDialog
          text={s.draftAsk}
          leftLabel={s.draftDiscard}
          rightLabel={s.draftSave}
          onLeft={() => { closeDialog(); finish(); }}
          onRight={() => {
            saveDraft({ text: `◇${topic?.name} ${session.text}`, images: [], visibility: 'public' });
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
