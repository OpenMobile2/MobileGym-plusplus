import React from 'react';
import { pickImagesFromAlbum } from '../capabilities';
import { useDidiStore } from '../state';
import { TopBar, Card, C } from '../components/ui';
import { useDidiGestures } from '../hooks/useDidiGestures';

/** 个人信息 —— 常规样式(入口证据 n17)。昵称 input 绑 profile.edit.name。 */
export default function ProfileEditPage() {
  const { bindTap } = useDidiGestures();
  const toast = useDidiStore((s) => s.toast);
  const user = useDidiStore((s) => s.user);
  const avatarUri = useDidiStore((s) => s.avatarUri);
  const setUserName = useDidiStore((s) => s.setUserName);
  const setAvatarUri = useDidiStore((s) => s.setAvatarUri);

  return (
    <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground="dark">
      <TopBar title="个人信息" />
      <div
        className="flex-1 overflow-y-auto px-3 pt-3"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <Card>
          <button
            {...bindTap(
              { kind: 'action', id: 'profile.edit.avatar.pick' },
              {
                onTrigger: () => {
                  void pickImagesFromAlbum({ multiple: false, maxSelect: 1 }).then((result) => {
                    const selected = result.selected[0];
                    if (result.cancelled || !selected) return;
                    setAvatarUri(selected.uri);
                    toast('头像已更新');
                  });
                },
              },
            )}
            className="flex items-center w-full px-4 py-3.5 bg-transparent border-none text-left border-b border-app-border"
          >
            <span className="flex-1 text-[15px] text-app-text">头像</span>
            {avatarUri ? (
              <img src={avatarUri} alt="头像" className="mr-1 h-11 w-11 rounded-full object-cover" />
            ) : (
              <svg width="44" height="44" viewBox="0 0 44 44" className="mr-1">
                <circle cx="22" cy="22" r="22" fill="#FFE3D2" />
                <circle cx="22" cy="17" r="7.5" fill="#FF9A62" />
                <path d="M7 40c2.5-9 9-12.5 15-12.5S34.5 31 37 40" fill="#FF9A62" />
              </svg>
            )}
            <span className="text-app-text-muted text-base">›</span>
          </button>

          <div className="flex items-center px-4 py-3.5 border-b border-app-border">
            <span className="w-20 text-[15px] text-app-text shrink-0">昵称</span>
            <input
              data-action="profile.edit.name"
              data-action-type="input"
              value={user.name}
              onChange={(e) => setUserName(e.target.value)}
              className="flex-1 min-w-0 text-right bg-transparent border-none outline-none text-[15px] text-app-text"
            />
          </div>

          <div className="flex items-center px-4 py-3.5 border-b border-app-border">
            <span className="flex-1 text-[15px] text-app-text">手机号</span>
            <span className="text-[14px] text-app-text-muted">{user.phone}</span>
          </div>

          <div className="flex items-center px-4 py-3.5">
            <span className="flex-1 text-[15px] text-app-text">实名认证</span>
            <span className="text-[14px]" style={{ color: C.green }}>已完成</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
