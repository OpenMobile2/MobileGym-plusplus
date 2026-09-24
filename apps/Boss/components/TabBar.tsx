import React from 'react';
import { useLocation } from 'react-router-dom';
import { TABS } from '../constants';
import { COLORS } from '../res/colors';
import { useBossGestures } from '../hooks/useBossGestures';
import { useStrings } from '../hooks/useStrings';
import { useBossStore } from '../state';
import { BOSS_CONFIG } from '../data';
import { IcBriefcase, IcBook, IcEdit, IcSmile } from '../res/icons';

const ICONS = { jobs: IcBriefcase, feed: IcBook, messages: IcEdit, mine: IcSmile } as const;

/** 主 TabBar:职位/有了/消息/我的。消息带未读数字角标,有了/我的带红点(真机同款)。 */
const TabBar: React.FC = () => {
  const { pathname } = useLocation();
  const { bindTap } = useBossGestures();
  const t = useStrings();
  const sessions = useBossStore((s) => s.sessions);
  const unread = sessions.reduce((n, s) => n + s.unread, 0)
    + BOSS_CONFIG.systemCards.reduce((n, c) => n + (c.unread ?? 0), 0);

  return (
    <div data-hide-on-keyboard className="mx-3 mb-2 flex shrink-0 items-center justify-between rounded-full bg-app-surface px-3 py-1.5 shadow-[0_2px_16px_rgba(0,0,0,0.16)]">
      {TABS.map((tab) => {
        const active = pathname === tab.path;
        const Icon = ICONS[tab.id as keyof typeof ICONS];
        const label = t[tab.labelKey as keyof typeof t] as string;
        return (
          <button
            key={tab.id}
            {...bindTap(tab.transitionId as never, { nav: { mode: 'replace' } })}
            className={`relative flex min-w-[64px] flex-col items-center gap-0.5 rounded-full px-4 py-1.5 ${active ? 'bg-[#E6F5F4]' : ''}`}
          >
            <span className="relative">
              <Icon size={22} color={active ? 'var(--app-c-primary)' : 'var(--app-text-muted)'} fill={active ? 'var(--app-c-primary)' : 'none'} />
              {tab.id === 'messages' && unread > 0 && (
                <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF4D4F] px-1 text-[10px] font-semibold text-white">{unread}</span>
              )}
              {(tab.id === 'feed' || tab.id === 'mine') && (
                <span className="absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-[#FF4D4F]" />
              )}
            </span>
            <span className={`text-[11px] ${active ? 'font-semibold' : 'text-gray-400'}`} style={active ? { color: COLORS.primary } : undefined}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default TabBar;
