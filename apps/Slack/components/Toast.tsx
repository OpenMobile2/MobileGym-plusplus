import React, { useEffect, useState } from 'react';
import * as TimeService from '../../../os/TimeService';
import { useI18n } from '../i18n';
import { useSlackStore } from '../state';

/** 「该功能暂未开放」「已复制」等一次性提示宿主。挂在 Layout 一次即可。 */
const Toast: React.FC = () => {
  const { t } = useI18n();
  const toast = useSlackStore((s) => s._temp.toast);
  const toastKey = useSlackStore((s) => s._temp.toastKey);
  const seq = useSlackStore((s) => s._temp.toastSeq);
  const [visible, setVisible] = useState(false);

  const text = toastKey ? t(toastKey) : toast;

  useEffect(() => {
    if (seq === 0) return;
    setVisible(true);
    const startedAt = TimeService.realNow();
    const timer = window.setInterval(() => {
      if (TimeService.realNow() - startedAt >= 1800) {
        setVisible(false);
        window.clearInterval(timer);
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [seq]);

  if (!visible || !text) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-[999] flex items-center justify-center">
      <div className="max-w-[80%] rounded-lg bg-[#1D1C1D]/90 px-5 py-3 text-center text-sm text-white shadow-lg">
        {text}
      </div>
    </div>
  );
};

export default Toast;
