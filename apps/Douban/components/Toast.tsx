import React, { useEffect } from 'react';
import { useDoubanStore } from '../state';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { C } from './ui';

function needsConfirm(msg: string | null): boolean {
  return Boolean(msg && (msg.includes('暂未开放') || msg.includes('需要加入') || msg.toLowerCase().includes('not available')));
}

/** 轻量 toast；未开放 / 需确认的提示升级为必须点「我知道了」的弹窗。 */
export function Toast() {
  const lastToast = useDoubanStore((s) => s.lastToast);
  const toast = useDoubanStore((s) => s.toast);
  const { bindTap } = useDoubanGestures();
  const confirm = needsConfirm(lastToast);

  useEffect(() => {
    if (!lastToast || confirm) return;
    const t = window.setTimeout(() => toast(null), 1600);
    return () => window.clearTimeout(t);
  }, [lastToast, confirm, toast]);

  if (!lastToast) return null;
  if (confirm) {
    return (
      <div className="absolute inset-0 z-[70] flex items-center justify-center px-8">
        <div className="absolute inset-0 bg-black/45" />
        <div role="alertdialog" aria-modal="true" aria-labelledby="douban-not-open-title" className="relative w-full rounded-2xl px-5 pt-6 pb-4 shadow-xl" style={{ background: C.surface }}>
          <div id="douban-not-open-title" className="text-center font-semibold text-[16px]" style={{ color: C.text }}>提示</div>
          <div className="mt-2 mb-4 text-center text-[13px]" style={{ color: C.sub }}>{lastToast}</div>
          <button
            autoFocus
            {...bindTap({ kind: 'action', id: 'global.notOpen.confirm' }, { onTrigger: () => toast(null) })}
            className="w-full rounded-full border-none py-2.5 text-white"
            style={{ background: C.green }}
          >
            我知道了
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="absolute left-1/2 bottom-24 -translate-x-1/2 z-50 max-w-[80%] px-4 py-2 rounded-lg bg-black/75 text-white text-sm pointer-events-none">
      {lastToast}
    </div>
  );
}
