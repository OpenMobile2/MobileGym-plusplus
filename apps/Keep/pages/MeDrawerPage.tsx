import React from 'react';
import { useKeepGestures } from '../hooks/useKeepGestures';
import { useKeepStrings } from '../hooks/useKeepStrings';
import { useKeepStore } from '../state';
import {
  IcZap, IcGift, IcMedal, IcComment, IcStar, IcPlus, IcHome, IcHeadphones, IcSettings, IcArrowRight,
} from '../res/icons';

/** 左侧抽屉菜单(sheet)—— 节点 me.drawer(证据 s090;除设置外全部 wontfix) */
export default function MeDrawerPage() {
  const { bindTap, back } = useKeepGestures();
  const s = useKeepStrings();
  const toast = useKeepStore((st) => st.toast);
  const wallet = useKeepStore((st) => st.wallet);

  const wontfix = (id: string) =>
    bindTap({ kind: 'action', id }, { onTrigger: () => toast(s.notOpen) });

  const Row = ({
    icon, label, value, bind, last = false,
  }: {
    icon: React.ReactNode; label: string; value?: string; bind: object; last?: boolean;
  }) => (
    <button
      {...bind}
      className={`flex items-center gap-3 w-full px-4 py-3.5 bg-transparent border-none text-left ${
        last ? '' : 'border-b border-app-border'
      }`}
    >
      <span className="text-app-text">{icon}</span>
      <span className="flex-1 text-[15px] text-app-text">{label}</span>
      {value && <span className="text-[13px] text-app-text-muted">{value}</span>}
      <IcArrowRight size={16} className="text-app-text-muted" />
    </button>
  );

  return (
    <div className="absolute inset-0 z-40 flex" data-status-bar-foreground="dark">
      {/* 左侧抽屉面板 */}
      <div className="w-[82%] h-full bg-app-bg overflow-y-auto px-3 pt-3 pb-6" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="rounded-2xl bg-app-surface overflow-hidden">
          <Row icon={<IcZap size={20} />} label="我的运动币" value={`${wallet.coins + 20} 币`} bind={wontfix('me.drawer.coin.wontfix')} />
          <Row icon={<IcGift size={20} />} label="领福利" bind={wontfix('me.drawer.welfare.wontfix')} />
          <Row icon={<IcMedal size={20} />} label="我的证书" bind={wontfix('me.drawer.cert.wontfix')} last />
        </div>
        <div className="rounded-2xl bg-app-surface overflow-hidden mt-3">
          <Row icon={<IcComment size={20} />} label="我的动态" bind={wontfix('me.drawer.posts.wontfix')} />
          <Row icon={<IcStar size={20} />} label="收藏与加油" bind={bindTap('me.favorites.open.fromDrawer')} />
          <Row icon={<IcPlus size={20} />} label="添加好友" bind={wontfix('me.drawer.addfriend.wontfix')} last />
        </div>
        <div className="rounded-2xl bg-app-surface overflow-hidden mt-3">
          <Row icon={<IcHome size={20} />} label="我的家庭" bind={wontfix('me.drawer.family.wontfix')} />
          <Row icon={<IcHome size={20} />} label="我的团队" bind={wontfix('me.drawer.team.wontfix')} last />
        </div>
        <div className="rounded-2xl bg-app-surface overflow-hidden mt-3">
          <Row icon={<IcHeadphones size={20} />} label="帮助中心" bind={wontfix('me.drawer.help.wontfix')} />
          <Row icon={<IcSettings size={20} />} label="设置" bind={bindTap('settings.main.open.fromDrawer')} last />
        </div>
      </div>
      {/* 右侧半透明遮罩:点击收起 */}
      <div
        {...bindTap({ kind: 'action', id: 'me.drawer.close' }, { onTrigger: () => back() })}
        className="flex-1 h-full bg-black/45"
      />
    </div>
  );
}
