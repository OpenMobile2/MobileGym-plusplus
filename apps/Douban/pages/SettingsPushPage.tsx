// 节点: settings.push —— 推送通知设置(evidence IMG_0296/0297/frame:1ad80c)。
// 总开关(接收推送通知)+ 分类开关列表。均本地 toggle;总开关关时分类整组隐藏。
// push.master/reply/like/follow/chat 走 foundation settings.push;其余分类走本地 extraToggles。
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, TopBar } from '../components/ui';
import { GroupGap, Toggle, useSettingsLocalStore } from './settingsShared';

/** 开关行:标题 + 可选副说明 + 右侧开关。 */
function ToggleRow({ label, sub, on, bind }: { label: string; sub?: string; on: boolean; bind: object }) {
  return (
    <div className="w-full flex items-center gap-3 px-4 bg-white" style={{ minHeight: 56 }}>
      <div className="flex-1 min-w-0 py-2">
        <div className="text-[16px]" style={{ color: C.text }}>{label}</div>
        {sub && <div className="mt-0.5 text-xs" style={{ color: '#B9BEC6' }}>{sub}</div>}
      </div>
      <Toggle on={on} bind={bind} />
    </div>
  );
}

export default function SettingsPushPage() {
  const { bindTap } = useDoubanGestures();
  const push = useDoubanStore((s) => s.settings.push);
  const updateSettings = useDoubanStore((s) => s.updateSettings);
  const extra = useSettingsLocalStore((s) => s.extraToggles);
  const toggleExtra = useSettingsLocalStore((s) => s.toggleExtra);

  const master = push.master;
  const [searchParams, setSearchParams] = useSearchParams();
  const permOpen = searchParams.get('perm') === 'push';

  // 总开关关闭态时无系统推送权限:tap 弹底部授权引导面板,而非直接开(mod7 审计 S2)。
  const totalBind = bindTap(
    { kind: 'action', id: 'settings.push.total.toggle' },
    {
      onTrigger: () => {
        if (master) {
          updateSettings('push', { master: false });
        } else {
          setSearchParams((p) => {
            p.set('perm', 'push');
            return p;
          });
        }
      },
    },
  );
  const closePerm = () =>
    setSearchParams((p) => {
      p.delete('perm');
      return p;
    });
  const coreBind = (key: 'reply' | 'like' | 'follow' | 'chat') =>
    bindTap(
      { kind: 'action', id: 'settings.push.item.toggle' },
      { onTrigger: () => updateSettings('push', { [key]: !push[key] }) },
    );
  const extraBind = (key: string) =>
    bindTap(
      { kind: 'action', id: 'settings.push.item.toggle' },
      { onTrigger: () => toggleExtra(key) },
    );

  return (
    <div className="flex flex-col h-full bg-[#F7F7F8] relative" data-status-bar-foreground="dark">
      <TopBar title="推送通知" borderless />
      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="mt-2">
          <ToggleRow label="所有推送通知" on={master} bind={totalBind} />
        </div>
        <div className="px-4 pt-1.5 pb-1 text-xs" style={{ color: '#B9BEC6' }}>
          关闭后将不再接收任何推送通知
        </div>

        {master && (
          <>
            {/* mod7 审计:真机无组头,仅分段间距;行序/文案对齐真机 */}
            <GroupGap />
            <ToggleRow label="私信" on={push.chat} bind={coreBind('chat')} />
            <ToggleRow
              label="回复"
              sub="小组讨论、动态、相册、书影音评论的回复"
              on={push.reply}
              bind={coreBind('reply')}
            />
            <ToggleRow label="被关注" on={push.follow} bind={coreBind('follow')} />
            <ToggleRow label="转发" on={extra['push.repost']} bind={extraBind('push.repost')} />
            <ToggleRow label="赞·有用·收藏" on={push.like} bind={coreBind('like')} />
            <ToggleRow label="有人@我" on={extra['push.mention']} bind={extraBind('push.mention')} />

            <GroupGap />
            <ToggleRow
              label="小组热门内容"
              sub="精选小组内的热门讨论"
              on={extra['push.groupHot']}
              bind={extraBind('push.groupHot')}
            />
            <ToggleRow
              label="想读想看想听的书影音有资源上架"
              on={extra['push.subjectOnline']}
              bind={extraBind('push.subjectOnline')}
            />
            <ToggleRow label="想看的电影在影院上映" on={extra['push.movieRelease']} bind={extraBind('push.movieRelease')} />
            <ToggleRow label="想读的书打折了" on={extra['push.bookDiscount']} bind={extraBind('push.bookDiscount')} />
          </>
        )}
        <div className="h-8" />
      </div>

      {/* 推送权限引导面板(mod7 审计 S2):总开关关闭 + 无系统权限时弹出 */}
      {permOpen && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end" onClick={closePerm}>
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.4)' }} />
          <div
            className="relative bg-white rounded-t-2xl px-6 pt-7 pb-5 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[17px] font-semibold" style={{ color: C.text }}>请打开豆瓣通知</div>
            <div className="mt-2.5 text-[14px] leading-relaxed" style={{ color: C.sub }}>
              你还没有对豆瓣开启推送权限,权限开通后才可开启推送开关
            </div>
            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={closePerm}
                className="flex-1 h-11 rounded-full text-[15px] cursor-pointer border-none"
                style={{ background: '#F2F3F5', color: C.text }}
              >
                取消
              </button>
              <button
                onClick={() => {
                  updateSettings('push', { master: true });
                  closePerm();
                }}
                className="flex-1 h-11 rounded-full text-[15px] cursor-pointer border-none text-white"
                style={{ background: C.green }}
              >
                去开启
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
