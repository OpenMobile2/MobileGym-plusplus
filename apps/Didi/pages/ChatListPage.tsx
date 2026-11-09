import React from 'react';
import { useDidiGestures } from '../hooks/useDidiGestures';
import { useDidiStore } from '../state';
import { TopBar, C, driverAvatar, imgFallback } from '../components/ui';
import type { DidiDriverChat } from '../types';

/** 司机对话列表(左滑删除) —— 证据 s33、s34、s35、s36 */

const DELETE_W = 72;

function ChatRow({ chat }: { chat: DidiDriverChat }) {
  const { bindTap } = useDidiGestures();
  const deleteChat = useDidiStore((s) => s.deleteChat);
  const openChat = useDidiStore((s) => s.openChat);
  const [offset, setOffset] = React.useState(0);
  const drag = React.useRef({ startX: 0, startY: 0, base: 0, active: false, moved: false });

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    drag.current = { startX: e.clientX, startY: e.clientY, base: offset, active: false, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (e.buttons === 0) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.active) {
      // 消抖:水平位移 >10px 且横向占优才捕获
      if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
        d.active = true;
        d.moved = true;
        e.currentTarget.setPointerCapture(e.pointerId);
      } else {
        return;
      }
    }
    setOffset(Math.min(0, Math.max(-DELETE_W - 12, d.base + dx)));
  };
  const endDrag = () => {
    const d = drag.current;
    if (d.active) setOffset((o) => (o < -40 ? -DELETE_W : 0));
    d.active = false;
  };
  /** 拖拽后吞掉点击;滑开状态点内容先收回 */
  const onClickCapture = (e: React.MouseEvent) => {
    if (drag.current.moved) {
      drag.current.moved = false;
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (offset !== 0) {
      e.preventDefault();
      e.stopPropagation();
      setOffset(0);
    }
  };

  return (
    <div
      className="relative overflow-hidden border-b border-app-border"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {/* 底层红色删除 */}
      <button
        {...bindTap({ kind: 'action', id: 'chat.list.delete' }, { onTrigger: () => deleteChat(chat.id) })}
        className="absolute right-0 top-0 h-full border-none text-white text-[15px]"
        style={{ width: DELETE_W, background: C.red }}
      >
        删除
      </button>
      {/* 上层内容 */}
      <button
        {...bindTap('chat.fromList', { beforeTrigger: () => openChat(chat.id) })}
        onClickCapture={onClickCapture}
        className="relative flex items-center w-full px-4 py-3 bg-app-bg border-none text-left"
        style={{ transform: `translateX(${offset}px)`, transition: drag.current.active ? 'none' : 'transform .18s' }}
      >
        <img src={driverAvatar(chat.driver)} {...imgFallback(chat.driver)} alt="" className="w-11 h-11 rounded-full mr-3 shrink-0 object-cover" />
        <span className="flex-1 min-w-0">
          <span className="flex items-center gap-1.5">
            <span className="text-[16px] font-semibold text-app-text">{chat.driver}</span>
            <span
              className="text-[11px] px-1.5 py-0.5 rounded"
              style={{ background: '#F0F1F5', color: '#8A8F99' }}
            >
              {chat.badge}
            </span>
          </span>
          <span className="block text-[13px] text-app-text-muted truncate mt-0.5">{chat.lastMsg}</span>
        </span>
        <span className="text-[12px] text-app-text-muted ml-2 shrink-0 self-start mt-1">{chat.time}</span>
      </button>
    </div>
  );
}

export default function ChatListPage() {
  const toast = useDidiStore((s) => s.toast);
  const chats = useDidiStore((s) => s.driverChats);
  const alive = chats.filter((c) => !c.deleted);

  return (
    <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground="dark">
      <TopBar
        title={`对话(${alive.length})`}
        right={(
          <button
            onClick={() => toast('暂无可清扫的会话')}
            className="bg-transparent border-none p-1 text-app-text"
            aria-label="清扫"
          >
            🧹
          </button>
        )}
      />
      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {alive.map((c) => <ChatRow key={c.id} chat={c} />)}
        {alive.length === 0 && (
          <div className="text-center text-[13px] text-app-text-muted pt-20">暂无对话</div>
        )}
        {alive.length > 0 && (
          <div className="text-center text-[12px] text-app-text-muted py-4">— 一周前的消息 —</div>
        )}
      </div>
    </div>
  );
}
