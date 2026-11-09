import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWeiboGestures } from '../hooks/useWeiboGestures';
import { useWeiboStore } from '../state';
import { fmtTime } from '../components/StatusCard';
import { useStrings, useToast, Img, VBadge } from '../components/ui';
import { IcSettings, IcClean, IcAt, IcComment, IcLike, IcRight, IcClose } from '../res/icons';
import * as TimeService from '@/os/TimeService';

export default function MessagePage() {
  const s = useStrings();
  const { bindTap, go } = useWeiboGestures();
  const [searchParams, setSearchParams] = useSearchParams();
  const [toastNode, toast] = useToast();
  const [bannerVisible, setBannerVisible] = React.useState(true);

  const chats = useWeiboStore((st) => st.chats);
  const users = useWeiboStore((st) => st.users);
  const notices = useWeiboStore((st) => st.notices);
  const clearAllUnread = useWeiboStore((st) => st.clearAllUnread);
  const markChatRead = useWeiboStore((st) => st.markChatRead);

  const tab = searchParams.get('tab') === 'dynamics' ? 'dynamics' : 'messages';
  const gearOpen = searchParams.get('menu') === 'gear';

  const ENTRIES = [
    { type: 'atMe', label: s.atMe, Icon: IcAt, bg: 'bg-[#50A8F0]' },
    { type: 'comments', label: s.comment, Icon: IcComment, bg: 'bg-[#52C41A]' },
    { type: 'likes', label: s.like, Icon: IcLike, bg: 'bg-[#FF9500]' },
  ] as const;

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* 顶栏 */}
      <div className="flex items-center h-11 px-3 shrink-0">
        <button
          {...bindTap({ kind: 'action', id: 'message.misc.stub' }, { onTrigger: () => toast(s.notOpen) })}
          className="text-[14px] text-[#5B5B5B] bg-transparent border-none cursor-pointer shrink-0"
        >
          发现群
        </button>
        <div className="flex-1 flex items-center justify-center gap-6">
          {(['dynamics', 'messages'] as const).map((t) => (
            <button
              key={t}
              {...bindTap({ kind: 'action', id: 'message.tab.select.target' }, {
                params: { target: t },
                onTrigger: () => setSearchParams((p) => { t === 'messages' ? p.delete('tab') : p.set('tab', t); return p; }, { replace: true }),
              })}
              className={`text-[17px] bg-transparent border-none cursor-pointer relative pb-1 ${tab === t ? 'font-bold text-[#1A1A1A]' : 'text-[#7F7F7F]'}`}
            >
              {t === 'dynamics' ? '动态' : '消息'}
              {tab === t && <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-5 h-[3px] rounded bg-[#FFB300]" />}
            </button>
          ))}
        </div>
        <button
          aria-label="清除全部未读消息"
          {...bindTap({ kind: 'action', id: 'message.badge.clearAll' }, { onTrigger: () => { clearAllUnread(); toast('未读已清除'); } })}
          className="bg-transparent border-none cursor-pointer text-[#5B5B5B] p-1 shrink-0"
        >
          <IcClean size={18} />
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'message.gearMenu.toggle' }, {
            onTrigger: () => setSearchParams((p) => { gearOpen ? p.delete('menu') : p.set('menu', 'gear'); return p; }, { replace: true }),
          })}
          className="bg-transparent border-none cursor-pointer text-[#5B5B5B] p-1 shrink-0"
        >
          <IcSettings size={18} />
        </button>
      </div>

      {/* 搜索框 */}
      <div className="px-3 pb-2 shrink-0">
        <button
          {...bindTap({ kind: 'action', id: 'message.misc.stub' }, { onTrigger: () => toast(s.notOpen) })}
          className="w-full h-8 bg-[#F5F5F5] rounded-full text-[13px] text-[#9A9A9A] border-none cursor-pointer"
        >
          🔍 {s.searchChatPlaceholder}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="message-list" data-scroll-direction="vertical">
        {tab === 'messages' ? (
          <>
            {/* 通知横幅 */}
            {bannerVisible && (
              <div className="flex items-center gap-2 mx-3 mb-2 bg-[#FFF6E8] rounded-lg px-3 py-2">
                <span className="flex-1 text-[12px] text-[#8A5A00]">打开通知,及时收到互动消息!</span>
                <button
                  {...bindTap({ kind: 'action', id: 'message.notifyBanner.dismiss' }, { onTrigger: () => { toast(s.notOpen); } })}
                  className="text-[12px] text-[#FF8200] bg-transparent border-none cursor-pointer shrink-0"
                >
                  去开启
                </button>
                <button
                  onClick={() => setBannerVisible(false)}
                  className="text-[#C9A36B] bg-transparent border-none cursor-pointer p-0 shrink-0"
                >
                  <IcClose size={14} />
                </button>
              </div>
            )}
            {/* 三行入口 */}
            {ENTRIES.map(({ type, label, Icon, bg }) => (
              <button
                key={type}
                {...(type === 'atMe'
                  ? bindTap('message.atme-open', { params: { type } })
                  : type === 'comments'
                    ? bindTap('message.comments-open', { params: { type } })
                    : bindTap('message.likes-open', { params: { type } }))}
                className="flex items-center gap-3 w-full px-4 py-3 bg-transparent border-none border-b border-[#FAFAFA] cursor-pointer text-left"
              >
                <span className={`w-11 h-11 rounded-full ${bg} text-white flex items-center justify-center shrink-0`}>
                  <Icon size={22} />
                </span>
                <span className="flex-1 text-[15px] text-[#1A1A1A]">{label}</span>
                {notices.some((n) => n.type === type) && <span className="w-2 h-2 rounded-full bg-[#FF3852]" />}
                <IcRight size={16} className="text-[#CCCCCC]" />
              </button>
            ))}
            {/* 会话列表 */}
            {chats.map((c) => (
              <button
                key={c.id}
                {...bindTap('message.chat-open', { params: { id: c.id }, beforeTrigger: () => markChatRead(c.id) })}
                className="flex items-center gap-3 w-full px-4 py-3 bg-transparent border-none cursor-pointer text-left"
              >
                <div className="relative shrink-0">
                  <Img src={c.avatar} label={c.name[0]} className="w-12 h-12 rounded-full object-cover" />
                  {c.unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#FF3852] text-white text-[10px] leading-4 text-center">{c.unread}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-[15px] text-[#1A1A1A] truncate">{c.name}</span>
                    <VBadge type={c.verified} />
                  </div>
                  <div className="text-[13px] text-[#9A9A9A] truncate mt-0.5">{c.summary || s.emptyChat}</div>
                </div>
                <span className="text-[11px] text-[#BBBBBB] shrink-0">{fmtTime(c.timestamp)}</span>
              </button>
            ))}
          </>
        ) : (
          /* 动态 tab */
          <div>
            {users.filter((u) => u.followedByMe).map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-3 border-b border-[#FAFAFA]">
                <Img src={u.avatar} label={u.name[0]} className="w-11 h-11 rounded-full object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] text-[#1A1A1A] truncate">{u.name} 发布了新微博</div>
                  <div className="text-[12px] text-[#9A9A9A]">{fmtTime(TimeService.now() - 3600_000 * 5)}</div>
                </div>
              </div>
            ))}
            <div className="text-center text-[12px] text-[#BBBBBB] py-4">更多…</div>
          </div>
        )}
      </div>

      {/* ⚙下拉菜单 */}
      {gearOpen && (
        <div className="absolute inset-0 z-30" onClick={() => setSearchParams((p) => { p.delete('menu'); return p; }, { replace: true })}>
          <div className="absolute right-2 top-11 bg-white rounded-xl py-1 w-32 shadow-lg border border-[#F2F2F2]">
            <button
              {...bindTap('message.settings-open')}
              className="block w-full px-4 py-2.5 text-[14px] text-[#1A1A1A] bg-transparent border-none cursor-pointer text-left"
            >
              消息设置
            </button>
            <button
              {...bindTap('message.newChat-open')}
              className="block w-full px-4 py-2.5 text-[14px] text-[#1A1A1A] bg-transparent border-none cursor-pointer text-left"
            >
              发起聊天
            </button>
          </div>
        </div>
      )}
      {toastNode}
    </div>
  );
}
