import React from 'react';
import { useYoukuStore } from '../state';
import { useYoukuGestures } from '../hooks/useYoukuGestures';
import { useI18n } from '../i18n';
import { WONTFIX_TOAST } from '../constants';
import { fmtConvListTime, fmtSlashDate } from '../utils/appTime';
import {
  IcSmile, IcHeart, IcDanmu, IcComment, IcReadAll, IcMore, IcBack, IcBell, IcBot,
} from '../components/msgpub/icons';

/** 小红点(未读>0 时显示) */
function Dot({ show }: { show: boolean }) {
  if (!show) return null;
  return <span className="absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-[#F5265C]" />;
}

/** 取会话最新一条(开通消息会插到数组头部,不能用 length-1) */
function latestMsg<T extends { ts: number }>(list: T[]): T | undefined {
  if (list.length === 0) return undefined;
  return list.reduce((a, b) => (a.ts >= b.ts ? a : b));
}

/** spec 节点 msg.center(route /messages)—— 消息中心(s214) */
export default function MsgCenterPage() {
  const { bindTap, action, bindBack } = useYoukuGestures();
  const { t } = useI18n();
  const unread = useYoukuStore((s) => s.unread);
  const conversations = useYoukuStore((s) => s.conversations);
  const markAllRead = useYoukuStore((s) => s.markAllRead);
  const showToast = useYoukuStore((s) => s.showToast);

  const vipLast = latestMsg(conversations.vip);
  const sysLast = latestMsg(conversations.system);

  const gridItemCls =
    'relative flex flex-1 cursor-pointer flex-col items-center gap-2.5 py-4';

  return (
    <div
      className="flex h-full w-full flex-col bg-(--app-c-page-bg) pt-10 text-(--app-c-text-primary)"
    >
      {/* 顶栏:返回 + 标题 + 清扫(一键已读)+ 更多 */}
      <div className="flex h-11 shrink-0 items-center px-3">
        <button
          {...bindBack()}
          aria-label={t('common.back')}
          className="flex h-8 w-8 cursor-pointer items-center justify-center border-none bg-transparent p-0 text-(--app-c-text-primary)"
        >
          <IcBack size={24} strokeWidth={2.5} />
        </button>
        <div className="flex flex-1 items-center justify-center gap-1.5">
          <span className="text-[17px] font-bold">{t('msg.center.title')}</span>
          <button
            {...action('msg.center.readAll.clear', markAllRead)}
            aria-label="一键已读"
            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border-none bg-(--app-c-chip-bg) p-0 text-[#CCCCCC]"
          >
            <IcReadAll size={13} strokeWidth={2} />
          </button>
        </div>
        <button
          {...action('msg.center.more.wontfixToast', () => showToast(WONTFIX_TOAST))}
          className="flex h-8 w-8 cursor-pointer items-center justify-center border-none bg-transparent p-0 text-(--app-c-text-primary)"
        >
          <IcMore size={20} strokeWidth={2} />
        </button>
      </div>

      <div
        data-scroll-container="main"
        data-scroll-direction="vertical"
        className="min-h-0 flex-1 overflow-y-auto"
      >
        {/* 四宫格:粉丝 / 赞 / 弹幕 / 评论 */}
        <div className="mx-3 mt-2 flex rounded-2xl bg-(--app-c-card-bg)">
          <div {...bindTap('msg.center.fans.open')} className={gridItemCls}>
            <span className="relative">
              <IcSmile size={30} strokeWidth={1.5} />
              <Dot show={unread.fans > 0} />
            </span>
            <span className="text-[14px]">{t('msg.center.fans')}</span>
          </div>
          <div {...bindTap('msg.center.likes.open', { params: { type: 'like' } })} className={gridItemCls}>
            <span className="relative">
              <IcHeart size={30} strokeWidth={1.5} />
              <Dot show={unread.likes > 0} />
            </span>
            <span className="text-[14px]">{t('msg.center.likes')}</span>
          </div>
          <div {...bindTap('msg.center.danmu.open', { params: { type: 'danmu' } })} className={gridItemCls}>
            <span className="relative">
              <IcDanmu size={30} strokeWidth={1.5} />
              <Dot show={unread.danmu > 0} />
            </span>
            <span className="text-[14px]">{t('msg.center.danmu')}</span>
          </div>
          <div {...bindTap('msg.center.comments.open', { params: { type: 'comment' } })} className={gridItemCls}>
            <span className="relative">
              <IcComment size={30} strokeWidth={1.5} />
              <Dot show={unread.comments > 0} />
            </span>
            <span className="text-[14px]">{t('msg.center.comments')}</span>
          </div>
        </div>

        {/* 官方会话列表 */}
        <div className="mt-4">
          {/* 优酷VIP会员 */}
          <div
            {...bindTap('msg.center.vip.open', { params: { convId: 'vip' } })}
            className="flex cursor-pointer items-center gap-3 px-3 py-3.5"
          >
            <div className="relative shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#F08A5C] to-[#E85A7A]">
                <IcHeart size={22} strokeWidth={0} fill="#FFFFFF" />
              </div>
              <Dot show={unread.vip > 0} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[16px] font-medium">{t('msg.center.vipName')}</span>
                <span className="rounded bg-(--app-c-chip-bg) px-1 py-0.5 text-[10px] text-[#999999]">
                  {t('msg.center.official')}
                </span>
              </div>
            </div>
            {vipLast && (
              <span className="shrink-0 text-[12px] text-[#666666]">{fmtConvListTime(vipLast.ts)}</span>
            )}
          </div>
          <div className="ml-[72px] h-px bg-(--app-c-chip-bg)" />

          {/* 系统消息 */}
          <div
            {...bindTap('msg.center.system.open', { params: { convId: 'system' } })}
            className="flex cursor-pointer items-center gap-3 px-3 py-3.5"
          >
            <div className="relative shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2BC8B4]">
                <IcBell size={22} strokeWidth={0} fill="#FFFFFF" />
              </div>
              <Dot show={unread.system > 0} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[16px] font-medium">{t('msg.center.systemName')}</span>
                <span className="rounded bg-(--app-c-chip-bg) px-1 py-0.5 text-[10px] text-[#999999]">
                  {t('msg.center.official')}
                </span>
              </div>
              {sysLast && (
                <div className="mt-1 truncate text-[13px] text-[#999999]">{sysLast.text}</div>
              )}
            </div>
            {sysLast && (
              <span className="shrink-0 self-start pt-0.5 text-[12px] text-[#666666]">
                {fmtSlashDate(sysLast.ts)}
              </span>
            )}
          </div>
          <div className="ml-[72px] h-px bg-(--app-c-chip-bg)" />

          {/* 智能小助理(wontfix:对话流不做,条目保留) */}
          <div
            {...action('msg.center.assistant.wontfixToast', () => showToast(WONTFIX_TOAST))}
            className="flex cursor-pointer items-center gap-3 px-3 py-3.5"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#4D9BF0] to-[#2E6BE0]">
              <IcBot size={24} strokeWidth={1.8} />
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              <span className="text-[16px] font-medium">{t('msg.center.assistantName')}</span>
              <span className="rounded bg-(--app-c-chip-bg) px-1 py-0.5 text-[10px] text-[#999999]">
                {t('msg.center.official')}
              </span>
            </div>
          </div>
          <div className="ml-[72px] h-px bg-(--app-c-chip-bg)" />
        </div>
      </div>
    </div>
  );
}
