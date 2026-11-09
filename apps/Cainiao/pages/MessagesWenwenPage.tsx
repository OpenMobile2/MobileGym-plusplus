import React, { useEffect, useRef } from 'react';
import { useDarkMode } from '../../../os/hooks/useDarkMode';
import TopBar from '../components/TopBar';
import { useCainiaoGestures } from '../hooks/useCainiaoGestures';
import { useCainiaoStore } from '../state';
import { fmtMdHm } from '../utils/appTime';
import { useI18n } from '../i18n';

/** 菜鸟问问消息(spec messages.wenwen):列表可看;进入拉到底;点击 toast */
export default function MessagesWenwenPage() {
  const { isDark } = useDarkMode();
  const { action } = useCainiaoGestures();
  const { t } = useI18n();
  const msgs = useCainiaoStore((s) => s.wenwenMsgs);
  const readChannel = useCainiaoStore((s) => s.readChannel);
  const showToast = useCainiaoStore((s) => s.showToast);
  const wontfix = () => showToast(t('common.notOpen'));
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    readChannel('wenwen');
  }, [readChannel]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [msgs.length]);

  return (
    <div className="flex h-full flex-col bg-(--app-c-page-bg)" data-status-bar-foreground={isDark ? 'light' : 'dark'}>
      <TopBar
        title="菜鸟问问消息"
        right={
          <button {...action('messages.wenwen.settings.wontfixToast', wontfix)} className="cursor-pointer border-none bg-transparent text-[14px] text-(--app-c-text-primary)">
            设置
          </button>
        }
      />
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto px-3 pb-4"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {msgs.map((m) => (
          <div key={m.id}>
            <div className="py-2.5 text-center text-[12px] text-(--app-c-text-muted)">{fmtMdHm(m.ts)}</div>
            <div className="flex items-start gap-2.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#12C2C2] text-[20px] text-white">☺</span>
              <button
                {...action('messages.wenwen.item.wontfixToast', wontfix)}
                className="min-w-0 flex-1 cursor-pointer rounded-xl border-none bg-(--app-c-card-bg) p-3 text-left"
              >
                <div className="text-[16px] font-bold text-(--app-c-text-primary)">{m.title}</div>
                <div className="mt-1 text-[13px] text-(--app-c-text-secondary)">{m.desc}</div>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
