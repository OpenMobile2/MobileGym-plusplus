import React from 'react';
import { useAppStrings } from '@/os/useAppStrings';
import * as TimeService from '../../../os/TimeService';
import { useDianpingGestures } from '../hooks/useDianpingGestures';
import { useDianpingStore } from '../state';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcThumbs, IcComment, IcPersonAdd, IcTrash, IcFlag, IcHeadset } from '../res/icons';

const ENTRIES = [
  { kind: 'likes' as const, labelKey: 'msgInteract' as const, bg: '#FFE7CF', fg: '#FF8A00', Icon: IcThumbs },
  { kind: 'comment' as const, labelKey: 'msgComment' as const, bg: '#FFDDDD', fg: '#FF5A5A', Icon: IcComment },
  { kind: 'fans' as const, labelKey: 'msgFollower' as const, bg: '#D6E9FF', fg: '#3C8DFF', Icon: IcPersonAdd },
];

function fmtTime(ts: number): string {
  const d = TimeService.fromTimestamp(ts);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}月${d.getDate()}日 ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function Badge({ n }: { n: number }) {
  if (n <= 0) return null;
  return (
    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF4B33] px-1 text-[10px] text-white">
      {n}
    </span>
  );
}

export default function MsgPage() {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap, action } = useDianpingGestures();
  const showToast = useDianpingStore((st) => st.showToast);
  const systemMessages = useDianpingStore((st) => st.systemMessages);
  const msgUnread = useDianpingStore((st) => st.msgUnread);
  const markMsgRead = useDianpingStore((st) => st.markMsgRead);
  const latestSys = [...systemMessages].sort((a, b) => b.ts - a.ts)[0];
  const total = msgUnread.system + msgUnread.activity + msgUnread.likes + msgUnread.comment + msgUnread.fans;

  return (
    <div
      className="flex h-full flex-col bg-(--app-c-page-bg)"
      data-status-bar-foreground="dark"
      data-scroll-container="msg-list"
      data-scroll-direction="vertical"
    >
      {/* 顶栏: 居中标题(带未读数) + 清除未读(刷子) + 添加好友 */}
      <div className="relative flex h-12 items-center justify-center bg-(--app-c-card-bg) px-3">
        <div className="flex items-center gap-1 text-[17px] font-bold text-(--app-c-text-primary)">
          {s.tabMsg}
          {total > 0 ? `(${total})` : ''}
          <button
            type="button"
            className="border-none bg-transparent p-0.5 text-(--app-c-text-primary) cursor-pointer"
            {...action('msg.clear.open.disabled', () => {
              markMsgRead('all');
              showToast('已清除未读');
            })}
          >
            <IcTrash size={18} />
          </button>
        </div>
        <button
          type="button"
          className="absolute right-3 flex items-center gap-1 border-none bg-transparent text-[13px] text-(--app-c-text-primary) cursor-pointer"
          {...action('msg.addfriend.open.disabled', () => showToast(s.notOpen))}
        >
          <IcPersonAdd size={16} />
          {s.addFriend}
        </button>
      </div>

      {/* 三大互动入口 */}
      <div className="mt-2 grid grid-cols-3 bg-(--app-c-card-bg) py-4">
        {ENTRIES.map((e) => (
          <button
            key={e.kind}
            type="button"
            className="relative flex flex-col items-center gap-1.5 border-none bg-transparent cursor-pointer"
            {...bindTap('msg.entry-open', { params: { kind: e.kind } })}
          >
            <span
              className="relative flex h-[52px] w-[52px] items-center justify-center rounded-full"
              style={{ background: e.bg, color: e.fg }}
            >
              <e.Icon size={26} />
              <span className="absolute -right-1 -top-1">
                <Badge n={msgUnread[e.kind]} />
              </span>
            </span>
            <span className="text-[13px] text-(--app-c-text-primary)">{s[e.labelKey]}</span>
          </button>
        ))}
      </div>

      {/* 系统消息 + 活动消息 */}
      <div className="mt-2 flex-1 bg-(--app-c-card-bg)">
        <button
          type="button"
          className="flex w-full items-center gap-3 border-none border-b border-[#F5F5F5] bg-transparent px-3 py-3.5 text-left cursor-pointer"
          {...bindTap('msg.entry-open', { params: { kind: 'system' } })}
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#5B8DEF] to-[#3C6FE0] text-white">
            <IcHeadset size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-semibold text-(--app-c-text-primary)">系统消息</span>
              <span className="text-[11px] text-[#BBB]">{latestSys ? fmtTime(latestSys.ts) : ''}</span>
            </div>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-[12px] text-(--app-c-text-muted)">
                {latestSys ? `${latestSys.title}·${latestSys.body}` : '订单、退款状态变更将在此通知'}
              </span>
              <Badge n={msgUnread.system} />
            </div>
          </div>
        </button>

        <button
          type="button"
          className="flex w-full items-center gap-3 border-none bg-transparent px-3 py-3.5 text-left cursor-pointer"
          {...bindTap('msg.activity-open')}
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#FFB24D] to-[#FF8A00] text-white">
            <IcFlag size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-semibold text-(--app-c-text-primary)">{s.msgActivity}</span>
              <span className="text-[11px] text-[#BBB]">7月30日 01:57</span>
            </div>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-[12px] text-(--app-c-text-muted)">
                系统检测到你的账户有世界杯盲盒礼包资格…
              </span>
              <Badge n={msgUnread.activity} />
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
