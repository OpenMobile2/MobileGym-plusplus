import React, { useCallback, useState } from 'react';
import { ConfirmDialog, PromptDialog } from '../components/Sheet';

type ConfirmReq = { title: string; desc?: string; danger?: boolean; onConfirm: () => void };
type PromptReq = { title: string; placeholder?: string; initial?: string; onConfirm: (v: string) => void };

/**
 * App 内确认框 / 输入框。
 *
 * Gate4 走查订正:此前直接用 window.confirm / window.prompt —— 操作员一眼看出「怎么是浏览器输入」。
 * 原生弹窗既不像真机,也会阻塞 OS 层的手势与返回键分发。
 *
 * 用法:
 *   const { dialogs, confirm, prompt } = useDialogs();
 *   ... <button onClick={() => confirm({ title: '删除习惯?', danger: true, onConfirm: doDelete })} />
 *   return <div>{...}{dialogs}</div>
 */
export function useDialogs() {
  const [confirmReq, setConfirmReq] = useState<ConfirmReq | null>(null);
  const [promptReq, setPromptReq] = useState<PromptReq | null>(null);

  const confirm = useCallback((req: ConfirmReq) => setConfirmReq(req), []);
  const prompt = useCallback((req: PromptReq) => setPromptReq(req), []);

  const dialogs = (
    <>
      {confirmReq && (
        <ConfirmDialog title={confirmReq.title} desc={confirmReq.desc} danger={confirmReq.danger}
          onCancel={() => setConfirmReq(null)}
          onConfirm={() => { setConfirmReq(null); confirmReq.onConfirm(); }} />
      )}
      {promptReq && (
        <PromptDialog title={promptReq.title} placeholder={promptReq.placeholder} initial={promptReq.initial}
          onCancel={() => setPromptReq(null)}
          onConfirm={(v) => { setPromptReq(null); promptReq.onConfirm(v); }} />
      )}
    </>
  );

  return { dialogs, confirm, prompt };
}
