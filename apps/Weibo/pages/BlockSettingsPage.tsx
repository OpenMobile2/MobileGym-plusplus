import React from 'react';
import { useWeiboGestures } from '../hooks/useWeiboGestures';
import { useWeiboStore } from '../state';
import { useToast, TopBar } from '../components/ui';
import { ToggleRow } from '../components/SettingsRow';
import { IcClose } from '../res/icons';

export default function BlockSettingsPage() {
  const { bindTap, bindBack } = useWeiboGestures();
  const [toastNode, toast] = useToast();
  const settings = useWeiboStore((st) => st.settings);
  const users = useWeiboStore((st) => st.users);
  const setSetting = useWeiboStore((st) => st.setSetting);
  const removeBlockedWord = useWeiboStore((st) => st.removeBlockedWord);
  const removeBlockedUser = useWeiboStore((st) => st.removeBlockedUser);

  return (
    <div className="flex flex-col h-full bg-[#F2F2F2]">
      <TopBar backBinding={bindBack()} title="屏蔽设置" />
      <div className="flex-1 overflow-y-auto" data-scroll-container="block-list" data-scroll-direction="vertical">
        <div className="bg-white mt-2">
          <ToggleRow
            label="智能屏蔽广告"
            sub="自动过滤信息流中的推广内容"
            value={settings.blockAds}
            binding={bindTap({ kind: 'action', id: 'block.ads.toggle' }, { onTrigger: () => setSetting('blockAds', !settings.blockAds) })}
          />
          <ToggleRow
            label="过滤不友善评论"
            value={settings.filterComments}
            binding={bindTap({ kind: 'action', id: 'block.commentFilter.toggle' }, { onTrigger: () => setSetting('filterComments', !settings.filterComments) })}
          />
        </div>

        {/* 屏蔽关键词 */}
        <div className="px-4 pt-4 pb-1 text-[13px] text-[#9A9A9A]">屏蔽关键词</div>
        <div className="bg-white">
          {settings.blockedWords.length ? (
            <div className="flex flex-wrap gap-2 p-3">
              {settings.blockedWords.map((w) => (
                <span key={w} className="flex items-center gap-1 text-[13px] text-[#5B5B5B] bg-[#F5F5F5] rounded-full pl-3 pr-1.5 py-1">
                  {w}
                  <button
                    {...bindTap({ kind: 'action', id: 'block.word.remove' }, { params: { word: w }, onTrigger: () => { removeBlockedWord(w); toast('已移除'); } })}
                    className="w-4 h-4 rounded-full bg-[#CCCCCC] text-white flex items-center justify-center border-none cursor-pointer"
                  >
                    <IcClose size={10} />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <div className="px-4 py-4 text-[13px] text-[#BBBBBB]">暂无屏蔽词</div>
          )}
        </div>

        {/* 屏蔽的用户 */}
        <div className="px-4 pt-4 pb-1 text-[13px] text-[#9A9A9A]">屏蔽的用户</div>
        <div className="bg-white">
          {settings.blockedUsers.length ? settings.blockedUsers.map((uid) => {
            const u = users.find((x) => x.id === uid);
            return (
              <div key={uid} className="flex items-center px-4 py-3 border-b border-[#FAFAFA]">
                <span className="flex-1 text-[15px] text-[#1A1A1A]">{u?.name ?? uid}</span>
                <button
                  {...bindTap({ kind: 'action', id: 'block.user.remove' }, { params: { userId: uid }, onTrigger: () => { removeBlockedUser(uid); toast('已解除屏蔽'); } })}
                  className="text-[13px] text-[#FF8200] border border-[#FF8200] rounded-full px-3 py-1 bg-transparent cursor-pointer"
                >
                  解除
                </button>
              </div>
            );
          }) : (
            <div className="px-4 py-4 text-[13px] text-[#BBBBBB]">暂无屏蔽用户</div>
          )}
        </div>
        <div className="h-4" />
      </div>
      {toastNode}
    </div>
  );
}
