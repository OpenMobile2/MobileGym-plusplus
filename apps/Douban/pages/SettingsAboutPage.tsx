// 节点: settings.about —— 关于豆瓣(evidence IMG_0304/frame:1ad80c,静态样式页)。
// 豆瓣 logo + 版本号 7.128.0(点击检查更新 wontfix)+ 条款链接行(用户协议/隐私政策/备案 → wontfix)。
import React from 'react';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, TopBar } from '../components/ui';
import { SettingRow } from './settingsShared';

const TERMS = ['用户协议', '隐私政策', '儿童/青少年个人信息保护规则', '开源软件许可', '备案信息'];

export default function SettingsAboutPage() {
  const { bindTap } = useDoubanGestures();
  const toast = useDoubanStore((s) => s.toast);

  const termsBind = () =>
    bindTap(
      { kind: 'action', id: 'settings.about.terms.wontfix' },
      { onTrigger: () => toast('该功能暂未开放') },
    );

  return (
    <div className="flex flex-col h-full bg-[#F7F7F8]" data-status-bar-foreground="dark">
      <TopBar title="关于豆瓣" borderless />
      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {/* Logo + 版本 */}
        <div className="flex flex-col items-center pt-10 pb-8">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-4xl font-bold"
            style={{ background: C.green }}
          >
            豆
          </div>
          <div className="mt-3 text-[16px] font-semibold" style={{ color: C.text }}>豆瓣</div>
          <button
            {...bindTap(
              { kind: 'action', id: 'settings.about.update.wontfix' },
              { onTrigger: () => toast('该功能暂未开放') },
            )}
            className="mt-1 text-[13px] bg-transparent border-none cursor-pointer"
            style={{ color: C.sub }}
          >
            版本 7.128.0
          </button>
        </div>

        <div className="bg-white">
          {TERMS.map((t, i) => (
            <div key={t} style={{ borderTop: i === 0 ? 'none' : `0.5px solid ${C.border}` }}>
              <SettingRow label={t} bind={termsBind()} />
            </div>
          ))}
        </div>

        <div className="px-4 pt-8 pb-10 text-center text-[11px] leading-5" style={{ color: '#B9BEC6' }}>
          北京豆网科技有限公司<br />
          Copyright © 2005-2026 douban.com
        </div>
      </div>
    </div>
  );
}
