import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWeiboGestures } from '../hooks/useWeiboGestures';
import { useWeiboStore } from '../state';
import { useComposeSession } from '../components/composeStore';
import { Img, fmtCount, CenterDialog } from '../components/ui';
import { ST_CATEGORIES } from '../constants';

export default function SupertopicPickerPage() {
  const { bindTap, bindBack, back } = useWeiboGestures();
  const [searchParams, setSearchParams] = useSearchParams();
  const supertopics = useWeiboStore((s) => s.supertopics);
  const session = useComposeSession();
  const [cat, setCat] = useState<string>('最近使用');
  const [pendingSt, setPendingSt] = useState<string | null>(null);

  const syncDialogOpen = searchParams.get('sync') === 'confirm';
  const list = cat === '最近使用' ? supertopics.filter((t) => t.followed) : supertopics.filter((t) => t.category === cat);
  const shown = list.length ? list : supertopics;

  const insert = (name: string) => {
    session.set({ supertopicName: name });
    session.append(`◇${name}`);
    back();
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="flex items-center gap-2 px-3 h-12 shrink-0">
        <div className="flex-1 h-8 bg-[#F5F5F5] rounded-full px-3 flex items-center text-[13px] text-[#9A9A9A]">🔍 搜索</div>
        <button {...bindBack()} className="text-[14px] text-[#1A1A1A] bg-transparent border-none cursor-pointer">取消</button>
      </div>
      <div className="px-3 py-1.5 text-[12px] text-[#9A9A9A] bg-[#FAFAF5] shrink-0">发布后将在超话内展示,需关注超话</div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-20 shrink-0 overflow-y-auto bg-[#F7F7F7]">
          {ST_CATEGORIES.map((c) => (
            <button
              key={c}
              {...bindTap({ kind: 'action', id: 'stPicker.category.select.target' }, {
                params: { target: c },
                onTrigger: () => setCat(c),
              })}
              className={`block w-full py-3 text-[12px] border-none cursor-pointer relative ${cat === c ? 'bg-white text-[#1A1A1A] font-semibold' : 'bg-transparent text-[#5B5B5B]'}`}
            >
              {cat === c && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#FF8200] rounded-r" />}
              {c}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto" data-scroll-container="stpicker-list" data-scroll-direction="vertical">
          {shown.map((t) => (
            <button
              key={t.id}
              {...bindTap({ kind: 'action', id: 'stPicker.supertopic.insert' }, {
                params: { supertopicId: t.id },
                onTrigger: () => {
                  if (session.visibility !== 'public') {
                    setPendingSt(t.name);
                    setSearchParams((p) => { p.set('sync', 'confirm'); return p; }, { replace: true });
                  } else {
                    insert(t.name);
                  }
                },
              })}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 bg-transparent border-none cursor-pointer text-left"
            >
              <Img src={t.cover} label={t.name[0]} className="w-11 h-11 rounded object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[14px] text-[#1A1A1A] truncate">◇{t.name}</div>
                <div className="text-[12px] text-[#9A9A9A]">{fmtCount(t.posts)}帖子 {fmtCount(t.fans)}{t.fanName}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 同步公开弹窗(qa:Q4 按推断:确定后可见范围立即变公开) */}
      {syncDialogOpen && (
        <CenterDialog
          text="同步发布超话帖,微博可见性将调整为公开"
          leftLabel="取消"
          rightLabel="确定"
          rightBinding={bindTap({ kind: 'action', id: 'stPicker.visibilityDialog.confirm' }, {
            onTrigger: () => {
              session.set({ visibility: 'public' });
              setSearchParams((p) => { p.delete('sync'); return p; }, { replace: true });
              if (pendingSt) insert(pendingSt);
            },
          })}
          onLeft={() => setSearchParams((p) => { p.delete('sync'); return p; }, { replace: true })}
          onRight={() => setSearchParams((p) => { p.delete('sync'); return p; }, { replace: true })}
        />
      )}
    </div>
  );
}
