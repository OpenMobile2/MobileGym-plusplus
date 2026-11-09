// 节点: settings.lab —— 实验室(evidence IMG_0301/frame:1ad80c,静态样式页)。
// 实验功能卡片列表(闪电直搜带体验开关 / 看电影「已毕业」角标)。卡片点按 wontfix;卡内开关本地 toggle。
import React from 'react';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, TopBar } from '../components/ui';
import { Toggle, useSettingsLocalStore } from './settingsShared';

export default function SettingsLabPage() {
  const { bindTap } = useDoubanGestures();
  const toast = useDoubanStore((s) => s.toast);
  const flashOn = useSettingsLocalStore((s) => s.extraToggles['lab.flashSearch']);
  const toggleExtra = useSettingsLocalStore((s) => s.toggleExtra);

  const cardTap = bindTap(
    { kind: 'action', id: 'settings.lab.card.wontfix' },
    { onTrigger: () => toast('该功能暂未开放') },
  );

  return (
    <div className="flex flex-col h-full bg-[#F7F7F8]" data-status-bar-foreground="dark">
      <TopBar title="实验室" borderless />
      <div className="flex-1 overflow-y-auto px-4 pt-3" data-scroll-container="main" data-scroll-direction="vertical">
        <p className="text-xs leading-5 pb-2" style={{ color: '#B9BEC6' }}>
          实验室功能仍在打磨中,可能不稳定。你的试用与反馈会帮助它们更快毕业。
        </p>

        {/* 闪电直搜(带体验开关) */}
        <div className="bg-white rounded-xl p-4 mb-3">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0" {...cardTap} role="button" tabIndex={0}>
              <div className="text-[16px] font-semibold" style={{ color: C.text }}>闪电直搜</div>
              <div className="mt-1 text-xs leading-5" style={{ color: C.sub }}>
                在首页下拉即可快速唤起搜索,输入即出结果,减少一次点击。
              </div>
            </div>
            <Toggle
              on={flashOn}
              bind={bindTap(
                { kind: 'action', id: 'settings.lab.card.toggle' },
                { onTrigger: () => toggleExtra('lab.flashSearch') },
              )}
            />
          </div>
        </div>

        {/* 看电影(已毕业) */}
        <div className="bg-white rounded-xl p-4 mb-3 relative" {...cardTap}>
          <span
            className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px]"
            style={{ background: C.greenSoft, color: C.green }}
          >
            已毕业
          </span>
          <div className="text-[16px] font-semibold pr-14" style={{ color: C.text }}>看电影</div>
          <div className="mt-1 text-xs leading-5" style={{ color: C.sub }}>
            聚合正在热映与即将上映的电影,已正式上线到书影音首页。
          </div>
        </div>
      </div>
    </div>
  );
}
