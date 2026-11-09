import React from 'react';
import { useDarkMode } from '../../../os/hooks/useDarkMode';
import { IcBell, IcGift, IcSmile, IcBox, IcMessage } from '../res/icons';
import { useCainiaoGestures } from '../hooks/useCainiaoGestures';
import { useCainiaoStore } from '../state';
import { fmtMdHm, fmtHm } from '../utils/appTime';
import { useI18n } from '../i18n';

/** 消息中心(spec messages.main) */
export default function MessagesPage() {
  const { isDark } = useDarkMode();
  const { bindTap, action } = useCainiaoGestures();
  const { t } = useI18n();
  const unread = useCainiaoStore((s) => s.unread);
  const packageMsgs = useCainiaoStore((s) => s.packageMsgs);
  const wenwenMsgs = useCainiaoStore((s) => s.wenwenMsgs);
  const readAllMessages = useCainiaoStore((s) => s.readAllMessages);
  const showToast = useCainiaoStore((s) => s.showToast);

  const lastPkg = packageMsgs[packageMsgs.length - 1];
  const lastWw = wenwenMsgs[wenwenMsgs.length - 1];

  return (
    <div className="flex h-full flex-col bg-(--app-c-card-bg)" data-status-bar-foreground={isDark ? 'light' : 'dark'}>
      <div className="flex h-11 shrink-0 items-center px-4 mt-10">
        <div className="flex-1 text-center text-[17px] font-semibold text-(--app-c-text-primary)">{t('messages.title')}</div>
        <button
          {...action('messages.readAll.action', () => readAllMessages())}
          className="cursor-pointer border-none bg-transparent text-[13px] text-(--app-c-text-primary)"
        >
          {t('messages.readAll')}
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 菜鸟问问(对话 wontfix) */}
        <button
          {...action('messages.wenwen.chat.wontfixToast', () => showToast(t('common.notOpen')))}
          className="mt-2 flex w-full cursor-pointer items-center gap-3 border-none bg-transparent py-2.5 text-left"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#1668DC] text-white"><IcMessage size={24} /></span>
          <div className="min-w-0 flex-1">
            <div className="text-[16px] font-semibold text-(--app-c-text-primary)">菜鸟问问 🥳</div>
            <div className="mt-0.5 truncate text-[13px] text-(--app-c-text-secondary)">穿这件衣服显身材吗?</div>
            <div className="mt-1 truncate rounded bg-(--app-c-chip-bg) px-2 py-1 text-[12px] text-(--app-c-text-muted)">
              【Fart shop】~基础款的神! 紧身无袖打底衫低领性感上衣女…
            </div>
          </div>
        </button>
        {/* 菜鸟问问消息 */}
        <button {...bindTap('messages.wenwen.open')} className="flex w-full cursor-pointer items-center gap-3 border-none bg-transparent py-2.5 text-left">
          <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#12C2C2] text-white">
            <IcSmile size={24} />
            {unread.wenwen > 0 && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-[#F5222D]" />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[16px] font-semibold text-(--app-c-text-primary)">菜鸟问问消息</div>
            <div className="mt-0.5 truncate text-[13px] text-(--app-c-text-secondary)">
              {unread.wenwen > 0 ? `[${unread.wenwen}条] ` : ''}收到一条新的问问消息, 点击查看&gt;
            </div>
          </div>
          <span className="shrink-0 self-start pt-1 text-[12px] text-(--app-c-text-muted)">{lastWw ? fmtHm(lastWw.ts) : ''}</span>
        </button>
        {/* 包裹消息 */}
        <button {...bindTap('messages.package.open')} className="flex w-full cursor-pointer items-center gap-3 border-none bg-transparent py-2.5 text-left">
          <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#39B54A] text-white">
            <IcBox size={24} />
            {unread.package > 0 && (
              <span className="absolute -right-1.5 -top-1.5 min-w-4 rounded-full bg-[#F5222D] px-1 text-center text-[10px] leading-4 text-white">
                {unread.package}
              </span>
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[16px] font-semibold text-(--app-c-text-primary)">包裹消息</div>
            <div className="mt-0.5 truncate text-[13px] text-(--app-c-text-secondary)">{lastPkg?.desc ?? ''}</div>
          </div>
          <span className="shrink-0 self-start pt-1 text-[12px] text-(--app-c-text-muted)">{lastPkg ? fmtMdHm(lastPkg.ts) : ''}</span>
        </button>

        <div className="mt-3 text-[15px] font-bold text-(--app-c-text-primary)">两周前信息</div>
        {/* 活动与权益 / 裹酱消息(空态子频道) */}
        <button {...bindTap('messages.activity.open', { params: { channelId: 'activity' } })} className="mt-1 flex w-full cursor-pointer items-center gap-3 border-none bg-transparent py-2.5 text-left">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F0553D] text-white"><IcGift size={24} /></span>
          <div className="min-w-0 flex-1">
            <div className="text-[16px] font-semibold text-(--app-c-text-primary)">活动与权益</div>
            <div className="mt-0.5 text-[13px] text-(--app-c-text-secondary)">近一个月内暂无新消息</div>
          </div>
          <span className="shrink-0 self-start pt-1 text-[12px] text-(--app-c-text-muted)">06-13 18:57</span>
        </button>
        <button {...bindTap('messages.guojiang.open', { params: { channelId: 'guojiang' } })} className="flex w-full cursor-pointer items-center gap-3 border-none bg-transparent py-2.5 text-left">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F5A623] text-white"><IcBell size={24} /></span>
          <div className="min-w-0 flex-1">
            <div className="text-[16px] font-semibold text-(--app-c-text-primary)">裹酱消息</div>
            <div className="mt-0.5 text-[13px] text-(--app-c-text-secondary)">近一个月内暂无新消息</div>
          </div>
          <span className="shrink-0 self-start pt-1 text-[12px] text-(--app-c-text-muted)">2024-11-09 12:30</span>
        </button>
      </div>
    </div>
  );
}
