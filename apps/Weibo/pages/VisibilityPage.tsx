import React from 'react';
import { useWeiboGestures } from '../hooks/useWeiboGestures';
import { useComposeSession } from '../components/composeStore';
import { useStrings, TopBar } from '../components/ui';
import { VISIBILITY_OPTIONS } from '../constants';

export default function VisibilityPage() {
  const s = useStrings();
  const { bindTap, bindBack, back } = useWeiboGestures();
  const session = useComposeSession();

  return (
    <div className="flex flex-col h-full bg-white">
      <TopBar backBinding={bindBack()} title={s.visibilityTitle} />
      <div className="flex-1 overflow-y-auto">
        {VISIBILITY_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            {...bindTap({ kind: 'action', id: 'visibility.option.select.target' }, {
              params: { target: opt.id },
              onTrigger: () => {
                session.set({ visibility: opt.id as typeof session.visibility });
                back();
              },
            })}
            className="flex items-center w-full px-4 py-3.5 bg-transparent border-none border-b border-[#F7F7F7] cursor-pointer text-left"
          >
            <div className="flex-1">
              <div className="text-[15px] text-[#1A1A1A]">{opt.label}</div>
              {opt.desc && <div className="text-[12px] text-[#9A9A9A] mt-0.5">{opt.desc}</div>}
            </div>
            {session.visibility === opt.id && <span className="text-[#FF8200] text-[18px]">✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
