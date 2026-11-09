import React, { useMemo, useState } from 'react';
import { useWeiboGestures } from '../hooks/useWeiboGestures';
import { useWeiboStore } from '../state';
import { useComposeSession } from '../components/composeStore';
import { Img, VBadge, TopBar } from '../components/ui';

export default function MentionPickerPage() {
  const { bindTap, bindBack, back } = useWeiboGestures();
  const users = useWeiboStore((s) => s.users);
  const contacts = useWeiboStore((s) => s.contacts);
  const session = useComposeSession();
  const [kw, setKw] = useState('');

  const recent = contacts.map((id) => users.find((u) => u.id === id)).filter(Boolean);
  const grouped = useMemo(() => {
    const rest = users.filter((u) => (kw ? u.name.includes(kw) : true));
    const groups: Record<string, typeof users> = {};
    rest.forEach((u) => {
      const letter = /^[a-zA-Z]/.test(u.name) ? u.name[0].toUpperCase() : '#';
      (groups[letter] ??= []).push(u);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [users, kw]);

  const pick = (name: string) => {
    session.append(`@${name} `);
    back();
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      <TopBar backBinding={bindBack()} title="联系人" />
      <div className="px-3 py-2 shrink-0">
        <input
          value={kw}
          onChange={(e) => setKw(e.target.value)}
          placeholder="搜索"
          data-action="mentionPicker.search.input"
          data-action-type="input"
          className="w-full h-8 bg-[#F5F5F5] rounded-full px-3 text-[13px] border-none outline-none"
        />
      </div>
      <div className="flex-1 overflow-y-auto" data-scroll-container="contact-list" data-scroll-direction="vertical">
        {!kw && (
          <>
            <div className="px-3 py-1.5 text-[12px] text-[#9A9A9A] bg-[#FAFAFA]">最近联系人</div>
            {recent.map((u) => u && (
              <button
                key={`recent-${u.id}`}
                {...bindTap({ kind: 'action', id: 'mentionPicker.user.insert' }, {
                  params: { userId: u.id },
                  onTrigger: () => pick(u.name),
                })}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 bg-transparent border-none cursor-pointer text-left"
              >
                <Img src={u.avatar} label={u.name[0]} className="w-9 h-9 rounded-full object-cover" />
                <span className="text-[15px] text-[#1A1A1A]">{u.name}</span>
                <VBadge type={u.verified} />
              </button>
            ))}
          </>
        )}
        {grouped.map(([letter, list]) => (
          <React.Fragment key={letter}>
            <div id={`mention-group-${letter}`} className="px-3 py-1.5 text-[12px] text-[#9A9A9A] bg-[#FAFAFA]">{letter}</div>
            {list.map((u) => (
              <button
                key={u.id}
                {...bindTap({ kind: 'action', id: 'mentionPicker.user.insert' }, {
                  params: { userId: u.id },
                  onTrigger: () => pick(u.name),
                })}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 bg-transparent border-none cursor-pointer text-left"
              >
                <Img src={u.avatar} label={u.name[0]} className="w-9 h-9 rounded-full object-cover" />
                <span className="text-[15px] text-[#1A1A1A]">{u.name}</span>
                <VBadge type={u.verified} />
              </button>
            ))}
          </React.Fragment>
        ))}
      </div>
      {/* 右侧字母索引 */}
      <div className="absolute right-1 top-1/3 flex flex-col gap-0.5 z-10">
        {grouped.slice(0, 12).map(([letter]) => (
          <button
            key={letter}
            {...bindTap({ kind: 'action', id: 'mentionPicker.index.jump' }, {
              onTrigger: () => document.getElementById(`mention-group-${letter}`)?.scrollIntoView({ block: 'start' }),
            })}
            className="text-[10px] text-[#7F7F7F] bg-transparent border-none cursor-pointer px-1"
          >
            {letter}
          </button>
        ))}
      </div>
    </div>
  );
}
