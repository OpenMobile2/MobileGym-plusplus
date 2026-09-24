import React, { useEffect, useRef, useState } from 'react';
import { useDianpingStore } from '../state';

export default function Toast() {
  const toast = useDianpingStore((s) => s._temp.toast);
  const seq = useDianpingStore((s) => s._temp.toastSeq);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSeqRef = useRef(0);

  useEffect(() => {
    if (seq === 0 || seq === lastSeqRef.current) return;
    lastSeqRef.current = seq;
    setVisible(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(false), 1800);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [seq]);

  if (!visible || !toast) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-1/2 z-[60] flex justify-center">
      <div className="max-w-[80%] rounded-lg bg-black/75 px-4 py-2.5 text-center text-[13px] leading-5 text-white">
        {toast}
      </div>
    </div>
  );
}
