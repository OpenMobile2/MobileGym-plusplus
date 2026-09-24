import React, { useRef } from 'react';
import { pickImages } from '@/os/albumBridge';
import { AsyncFsImage } from '@/os/components/AsyncFsImage';
import { useDidaStore } from '../state';
import { useDidaGestures } from '../hooks/useDidaGestures';
import { useDidaTheme } from '../hooks/useDidaTheme';
import { useI18n } from '../i18n';
import { IcBack } from '../res/icons';

const ProfilePage: React.FC = () => {
  const { t } = useI18n();
  const { action, bindBack } = useDidaGestures();
  const { isDark } = useDidaTheme();
  const user = useDidaStore((s) => s.user);
  const setUser = useDidaStore((s) => s.setUser);
  const showToast = useDidaStore((s) => s.showToast);
  const nameRef = useRef<HTMLInputElement>(null);
  const sigRef = useRef<HTMLInputElement>(null);

  const pickAvatar = () => {
    void pickImages({ multiple: false, maxSelect: 1 }).then((result) => {
      if (result.cancelled || !result.selected.length) return;
      const selected = result.selected[0];
      setUser({ avatar: selected.path || selected.uri });
    }).catch(() => showToast(t('common.notAvailable')));
  };

  const avatarSrc = user.avatar?.trim();

  return (
    <div data-status-bar-foreground={isDark ? 'light' : 'dark'} className="dida-page flex h-full flex-col pt-10">
      <div className="flex items-center px-3 py-2">
        <button {...bindBack()} aria-label="back" className="dida-card flex h-10 w-10 items-center justify-center rounded-full"><IcBack size={20} /></button>
        <span className="ml-2 text-[17px] font-semibold">{t('profile.title')}</span>
      </div>

      <div data-scroll-container="main" data-scroll-direction="vertical" className="min-h-0 flex-1 overflow-y-auto px-4 pt-4">
        {/* 头像 */}
        <button {...action('profile.avatar.pick', pickAvatar)} className="mx-auto flex flex-col items-center gap-2 bg-transparent">
          {avatarSrc?.startsWith('/') || avatarSrc?.startsWith('content://') || avatarSrc?.startsWith('blob:') ? (
            <AsyncFsImage path={avatarSrc} alt="avatar" className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#E79] text-4xl">🐷</div>
          )}
          <span className="dida-muted text-[13px]">{t('profile.avatar')}</span>
        </button>

        {/* 昵称 */}
        <div className="dida-card mt-6 rounded-2xl px-4">
          <div className="flex items-center justify-between py-3.5" style={{ borderBottom: '1px solid var(--dida-divider)' }}>
            <span className="dida-muted text-[15px]">{t('profile.nickname')}</span>
            <input
              ref={nameRef}
              {...action('profile.nickname.input', () => { /* onChange */ }, { params: { value: user.name } })}
              defaultValue={user.name}
              onChange={(e) => setUser({ name: e.target.value })}
              className="flex-1 bg-transparent text-right text-[16px] outline-none"
              style={{ color: 'var(--dida-text)' }}
            />
          </div>
          <div className="flex items-center justify-between py-3.5">
            <span className="dida-muted text-[15px]">{t('profile.signature')}</span>
            <input
              ref={sigRef}
              {...action('profile.signature.input', () => { /* onChange */ }, { params: { value: user.signature } })}
              defaultValue={user.signature}
              onChange={(e) => setUser({ signature: e.target.value })}
              className="flex-1 bg-transparent text-right text-[16px] outline-none"
              style={{ color: 'var(--dida-text)' }}
            />
          </div>
        </div>

        <div className="mt-4 flex gap-2 px-1">
          <span className="rounded-md bg-[#2FBE8F] px-2 py-0.5 text-[11px] text-white">Lv.{user.level}</span>
          <span className="rounded-md bg-[#5A6270] px-2 py-0.5 text-[11px] text-white">{user.badges} Badges</span>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
