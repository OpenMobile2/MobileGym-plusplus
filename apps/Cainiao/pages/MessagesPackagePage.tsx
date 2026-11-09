import React, { useEffect, useRef } from 'react';
import { useDarkMode } from '../../../os/hooks/useDarkMode';
import Img from '../components/Img';
import TopBar from '../components/TopBar';
import { useCainiaoGestures } from '../hooks/useCainiaoGestures';
import { useCainiaoStore } from '../state';
import { fmtMdHm } from '../utils/appTime';
import { useI18n } from '../i18n';

/** 包裹消息(spec messages.package):进入清零角标;新消息在底,进入拉到底 */
export default function MessagesPackagePage() {
  const { isDark } = useDarkMode();
  const { bindTap, action } = useCainiaoGestures();
  const { t } = useI18n();
  const msgs = useCainiaoStore((s) => s.packageMsgs);
  const readChannel = useCainiaoStore((s) => s.readChannel);
  const showToast = useCainiaoStore((s) => s.showToast);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    readChannel('package');
  }, [readChannel]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // 新消息在最下方:进入时滚到底(阶段⑥ 0731)
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [msgs.length]);

  return (
    <div className="flex h-full flex-col bg-(--app-c-page-bg)" data-status-bar-foreground={isDark ? 'light' : 'dark'}>
      <TopBar
        title="包裹消息"
        right={
          <button
            {...action('messages.package.settings.wontfixToast', () => showToast(t('common.notOpen')))}
            className="cursor-pointer border-none bg-transparent text-[14px] text-(--app-c-text-primary)"
          >
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
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#39B54A] text-[20px] text-white">▣</span>
              <button
                {...bindTap('messages.package.item.open', { params: { packageId: m.packageId ?? '' } })}
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-xl border-none bg-(--app-c-card-bg) p-3 text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[16px] font-bold text-(--app-c-text-primary)">{m.title}</div>
                  <div className="mt-1 text-[13px] leading-5 text-(--app-c-text-secondary)">{m.desc}</div>
                </div>
                {m.image && <Img src={m.image} className="h-14 w-14 shrink-0 rounded-lg border border-(--app-c-border) object-cover" />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
