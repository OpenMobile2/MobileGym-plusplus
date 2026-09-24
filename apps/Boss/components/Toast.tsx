import React, { useEffect, useState } from 'react';
import { useBossStore } from '../state';

const Toast: React.FC = () => {
  const toast = useBossStore((s) => s._temp.toast);
  const toastSeq = useBossStore((s) => s._temp.toastSeq);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!toast) return;
    setMsg(toast);
    const t = setTimeout(() => setMsg(''), 1600);
    return () => clearTimeout(t);
  }, [toast, toastSeq]);

  if (!msg) return null;
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2">
      <div className="max-w-[70vw] rounded-xl bg-black/75 px-4 py-2.5 text-center text-sm text-white">{msg}</div>
    </div>
  );
};

export default Toast;
