import React, { useEffect, useRef, useState } from 'react';
import { useSuningStore } from '../state';
import * as TimeService from '../../../os/TimeService';

/** 黑色半透明居中 Toast(真机样式);toastSeq 变化即重新展示 */
export default function Toast() {
  const toast = useSuningStore((s) => s._temp.toast);
  const seq = useSuningStore((s) => s._temp.toastSeq);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<number | null>(null);
  const shownAtRef = useRef(0);

  useEffect(() => {
    if (seq === 0 || !toast) return undefined;
    setVisible(true);
    shownAtRef.current = TimeService.realNow();
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setVisible(false);
      timerRef.current = null;
    }, 1800);
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [seq, toast]);

  if (!visible || !toast) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-1/2 z-50 flex -translate-y-1/2 justify-center">
      <div className="max-w-[80%] rounded-lg bg-black/75 px-4 py-2.5 text-center text-[13px] leading-5 text-white">
        {toast}
      </div>
    </div>
  );
}
