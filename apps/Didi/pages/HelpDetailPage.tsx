import React from 'react';
import { useDidiGestures } from '../hooks/useDidiGestures';
import { useDidiStore } from '../state';
import { TopBar, Card, C, MissingData } from '../components/ui';

/** 问题详情 —— 常规样式(问题+答案+有用/没用反馈)。 */
export default function HelpDetailPage() {
  const { bindTap } = useDidiGestures();
  const toast = useDidiStore((s) => s.toast);
  const helpFaqs = useDidiStore((s) => s.helpFaqs);
  const currentFaqId = useDidiStore((s) => s.currentFaqId);

  const faq = helpFaqs.find((f) => f.id === currentFaqId);

  const usefulBind = (useful: boolean) =>
    bindTap(
      { kind: 'action', id: 'help.detail.useful' },
      { onTrigger: () => toast('感谢反馈'), params: { useful: useful ? 1 : 0 } },
    );

  if (!faq) {
    return (
      <div className="flex h-full flex-col bg-app-bg" data-status-bar-foreground="dark">
        <TopBar title="问题详情" />
        <MissingData message="未找到对应问题，请返回客服页面重新选择。" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground="dark">
      <TopBar title="问题详情" />
      <div
        className="flex-1 overflow-y-auto px-3 pt-3"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <Card className="px-4 py-4">
          <div className="text-[16px] font-bold text-app-text">{faq.q}</div>
          <div className="text-[14px] text-app-text-muted leading-relaxed mt-3">{faq.a}</div>
        </Card>
      </div>

      <div className="shrink-0 px-4 py-4 border-t border-app-border bg-app-surface">
        <div className="text-[13px] text-app-text-muted text-center mb-3">
          以上内容是否解决了您的问题?
        </div>
        <div className="flex gap-3">
          <button
            {...usefulBind(true)}
            className="flex-1 py-2.5 rounded-full border-none text-[14px] font-medium"
            style={{ background: '#FFEFE5', color: C.orangeDeep }}
          >
            有用
          </button>
          <button
            {...usefulBind(false)}
            className="flex-1 py-2.5 rounded-full text-[14px] border border-app-border bg-transparent text-app-text-muted"
          >
            没用
          </button>
        </div>
      </div>
    </div>
  );
}
