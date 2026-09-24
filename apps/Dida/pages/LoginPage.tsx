import React from 'react';
import { useDidaGestures } from '../hooks/useDidaGestures';
import { useDidaTheme } from '../hooks/useDidaTheme';
import { useDidaStore } from '../state';
import { useI18n } from '../i18n';
import { IcClose } from '../res/icons';

const LoginPage: React.FC = () => {
  const { t } = useI18n();
  const { bindTap, go } = useDidaGestures();
  const { isDark } = useDidaTheme();
  const login = useDidaStore((s) => s.login);

  // onTrigger 会覆盖默认的 execute(不走导航),故在此手动 go 完成假登录进入主页
  const doLogin = () => { login(); go('login.enter'); };

  return (
    <div data-status-bar-foreground={isDark ? 'light' : 'dark'} className="dida-page flex h-full flex-col pt-10">
      <div className="px-4 py-2">
        <button {...bindTap('login.enter', { onTrigger: doLogin })} aria-label="close" className="flex h-10 w-10 items-center justify-center bg-transparent text-white"><IcClose size={24} /></button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-8">
        <div className="mb-6 flex h-40 w-40 items-center justify-center rounded-3xl bg-[#1A2540] text-6xl">📋</div>
        <div className="text-center text-[18px] text-white">Create reminders and repetitions for tasks.</div>
      </div>

      <div className="flex flex-col gap-3 px-6 pb-12">
        <button {...bindTap('login.enter', { onTrigger: doLogin })} className="flex items-center justify-center gap-2 rounded-xl bg-[#1C1C1E] py-3.5 text-[16px] text-white">
          <span style={{ color: '#2DC100' }}>💬</span> {t('login.wechat')}
        </button>
        <button {...bindTap('login.enter', { onTrigger: doLogin })} className="flex items-center justify-center gap-2 rounded-xl bg-[#1C1C1E] py-3.5 text-[16px] text-white">
          <span style={{ color: '#4772F5' }}>👤</span> {t('login.phone')}
        </button>
        <button {...bindTap('login.enter', { onTrigger: doLogin })} className="flex items-center justify-center gap-2 rounded-xl bg-[#1C1C1E] py-3.5 text-[16px] text-white">
          <span></span> {t('login.apple')}
        </button>
        <button {...bindTap('login.enter', { onTrigger: doLogin })} className="py-2 text-center text-[15px] text-[#8E8E93]">{t('login.more')}</button>
      </div>
    </div>
  );
};

export default LoginPage;
