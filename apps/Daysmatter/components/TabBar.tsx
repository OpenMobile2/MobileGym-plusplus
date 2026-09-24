import { useLocation } from 'react-router-dom';
import { CalendarClock, Star, Globe, User, Grip } from 'lucide-react';
import { useDaysmatterGestures } from '../hooks/useDaysmatterGestures';
import { useI18n } from '../i18n';
import type { TransitionId } from '../navigation.declaration';

const ITEMS: { path: string; labelKey: string; trigger: TransitionId; Icon: typeof Star }[] = [
  { path: '/', labelKey: 'tabs.home', trigger: 'tabbar.home-open', Icon: CalendarClock },
  { path: '/notebooks', labelKey: 'tabs.notebook', trigger: 'tabbar.notebook-open', Icon: Star },
  { path: '/discover', labelKey: 'tabs.discover', trigger: 'tabbar.discover-open', Icon: Globe },
  { path: '/account', labelKey: 'tabs.account', trigger: 'tabbar.account-open', Icon: User },
  { path: '/more', labelKey: 'tabs.more', trigger: 'tabbar.more-open', Icon: Grip },
];

export default function TabBar() {
  const { pathname } = useLocation();
  const { bindTap } = useDaysmatterGestures();
  const { t } = useI18n();

  return (
    <div
      data-hide-on-keyboard
      className="flex h-14 w-full flex-shrink-0 items-stretch border-t border-[#E4E2DC] bg-white"
    >
      {ITEMS.map(({ path, labelKey, trigger, Icon }) => {
        const active = pathname === path;
        return (
          <button
            key={path}
            {...bindTap<HTMLButtonElement>(trigger)}
            className="flex flex-1 flex-col items-center justify-center gap-0.5"
          >
            <Icon size={22} className={active ? 'text-[#3E7CB1]' : 'text-[#9A9A9A]'} />
            <span className={`text-[10px] ${active ? 'text-[#3E7CB1]' : 'text-[#9A9A9A]'}`}>
              {t(labelKey)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
