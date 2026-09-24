import React, { useEffect, useState } from 'react';
import * as TimeService from '../../../os/TimeService';
import { useDidaTheme } from '../hooks/useDidaTheme';
import { useDidaStore } from '../state';

/** 「暂未开放」等一次性提示宿主。挂在 Layout 一次即可。 */
const Toast: React.FC = () => {
  const toast = useDidaStore((s) => s._temp.toast);
  const seq = useDidaStore((s) => s._temp.toastSeq);
  const { isDark } = useDidaTheme();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!toast || seq === 0) return;
    setVisible(true);
    const startedAt = TimeService.realNow();
    const timer = window.setInterval(() => {
      if (TimeService.realNow() - startedAt >= 1800) {
        setVisible(false);
        window.clearInterval(timer);
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [toast, seq]);

  if (!visible || !toast) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-[999] flex items-center justify-center">
      <div
        className={`max-w-[80%] rounded-2xl px-5 py-3 text-center text-sm shadow-lg ${
          isDark ? 'dida-on-color bg-black/80 text-white' : 'border border-[color:var(--dida-divider)] bg-white text-[color:var(--dida-text)]'
        }`}
      >
        {toast}
      </div>
    </div>
  );
};

export default Toast;
