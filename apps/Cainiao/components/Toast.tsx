import React, { useEffect, useRef, useState } from 'react';
import * as TimeService from '../../../os/TimeService';
import { useCainiaoStore } from '../state';

/** 全局 toast:监听 _temp.toastSeq,1.8s 自动淡出 */
export default function Toast() {
  const toast = useCainiaoStore((s) => s._temp.toast);
  const seq = useCainiaoStore((s) => s._temp.toastSeq);
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

  void TimeService; // TimeService 不需要,但保持 import 约定一致
  if (!visible || !toast) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-1/2 z-50 flex justify-center">
      <div className="max-w-[80%] rounded-lg bg-black/75 px-4 py-2.5 text-center text-[13px] leading-5 text-white">
        {toast}
      </div>
    </div>
  );
}
