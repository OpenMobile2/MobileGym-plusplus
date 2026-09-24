import React from 'react';
import { ShieldAlert, Trash2 } from 'lucide-react';
import { useDidiGestures } from '../hooks/useDidiGestures';
import { useDidiStrings } from '../hooks/useDidiStrings';
import { useDidiStore } from '../state';
import { C, TopBar } from '../components/ui';

/** 永久注销确认。独立历史条目确保系统返回可以安全取消。 */
export default function SettingsAccountDeletePage() {
  const { bindBack, bindTap, go } = useDidiGestures();
  const clearPrivateData = useDidiStore((state) => state.clearPrivateData);
  const s = useDidiStrings();

  const confirmDelete = () => {
    clearPrivateData();
    go(
      'settings.account.delete.done',
      {},
      { mode: 'replace', popTo: '/me' },
    );
  };

  return (
    <div
      className="flex h-full flex-col bg-app-bg"
      data-status-bar-foreground="dark"
      data-testid="didi-account-delete-page"
    >
      <TopBar title={s.accountDelete} />
      <div className="flex-1 overflow-y-auto px-4 pt-8" data-scroll-container="main">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
            <ShieldAlert size={32} />
          </span>
          <h2 className="mt-5 text-[20px] font-bold text-app-text">{s.accountDeleteWarning}</h2>
          <p className="mt-3 max-w-[290px] text-[13px] leading-6 text-app-text-muted">
            {s.accountDeleteDescription}
          </p>
        </div>

        <div className="mt-8 rounded-lg border border-red-100 bg-red-50 px-4 py-3">
          <div className="flex items-start gap-2 text-[12px] leading-5 text-red-600">
            <Trash2 className="mt-0.5 shrink-0" size={16} />
            <span>{s.accountDeleteLocalOnly}</span>
          </div>
        </div>
      </div>

      <div className="shrink-0 space-y-2 px-4 pb-4">
        <button
          {...bindTap(
            { kind: 'action', id: 'settings.account.clearPrivateData' },
            { onTrigger: confirmDelete },
          )}
          className="flex w-full items-center justify-center gap-2 rounded-full border-none py-3 text-[15px] font-semibold text-white"
          style={{ background: C.red }}
        >
          <Trash2 size={17} />
          {s.accountDeleteConfirm}
        </button>
        <button
          {...bindBack()}
          className="w-full rounded-full border border-app-border bg-app-surface py-3 text-[15px] text-app-text"
        >
          {s.cancel}
        </button>
      </div>
    </div>
  );
}
