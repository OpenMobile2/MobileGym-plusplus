import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDidaStore } from '../state';
import { useDidaGestures } from '../hooks/useDidaGestures';
import { useDidaTheme } from '../hooks/useDidaTheme';
import { useI18n } from '../i18n';
import { IcChevronRight, IcCrown } from '../res/icons';
import { AsyncFsImage } from '@/os/components/AsyncFsImage';

const MePage: React.FC = () => {
  const [params] = useSearchParams();
  const { t } = useI18n();
  const { action, bindTap, bindBack, go } = useDidaGestures();
  const { isDark, accentHex } = useDidaTheme();
  const user = useDidaStore((s) => s.user);
  const logout = useDidaStore((s) => s.logout);
  const showToast = useDidaStore((s) => s.showToast);

  const confirmOpen = params.get('confirm') === 'signout';
  const avatarSrc = user.avatar?.trim();

  /** 真页面入口 */
  const realRows = [
    { key: 'me.appearance', transition: 'me.appearance.open' as const },
    { key: 'me.datetime', transition: 'me.datetime.open' as const },
    { key: 'me.general', transition: 'me.general.open' as const },
  ];
  /** 底稿放弃：继续 toast */
  const toastRowsA = [
    { key: 'me.tabbar', id: 'me.entry.toast' },
    { key: 'me.notifications', id: 'me.notif.toast' },
    { key: 'me.widgets', id: 'me.entry.toast' },
    { key: 'me.ai', id: 'me.entry.toast' },
  ];
  const toastRowsB = [
    { key: 'me.import', id: 'me.entry.toast' },
  ];

  const ToastRow = ({ label, id }: { label: string; id: string }) => (
    <button
      {...action(id, () => showToast(t('common.notAvailable')))}
      className="flex w-full items-center justify-between px-4 py-3.5 text-left"
      style={{ borderBottom: '1px solid var(--dida-divider)' }}
    >
      <span className="text-[16px]">{label}</span>
      <span className="dida-muted"><IcChevronRight size={18} /></span>
    </button>
  );

  return (
    <div
      data-status-bar-foreground={isDark ? 'light' : 'dark'}
      className="dida-page flex h-full flex-col pt-10"
    >
      <div className="py-2 text-center text-[17px] font-semibold">{t('me.title')}</div>

      <div data-scroll-container="main" data-scroll-direction="vertical" className="min-h-0 flex-1 overflow-y-auto px-3 pb-6">
        <button {...bindTap('me.profile.open')} className="mb-4 flex w-full items-center gap-3 bg-transparent px-2 py-3 text-left">
          {avatarSrc?.startsWith('/') || avatarSrc?.startsWith('content://') || avatarSrc?.startsWith('blob:') ? (
            <AsyncFsImage path={avatarSrc} alt="avatar" className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E79] text-2xl">🐷</div>
          )}
          <div className="flex-1">
            <div className="text-[18px] font-semibold">{user.name}</div>
            <div className="mt-1 flex gap-2">
              <span className="rounded-md bg-[#2FBE8F] px-2 py-0.5 text-[11px] text-white">Lv.{user.level}</span>
              <span className="rounded-md bg-[#5A6270] px-2 py-0.5 text-[11px] text-white">{user.badges} Badges</span>
            </div>
          </div>
          <span className="dida-muted"><IcChevronRight size={18} /></span>
        </button>

        <div className="dida-card mb-4 overflow-hidden rounded-2xl">
          {realRows.map((r) => (
            <button
              key={r.key}
              {...bindTap(r.transition)}
              className="flex w-full items-center justify-between px-4 py-3.5 text-left"
              style={{ borderBottom: '1px solid var(--dida-divider)' }}
            >
              <span className="text-[16px]">{t(r.key)}</span>
              <span className="dida-muted"><IcChevronRight size={18} /></span>
            </button>
          ))}
          {toastRowsA.map((r) => (
            <ToastRow key={r.key} label={t(r.key)} id={r.id} />
          ))}
        </div>

        <div className="dida-card mb-4 overflow-hidden rounded-2xl">
          {toastRowsB.map((r) => (
            <ToastRow key={r.key} label={t(r.key)} id={r.id} />
          ))}
          <button
            {...bindTap('me.help.open')}
            className="flex w-full items-center justify-between px-4 py-3.5 text-left"
            style={{ borderBottom: '1px solid var(--dida-divider)' }}
          >
            <span className="text-[16px]">{t('me.help')}</span>
            <span className="dida-muted"><IcChevronRight size={18} /></span>
          </button>
          <button
            {...bindTap('me.about.open')}
            className="flex w-full items-center justify-between px-4 py-3.5 text-left"
          >
            <span className="text-[16px]">{t('me.about')}</span>
            <span className="dida-muted"><IcChevronRight size={18} /></span>
          </button>
        </div>

        <button {...bindTap('me.premium')} className="dida-card mb-4 flex w-full items-center justify-between rounded-2xl px-4 py-3.5">
          <span className="flex items-center gap-2 text-[16px]">
            <span style={{ color: accentHex }}><IcCrown size={20} /></span>
            {t('me.premium')}
          </span>
          <span className="dida-muted"><IcChevronRight size={18} /></span>
        </button>

        <button {...bindTap('me.signout.open')} className="dida-card w-full rounded-2xl px-4 py-3.5 text-center text-[16px] text-[#FF4D4F]">
          {t('me.signout')}
        </button>
      </div>

      {confirmOpen && (
        <div className="absolute inset-0 z-40 flex items-center justify-center">
          <div {...bindBack()} className="absolute inset-0 bg-black/60" aria-label="cancel" />
          <div className="dida-card dida-popover relative w-[78%] rounded-2xl p-5 text-center">
            <div className="mb-5 text-[16px]">{t('common.signoutConfirm')}</div>
            <div className="flex gap-3">
              <button {...bindBack()} className="flex-1 rounded-full bg-[#3A3A3C] py-2.5 text-[15px] text-white">{t('common.cancel')}</button>
              <button
                {...bindTap('me.signout.commit', { onTrigger: () => { logout(); go('me.signout.commit'); } })}
                className="flex-1 rounded-full py-2.5 text-[15px] text-white"
                style={{ background: '#FF4D4F' }}
              >
                {t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MePage;
