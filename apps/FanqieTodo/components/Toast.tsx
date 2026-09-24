import React, { useEffect, useState } from 'react';
import * as TimeService from '../../../os/TimeService';
import { useFanqieTodoStore } from '../state';

/** wontfix「该功能暂未开放」及其它一次性提示的宿主。挂在 Layout 一次即可。 */
const Toast: React.FC = () => {
  const toast = useFanqieTodoStore((s) => s._temp.toast);
  const seq = useFanqieTodoStore((s) => s._temp.toastSeq);
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
      <div className="max-w-[80%] rounded-2xl bg-black/78 px-5 py-3 text-center text-sm text-white shadow-lg">
        {toast}
      </div>
    </div>
  );
};

export default Toast;
