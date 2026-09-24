import React from 'react';
import { useWeiboGestures } from '../hooks/useWeiboGestures';
import { useWeiboStore } from '../state';
import { TopBar } from '../components/ui';
import { SelectRow } from '../components/SettingsRow';

export default function NavBarSettingsPage() {
  const { bindTap, bindBack } = useWeiboGestures();
  const g = useWeiboStore((st) => st.settings);
  const setSetting = useWeiboStore((st) => st.setSetting);

  return (
    <div className="flex flex-col h-full bg-[#F2F2F2]">
      <TopBar backBinding={bindBack()} title="自定义导航栏" />
      <div className="flex-1 overflow-y-auto" data-scroll-container="navbar-list" data-scroll-direction="vertical">
        <div className="px-4 pt-3 text-[12px] text-[#9A9A9A]">选择底部第二个标签展示的内容</div>
        <div className="bg-white mt-1">
          <SelectRow
            label="第二个标签"
            value={g.navBarTab}
            options={[
              { id: 'video', label: '视频' },
              { id: 'hot', label: '热门' },
              { id: 'game', label: '游戏' },
              { id: 'local', label: '同城' },
            ]}
            binding={(id) => bindTap({ kind: 'action', id: 'navbar.tab.select.target' }, { params: { target: id }, onTrigger: () => setSetting('navBarTab', id) })}
          />
        </div>
      </div>
    </div>
  );
}
