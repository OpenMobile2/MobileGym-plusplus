import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { useDidiGestures } from '../hooks/useDidiGestures';
import { useDidiStore } from '../state';
import { C } from '../components/ui';
import type { DidiMessageThread } from '../types';
import { useDidiStrings } from '../hooks/useDidiStrings';
import {
  IcSafety, IcServiceRental, IcBuilding, IcUmbrella, IcPay,
  IcTabMessages, IcSettings, IcTrash,
} from '../res/icons';

/** 消息中心(tab 页,自绘头部) —— 证据 s05、n22 */

const KIND_ICON: Record<DidiMessageThread['kind'], { Icon: LucideIcon; color: string; bg: string }> = {
  safety: { Icon: IcSafety, color: '#3B82F6', bg: '#E3EEFF' },
  rental: { Icon: IcServiceRental, color: '#F59E0B', bg: '#FFF3E0' },
  enterprise: { Icon: IcBuilding, color: '#3B82F6', bg: '#E3F0FF' },
  insurance: { Icon: IcUmbrella, color: '#0D9488', bg: '#E0F7F4' },
  pay: { Icon: IcPay, color: '#D97706', bg: '#FFF7DC' },
};

export default function MessagesCenterPage() {
  const { bindTap } = useDidiGestures();
  const toast = useDidiStore((s) => s.toast);
  const openThread = useDidiStore((s) => s.openThread);
  const markMessagesRead = useDidiStore((s) => s.markMessagesRead);
  const clearMessages = useDidiStore((s) => s.clearMessages);
  const threads = useDidiStore((s) => s.messageThreads);
  const [bannerOn, setBannerOn] = React.useState(true);
  const s = useDidiStrings();

  const payThread = threads.find((t) => t.kind === 'pay');

  React.useEffect(() => {
    markMessagesRead();
  }, [markMessagesRead]);

  return (
    <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground="dark">
      <div className="flex items-center px-4 h-12 shrink-0 bg-app-surface">
        <div className="flex-1 text-[20px] font-bold text-app-text">{s.messagesTitle}</div>
        <button
          {...bindTap(
            { kind: 'action', id: 'messages.center.clear' },
            { onTrigger: () => clearMessages() },
          )}
          disabled={threads.length === 0}
          className="bg-transparent border-none p-1.5 text-app-text"
          aria-label="清扫"
        >
          <IcTrash size={18} />
        </button>
        <button
          onClick={() => toast('消息设置暂未开放')}
          className="bg-transparent border-none p-1.5 text-app-text"
          aria-label="消息设置"
        >
          <IcSettings size={18} />
        </button>
      </div>

      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {bannerOn && (
          <div className="flex items-center px-3 py-2" style={{ background: '#FFF6E8' }}>
            <span className="flex-1 text-[12px]" style={{ color: C.orangeDeep }}>
              为避免错过重要通知,请点击开启消息提醒
            </span>
            <button
              onClick={() => {
                setBannerOn(false);
                toast('消息提醒已开启');
              }}
              className="text-[12px] rounded-full px-2.5 py-0.5 mr-2 bg-transparent"
              style={{ color: C.orangeDeep, border: `1px solid ${C.orangeDeep}` }}
            >
              去开启
            </button>
            <button
              onClick={() => setBannerOn(false)}
              className="bg-transparent border-none p-0 text-app-text-muted text-[14px]"
              aria-label="关闭提示"
            >
              ✕
            </button>
          </div>
        )}

        <div className="flex gap-2 px-3 pt-3">
          <button
            {...bindTap('chat.fromMessages')}
            className="relative shrink-0 w-[88px] rounded-xl border-none flex flex-col items-center justify-center py-3"
            style={{ background: '#EFF4FA' }}
          >
            <span className="text-[15px] font-semibold" style={{ color: C.blue }}>对话</span>
            <IcTabMessages size={22} className="mt-1" style={{ color: C.blue }} />
          </button>
          {payThread && <button
            {...bindTap('message.thread.open', { beforeTrigger: () => openThread('t_pay') })}
            className="relative flex-1 rounded-xl border-none text-left px-3 py-2.5"
            style={{ background: '#EFF4FA' }}
          >
            {payThread && payThread.unread > 0 && (
              <span
                className="absolute -top-1.5 right-2 min-w-[22px] text-center text-[11px] text-white rounded-full px-1.5 py-0.5"
                style={{ background: C.red }}
              >
                {payThread.unread}
              </span>
            )}
            <div className="flex items-center gap-1">
              <IcPay size={14} style={{ color: '#0AA173' }} />
              <span className="text-[15px] font-semibold" style={{ color: '#0AA173' }}>支付</span>
              <span className="text-[13px] text-app-text-muted">›</span>
            </div>
            <div className="text-[14px] font-semibold text-app-text mt-0.5 truncate">
              {payThread?.items[0]?.title ?? '免密支付成功'}
            </div>
            <div className="text-[12px] text-app-text-muted truncate">
              {payThread?.items[0]?.body ?? ''}
            </div>
          </button>}
        </div>

        <div className="mt-2">
          {threads.map((t) => {
            const meta = KIND_ICON[t.kind];
            const Icon = meta.Icon;
            return (
              <button
                key={t.id}
                {...bindTap('message.thread.open', { beforeTrigger: () => openThread(t.id) })}
                className="flex items-center w-full px-4 py-3.5 bg-transparent border-none text-left border-b border-app-border"
              >
                <span
                  className="w-11 h-11 rounded-full flex items-center justify-center mr-3 shrink-0"
                  style={{ background: meta.bg }}
                >
                  <Icon size={20} style={{ color: meta.color }} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[16px] font-semibold text-app-text truncate">{t.title}</span>
                  <span className="block text-[13px] text-app-text-muted truncate mt-0.5">{t.preview}</span>
                </span>
                <span className="flex flex-col items-end ml-2 shrink-0">
                  <span className="text-[12px] text-app-text-muted">{t.items[0]?.time.split(' ')[0] ?? ''}</span>
                  {t.unread > 0 && (
                    <span
                      className="mt-1.5 min-w-[20px] text-center text-[11px] text-white rounded-full px-1.5 py-0.5"
                      style={{ background: C.red }}
                    >
                      {t.unread}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
        {threads.length === 0 && (
          <div className="pt-24 text-center text-[14px] text-app-text-muted">暂无消息</div>
        )}
        <div className="text-center text-[12px] text-app-text-muted py-4">— 一周前的消息 —</div>
      </div>
    </div>
  );
}
