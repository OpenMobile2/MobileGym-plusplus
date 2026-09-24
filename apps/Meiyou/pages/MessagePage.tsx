/**
 * 消息tab页:开通知横幅 + 会话列表(美柚姐姐/小柚子/互动消息/创作者中心)。
 * spec: message.list;证据 r7.mp4@3/30。
 */
import React from 'react';
import * as TimeService from '@/os/TimeService';
import { useAppStrings } from '@/os/useAppStrings';
import { useMeiyouStore } from '../state';
import { useMeiyouGestures } from '../hooks/useMeiyouGestures';
import { MY, NOT_OPEN, TopBar, useToast, Img } from '../components/ui';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcClose, IcPen } from '../res/icons';

const AI_OPENING = '有任何问题,随时都可以和我说,我一直都在';

function fmtClock(ts: number): string {
  const d = TimeService.fromTimestamp(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function MessagePage() {
  const { bindTap } = useMeiyouGestures();
  const s = useAppStrings(strings, stringsEn);
  const [toast, showToast] = useToast();
  const [bannerHidden, setBannerHidden] = React.useState(false);

  const notices = useMeiyouStore((st) => st.notices);
  const sysNotices = useMeiyouStore((st) => st.sysNotices);
  const aiSessions = useMeiyouStore((st) => st.aiSessions);
  const unread = useMeiyouStore((st) => st.unread);

  const lastAi = aiSessions
    .flatMap((sess) => sess.messages)
    .filter((m) => m.role === 'ai')
    .sort((a, b) => b.createdAt - a.createdAt)[0];
  const aiSummary = lastAi ? lastAi.text.replace(/\n+/g, ' ') : AI_OPENING;
  const latestSys = [...sysNotices].sort((a, b) => b.createdAt - a.createdAt)[0];

  return (
    <div className="flex flex-col h-full relative" style={{ background: '#FFFFFF' }}>
      <TopBar title={s.navMessage} showBack={false} />

      {/* 开通知横幅 */}
      {!bannerHidden && (
        <div className="flex items-center h-10 px-3 shrink-0" style={{ background: '#FFE3ED' }}>
          <span className="flex-1 text-[12.5px] truncate" style={{ color: MY.primary }}>
            打开通知,及时接收重要消息
          </span>
          <button
            {...bindTap({ kind: 'action', id: 'message.banner.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
            className="px-3 h-6.5 rounded-full text-[12px] text-white border-none cursor-pointer shrink-0"
            style={{ background: MY.primary, height: 26 }}
          >
            去开启
          </button>
          <button
            {...bindTap({ kind: 'action', id: 'message.banner.dismiss' }, { onTrigger: () => setBannerHidden(true) })}
            className="w-7 h-7 ml-1 flex items-center justify-center bg-transparent border-none cursor-pointer shrink-0"
            aria-label="关闭横幅"
          >
            <IcClose size={15} style={{ color: MY.primary }} />
          </button>
        </div>
      )}

      {/* 会话列表 */}
      <div className="flex-1 overflow-y-auto" data-scroll-container="message-list" data-scroll-direction="vertical">
        {/* 美柚姐姐 */}
        <button
          {...bindTap('meiyou.aichat-open')}
          className="w-full flex items-center px-3 py-3 bg-white border-none cursor-pointer text-left"
        >
          <Img src="/@app-assets/Meiyou/gen/ai_sister.png" className="w-12 h-12 rounded-full object-cover shrink-0" />
          <div className="flex-1 min-w-0 ml-3">
            <div className="flex items-center gap-1">
              <span className="text-[15px] font-medium text-[#1A1A1A]">美柚姐姐</span>
              <span className="text-[9px] text-[#999] border border-[#CCC] rounded px-0.5 leading-tight">AI</span>
            </div>
            <div className="mt-0.5 text-[12.5px] text-[#999] truncate">{aiSummary}</div>
          </div>
          {unread.aiChat > 0 && <span className="w-2 h-2 rounded-full shrink-0 ml-2" style={{ background: '#FF2D2D' }} />}
        </button>

        {/* 小柚子 */}
        <button
          {...bindTap('meiyou.syschat-open')}
          className="w-full flex items-center px-3 py-3 bg-white border-none cursor-pointer text-left"
        >
          <Img src="/@app-assets/Meiyou/gen/mascot_youzi.png" className="w-12 h-12 rounded-full object-cover shrink-0" />
          <div className="flex-1 min-w-0 ml-3">
            <div className="text-[15px] font-medium text-[#1A1A1A]">小柚子</div>
            <div className="mt-0.5 text-[12.5px] text-[#999] truncate">{latestSys?.title ?? s.emptyMessage}</div>
          </div>
          <div className="flex flex-col items-end shrink-0 ml-2 gap-1">
            <span className="text-[11px] text-[#BBB]">{latestSys ? fmtClock(latestSys.createdAt) : ''}</span>
            {unread.sysChat > 0 && (
              <span className="min-w-4 h-4 px-1 rounded-full text-white text-[10px] flex items-center justify-center" style={{ background: '#FF2D2D' }}>
                {unread.sysChat}
              </span>
            )}
          </div>
        </button>

        {/* 互动消息 */}
        <button
          {...bindTap('meiyou.interact-open')}
          className="w-full flex items-center px-3 py-3 bg-white border-none cursor-pointer text-left"
        >
          <div className="relative shrink-0">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #FF5E9A, #E0308F)' }}
            >
              <span className="text-white text-[15px] font-bold italic">HI</span>
            </div>
            {unread.interact > 0 && (
              <span
                className="absolute -top-0.5 -right-1 min-w-4 h-4 px-1 rounded-full text-white text-[10px] flex items-center justify-center"
                style={{ background: '#FF2D2D' }}
              >
                {unread.interact}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0 ml-3">
            <div className="text-[15px] font-medium text-[#1A1A1A]">互动消息</div>
            <div className="mt-0.5 text-[12.5px] text-[#999] truncate">赞、回复和新增粉丝都在这里</div>
          </div>
        </button>

        {/* 创作者中心 */}
        <button
          {...bindTap({ kind: 'action', id: 'message.creator.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
          className="w-full flex items-center px-3 py-3 bg-white border-none cursor-pointer text-left"
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #FFB35C, #FF8A3C)' }}
          >
            <IcPen size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0 ml-3">
            <div className="text-[15px] font-medium text-[#1A1A1A]">创作者中心</div>
            <div className="mt-0.5 text-[12.5px] text-[#999] truncate">查看创作数据,领取创作权益</div>
          </div>
        </button>
      </div>

      {toast}
    </div>
  );
}
