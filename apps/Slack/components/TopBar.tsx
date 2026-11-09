import React from 'react';
import { useSlackGestures } from '../hooks/useSlackGestures';
import { useSlackStore, ME } from '../state';
import { PURPLE } from '../res/colors';
import { IcFilter, IcCompose, IcChevronDown } from '../res/icons';
import Avatar from './Avatar';
import * as TimeService from '../../../os/TimeService';

/**
 * 深紫顶栏（#420E43）。两种形态：
 * - 主页：工作区首字母块 + 工作区名 + 右侧（漏斗排序 / 个人头像）
 * - 其他 Tab 页：左侧大标题 + 右侧（可选 ✎ 新消息 / 个人头像）
 */
const TopBar: React.FC<{
  variant: 'home' | 'title';
  title?: string;
  /** 右上 ✎ 新消息；主页/私信/活动页真机无此按钮 */
  showCompose?: boolean;
}> = ({ variant, title, showCompose = false }) => {
  const { bindTap } = useSlackGestures();
  const workspace = useSlackStore((s) => s.workspace);
  const users = useSlackStore((s) => s.users);
  const settings = useSlackStore((s) => s.settings);
  const me = users.find((u) => u.id === ME);
  const paused =
    settings.notificationsPausedUntil != null &&
    settings.notificationsPausedUntil > TimeService.now();

  return (
    <div
      className="flex-shrink-0 px-4 pt-10 pb-3"
      style={{ backgroundColor: PURPLE.topbar }}
      data-status-bar-foreground="light"
    >
      <div className="flex h-11 items-center justify-between">
        {variant === 'home' ? (
          <button
            {...bindTap('slack.topbar.opendrawer')}
            className="flex items-center gap-2 border-none bg-transparent p-0"
          >
            <Avatar text={workspace.name.slice(0, 1).toUpperCase()} color="#7A5A7C" size={28} rounded="rounded-md" />
            <span className="text-[20px] font-bold text-white">{workspace.name}</span>
            <IcChevronDown size={16} className="text-white/70" />
          </button>
        ) : (
          <h1 className="text-[26px] font-bold text-white">{title}</h1>
        )}

        {/* 右侧按钮组装在一个浅紫胶囊里（IMG_2367） */}
        <div
          className="flex items-center gap-3.5 rounded-full px-3 py-1"
          style={{ backgroundColor: PURPLE.pill }}
        >
          {variant === 'home' && (
            <button
              {...bindTap('slack.topbar.opensort')}
              aria-label="sort"
              className="border-none bg-transparent p-0 text-white"
            >
              <IcFilter size={22} />
            </button>
          )}
          {showCompose && (
            <button
              {...bindTap('slack.topbar.newmessage')}
              aria-label="new-message"
              className="border-none bg-transparent p-0 text-white"
            >
              <IcCompose size={22} />
            </button>
          )}
          <button
            {...bindTap('slack.topbar.openme')}
            aria-label="me"
            className="border-none bg-transparent p-0"
          >
            <Avatar user={me} size={30} presence paused={paused} rounded="rounded-md" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
