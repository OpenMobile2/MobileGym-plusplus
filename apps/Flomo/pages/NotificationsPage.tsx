import React, { useEffect } from 'react';
import { useFlomoStore } from '../state';
import { useFlomoGestures } from '../hooks/useFlomoGestures';
import { C } from '../components/ui';
import { fullTime } from '../utils/format';
import { IcClose } from '../res/icons';

// 每条通知按索引循环取一个 emoji,贴近真实截图的图标风格。
const EMOJIS = ['📅', '📊', '🎉'];

// 正文里出现的 CTA 词高亮为链接蓝,复刻截图中的蓝色内联链接。
const LINK_WORDS = ['点击续费', '点此查看', '续费', '报告', '查看'];

// 续费类 CTA 词:真实跳转 /pro/intro(其余链接词仅保留蓝色文本)。
const RENEW_WORDS = ['点击续费', '续费'];

function renderBody(
  text: string,
  renewProps: () => React.HTMLAttributes<HTMLSpanElement>,
) {
  const re = new RegExp(`(${LINK_WORDS.join('|')})`, 'g');
  const parts = text.split(re).filter((p) => p !== '');
  return parts.map((p, i) => {
    if (RENEW_WORDS.includes(p)) {
      return (
        <span key={i} {...renewProps()} style={{ color: C.linkBlue }}>
          {p}
        </span>
      );
    }
    if (LINK_WORDS.includes(p)) {
      return (
        <span key={i} style={{ color: C.linkBlue }}>
          {p}
        </span>
      );
    }
    return <React.Fragment key={i}>{p}</React.Fragment>;
  });
}

export default function NotificationsPage() {
  const { bindBack, bindTap } = useFlomoGestures();
  const notifications = useFlomoStore((s) => s.notifications);
  const markRead = useFlomoStore((s) => s.markNotificationsRead);
  const toast = useFlomoStore((s) => s.toast);

  useEffect(() => {
    markRead();
  }, [markRead]);

  // 「点击续费」/「续费」内联链接 → /pro/intro;stopPropagation 避免触发外层 item.open。
  const renewProps = () =>
    bindTap('notifications.pro-open', { stopPropagation: true }) as React.HTMLAttributes<HTMLSpanElement>;

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      <div className="flex items-center h-11 px-2 shrink-0">
        <button
          {...bindBack()}
          className="w-10 flex items-center justify-center bg-transparent border-none cursor-pointer"
          style={{ color: C.text }}
          aria-label="关闭"
        >
          <IcClose size={22} />
        </button>
        <div className="flex-1 text-center font-semibold text-base" style={{ color: C.text }}>
          消息通知
        </div>
        <div className="w-10" />
      </div>

      <div
        className="flex-1 overflow-y-auto px-4 pt-2 pb-6"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {notifications.length === 0 ? (
          <div className="py-20 text-center text-sm" style={{ color: C.sub }}>
            暂无消息
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {notifications.map((n, idx) => {
              const nl = n.text.indexOf('\n');
              const hasTitle = nl > 0;
              const title = hasTitle ? n.text.slice(0, nl) : '';
              const body = hasTitle ? n.text.slice(nl + 1) : n.text;
              const emoji = EMOJIS[idx % EMOJIS.length];
              return (
                <div key={n.id}>
                  <div className="mb-1.5" style={{ color: C.sub, fontSize: 12 }}>
                    {fullTime(n.createdAt)}
                  </div>
                  <button
                    {...bindTap(
                      { kind: 'action', id: 'notifications.item.open' },
                      { onTrigger: () => toast('该功能暂未开放') },
                    )}
                    className="w-full text-left rounded-2xl px-4 py-3.5 border-none cursor-pointer"
                    style={{ background: C.surface }}
                  >
                    <div
                      className="flex items-center gap-1.5"
                      style={{ color: C.text, fontSize: 15, fontWeight: 600 }}
                    >
                      <span style={{ fontSize: 16 }}>{emoji}</span>
                      {hasTitle ? <span>{title}</span> : null}
                    </div>
                    <div
                      className="mt-1.5 whitespace-pre-wrap break-words"
                      style={{ color: C.sub, fontSize: 14, lineHeight: 1.6 }}
                    >
                      {renderBody(body, renewProps)}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
