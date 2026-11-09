import { Crown, Check, LogOut } from 'lucide-react';
import { useDaysmatterStore } from '../state';
import { useDaysmatterGestures } from '../hooks/useDaysmatterGestures';
import { useI18n } from '../i18n';

const ICITY_APPS = ['🏙️', '🏛️', '📅', '💱', '✅', '🕐', '📝', '👜', '💎'];

export default function AccountPage() {
  const { t } = useI18n();
  const { bindTap, action } = useDaysmatterGestures();
  const user = useDaysmatterStore((s) => s.user);
  const login = useDaysmatterStore((s) => s.login);
  const logout = useDaysmatterStore((s) => s.logout);
  const events = useDaysmatterStore((s) => s.events);

  const features = [t('account.feature1'), t('account.feature2'), t('account.feature3')];

  return (
    <div data-status-bar-foreground="light" className="flex h-full flex-col bg-[#EFEEE9]">
      <div className="flex h-[84px] flex-shrink-0 items-center bg-[#3E7CB1] px-3 pt-10 text-white">
        <div className="flex-1 text-center text-[17px] font-semibold">{t('account.title')}</div>
        <button {...bindTap<HTMLButtonElement>('notebook.pro-open')} aria-label="pro"><Crown size={22} className="text-[#F2C94C]" fill="#F2C94C" /></button>
      </div>

      <div data-scroll-container="main" data-scroll-direction="vertical" className="flex-1 overflow-y-auto bg-white px-6 no-scrollbar">
        <div className="mt-8 flex justify-center">
          <div className="h-[88px] w-[88px] overflow-hidden rounded-[20px] shadow-lg">
            <div className="bg-[#5B9BD5] py-1 text-center text-[13px] font-bold text-white">{t('account.iconLabel')}</div>
            <div className="flex h-[62px] items-center justify-center bg-white text-[40px] font-bold text-[#1A1A1A]">23</div>
          </div>
        </div>
        <div className="mt-3 text-center text-[28px] font-light text-[#5A5A5A]">Days<span className="font-bold text-[#1A1A1A]">Matter</span></div>
        <div className="mt-1 text-center text-[14px] text-[#9A9A9A]">{t('account.idLogin')}</div>

        {user.loggedIn ? (
          <>
            <div className="mt-8 rounded-2xl bg-[#F7F6F2] p-4 text-center">
              <div className="text-[16px] font-semibold text-[#1A1A1A]">{user.name}</div>
              <div className="mt-1 text-[13px] text-[#9A9A9A]">{t('account.synced', { count: events.length })}</div>
            </div>
            <button {...action<HTMLButtonElement>('account.session.logout', () => logout())}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-[#E0524D] py-3 text-[16px] text-[#E0524D]">
              <LogOut size={18} /> {t('common.logout')}
            </button>
          </>
        ) : (
          <>
            <div className="mx-auto mt-6 max-w-[260px] space-y-3">
              {features.map((f) => (
                <div key={f} className="flex items-center gap-2.5 text-[14px] text-[#5A5A5A]">
                  <Check size={18} className="flex-shrink-0 text-[#4CAF50]" strokeWidth={3} /> {f}
                </div>
              ))}
            </div>
            <button {...action<HTMLButtonElement>('account.session.register', () => login('iCity 用户'))}
              className="mt-7 w-full rounded-full bg-[#4CAF50] py-3.5 text-center text-[17px] font-semibold tracking-widest text-white shadow-md active:bg-[#43A047]">
              {t('common.register')}
            </button>
            <button {...action<HTMLButtonElement>('account.session.login', () => login('iCity 用户'))}
              className="mt-3 w-full rounded-full bg-[#5B9BD5] py-3.5 text-center text-[17px] font-semibold tracking-widest text-white shadow-md active:bg-[#4A90D9]">
              {t('common.login')}
            </button>
          </>
        )}

        <div className="mt-10 flex items-center gap-2 text-[12px] text-[#B0B0B0]">
          <span className="h-px flex-1 bg-[#E6E3DB]" />{t('account.icityApps')}<span className="h-px flex-1 bg-[#E6E3DB]" />
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-2.5">
          {ICITY_APPS.map((a, i) => (
            <span key={i} className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F2F1EC] text-lg">{a}</span>
          ))}
        </div>
        <div className="mb-8 mt-3 text-center text-[11px] text-[#C4C4C4]">Powered by iDaily Media</div>
      </div>
    </div>
  );
}
