import React, { useEffect } from 'react';
import { useYoukuStore } from '../state';
import { useYoukuGestures } from '../hooks/useYoukuGestures';
import { useI18n } from '../i18n';
import { WONTFIX_TOAST } from '../constants';
import { YOUKU_CONFIG } from '../data';
import { fmtMdHm } from '../utils/appTime';
import type { NoticeEntry } from '../types';
import Img from '../components/Img';
import EmptyState from '../components/msgpub/EmptyState';
import { IcBack, IcMore } from '../components/msgpub/icons';

function fanAvatar(name: string): string {
  const f = (YOUKU_CONFIG.seedFans as Array<{ name: string; avatar: string }>).find((x) => x.name === name);
  return f?.avatar ?? '';
}

/** spec 节点 msg.fans(route /messages/fans)—— 粉丝通知页 */
export default function MsgFansPage() {
  const { action, bindBack } = useYoukuGestures();
  const { t } = useI18n();
  const notices = useYoukuStore((s) => s.notices.fans);
  const markRead = useYoukuStore((s) => s.markRead);
  const showToast = useYoukuStore((s) => s.showToast);

  // 进入清零未读(幂等,StrictMode 安全)
  useEffect(() => {
    markRead('fans');
  }, [markRead]);

  const list: NoticeEntry[] = [...notices].sort((a, b) => b.ts - a.ts);

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
        <span className="flex-1 text-center text-[17px] font-bold">{t('msg.center.fans')}</span>
        <button
          {...action('msg.fans.more.wontfixToast', () => showToast(WONTFIX_TOAST))}
          className="flex h-8 w-8 cursor-pointer items-center justify-center border-none bg-transparent p-0 text-(--app-c-text-primary)"
        >
          <IcMore size={20} strokeWidth={2} />
        </button>
      </div>

      <div
        data-scroll-container="main"
        data-scroll-direction="vertical"
        className="min-h-0 flex-1 overflow-y-auto pb-6"
      >
        {list.length === 0 && <EmptyState text={t('msg.fans.empty')} />}
        {list.map((n, i) => {
          const prev = list[i - 1];
          const showTime = !prev || fmtMdHm(prev.ts) !== fmtMdHm(n.ts);
          return (
            <div key={n.id} className="px-3">
              {showTime && (
                <div className="px-1 pb-2 pt-3 text-[13px] text-[#999999]">{fmtMdHm(n.ts)}</div>
              )}
              <div className="flex items-center gap-3 rounded-2xl bg-(--app-c-card-bg) p-3.5">
                <Img
                  src={fanAvatar(n.user)}
                  label={n.user}
                  ratio="square"
                  className="h-11 w-11 shrink-0 rounded-full bg-(--app-c-chip-bg) object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-medium">{n.user}</div>
                  <div className="mt-1 text-[13px] text-[#999999]">{n.action}</div>
                  {n.text ? <div className="mt-1 text-[13px] text-[#CCCCCC]">{n.text}</div> : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
