import React, { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useYoukuStore } from '../state';
import { useYoukuGestures } from '../hooks/useYoukuGestures';
import { useI18n } from '../i18n';
import { WONTFIX_TOAST } from '../constants';
import { fmtMdHm } from '../utils/appTime';
import { IcBack, IcMore, IcBell, IcHeart } from '../components/msgpub/icons';

/** spec 节点 msg.system(route /messages/system/:convId)—— 官方会话详情页(s216,convId=system/vip) */
export default function MsgSystemPage() {
  const { convId: rawConvId } = useParams();
  const convId: 'vip' | 'system' = rawConvId === 'vip' ? 'vip' : 'system';

  const { action, bindBack } = useYoukuGestures();
  const { t } = useI18n();
  const conversations = useYoukuStore((s) => s.conversations);
  const markRead = useYoukuStore((s) => s.markRead);
  const showToast = useYoukuStore((s) => s.showToast);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 进入清零未读(幂等,StrictMode 安全)
  useEffect(() => {
    markRead(convId);
  }, [markRead, convId]);

  // 会话流:旧→新
  const msgs = [...conversations[convId]].sort((a, b) => a.ts - b.ts);

  // 最新在底部:进页滚到底
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [convId, msgs.length]);

  return (
    <div
      className="flex h-full w-full flex-col bg-(--app-c-page-bg) pt-10 text-(--app-c-text-primary)"
    >
      <div className="flex h-11 shrink-0 items-center px-3">
        <button
          {...bindBack()}
          aria-label={t('common.back')}
          className="flex h-8 w-8 cursor-pointer items-center justify-center border-none bg-transparent p-0 text-(--app-c-text-primary)"
        >
          <IcBack size={24} strokeWidth={2.5} />
        </button>
        <span className="flex-1 text-center text-[17px] font-bold">
          {convId === 'vip' ? t('msg.center.vipName') : t('msg.center.systemName')}
        </span>
        <button
          {...action('msg.system.more.wontfixToast', () => showToast(WONTFIX_TOAST))}
          className="flex h-8 w-8 cursor-pointer items-center justify-center border-none bg-transparent p-0 text-(--app-c-text-primary)"
        >
          <IcMore size={20} strokeWidth={2} />
        </button>
      </div>

      <div
        ref={scrollRef}
        data-scroll-container="main"
        data-scroll-direction="vertical"
        className="min-h-0 flex-1 overflow-y-auto px-3 pb-6"
      >
        {msgs.map((m) => (
          <div key={m.id}>
            {/* 时间分段胶囊 */}
            <div className="flex justify-center pb-3 pt-5">
              <span className="rounded-full bg-(--app-c-chip-bg) px-3 py-1 text-[12px] text-[#999999]">
                {fmtMdHm(m.ts)}
              </span>
            </div>
            {/* 官方通知气泡(纯文本,无按钮 affordance,不建模点击) */}
            <div className="flex items-start gap-2.5">
              {convId === 'vip' ? (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#F08A5C] to-[#E85A7A]">
                  <IcHeart size={18} strokeWidth={0} fill="#FFFFFF" />
                </div>
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2BC8B4]">
                  <IcBell size={18} strokeWidth={0} fill="#FFFFFF" />
                </div>
              )}
              <div className="max-w-[268px] rounded-2xl rounded-tl-md bg-(--app-c-card-bg) px-3.5 py-3 text-[15px] leading-[24px] text-(--app-c-text-primary)">
                {m.text}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
