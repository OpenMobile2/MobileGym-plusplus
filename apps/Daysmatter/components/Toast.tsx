import { useEffect, useState } from 'react';
import { useDaysmatterStore } from '../state';

export default function Toast() {
  const toast = useDaysmatterStore((s) => s._temp.toast);
  const seq = useDaysmatterStore((s) => s._temp.toastSeq);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!toast) return;
    setVisible(true);
    const t = window.setTimeout(() => setVisible(false), 1800);
    return () => window.clearTimeout(t);
  }, [toast, seq]);

  if (!visible || !toast) return null;
  return (
    <div className="absolute inset-x-0 bottom-24 z-[300] flex justify-center pointer-events-none">
      <div className="max-w-[80%] rounded-lg bg-black/80 px-4 py-2.5 text-center text-sm text-white shadow-lg">
        {toast}
      </div>
    </div>
  );
}
