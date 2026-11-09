import React from 'react';
import { useDidiGestures } from '../hooks/useDidiGestures';
import { useDidiStore } from '../state';
import { TopBar, C, MissingData } from '../components/ui';

/** 消息线程(安全/租车/企业/保险/支付) —— 证据 s06、s08、s09、s10、s11 */
export default function MessageThreadPage() {
  const { bindTap, back } = useDidiGestures();
  const toast = useDidiStore((s) => s.toast);
  const clearMessageThread = useDidiStore((s) => s.clearMessageThread);
  const threads = useDidiStore((s) => s.messageThreads);
  const currentThreadId = useDidiStore((s) => s.currentThreadId);

  const thread = threads.find((t) => t.id === currentThreadId);
  if (!thread) {
    return (
      <div className="flex h-full flex-col bg-app-bg" data-status-bar-foreground="dark">
        <TopBar title="消息详情" />
        <MissingData message="这条消息已不存在，请返回消息列表重新选择。" />
      </div>
    );
  }
  const isPay = thread.kind === 'pay';

  return (
    <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground="dark">
      <TopBar
        title={thread.title}
        right={(
          <button
            {...bindTap(
              { kind: 'action', id: 'message.thread.clear' },
              { onTrigger: () => { clearMessageThread(thread.id); back(); } },
            )}
            className="bg-transparent border-none p-1 text-app-text"
            aria-label="清扫"
          >
            🧹
          </button>
        )}
      />
      <div
        className="flex-1 overflow-y-auto px-3 pb-6"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {thread.items.map((item, i) => (
          <div key={i}>
            <div className="text-center text-[12px] text-app-text-muted pt-4 pb-2">{item.time}</div>
            <div className="bg-app-surface rounded-xl px-4 py-3.5">
              {isPay && (
                <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-app-border">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] text-white"
                    style={{ background: C.orange }}
                  >
                    ¥
                  </span>
                  <span className="text-[13px] text-app-text">支付助手</span>
                </div>
              )}
              <div className="text-[16px] font-semibold text-app-text">{item.title}</div>
              <div className="text-[14px] text-app-text-muted leading-relaxed mt-1.5">{item.body}</div>
              <div className="text-[12px] text-app-text-muted mt-2">{item.time}</div>
              {isPay && (
                <button
                  onClick={() => toast('该功能暂未开放')}
                  className="flex items-center w-full mt-2 pt-2 border-t border-app-border bg-transparent border-x-0 border-b-0 text-left"
                >
                  <span className="flex-1 text-[13px]" style={{ color: C.blue }}>一键报销 · 滴滴发票</span>
                  <span className="text-app-text-muted text-[13px]">›</span>
                </button>
              )}
            </div>
          </div>
        ))}
        <div className="text-center text-[12px] text-app-text-muted py-4">没有更多消息了</div>
      </div>
    </div>
  );
}
