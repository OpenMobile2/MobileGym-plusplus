import React from 'react';
import { useFlomoStore } from '../state';
import { useFlomoGestures } from '../hooks/useFlomoGestures';
import { C } from '../components/ui';
import { Toggle } from './SettingsPreferencesPage';
import { IcNavBack, IcArrowRight } from '../res/icons';

/** AI 设置 · 节点 settings.ai · 证据 IMG_0200 */
export default function SettingsAiPage() {
  const { bindTap, bindBack } = useFlomoGestures();
  const settings = useFlomoStore((s) => s.settings);
  const setSetting = useFlomoStore((s) => s.setSetting);
  const toast = useFlomoStore((s) => s.toast);

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      <div className="flex items-center h-11 px-2 shrink-0">
        <button
          {...bindBack()}
          className="w-10 flex items-center justify-center bg-transparent border-none cursor-pointer"
          style={{ color: C.text }}
          aria-label="返回"
        >
          <IcNavBack size={22} />
        </button>
        <div className="flex-1 text-center font-semibold" style={{ color: C.text }}>AI 设置</div>
        <div className="w-10" />
      </div>

      <div
        className="flex-1 overflow-y-auto px-3 pb-8"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {/* PRO 开关组 */}
        <div className="rounded-2xl overflow-hidden mt-3" style={{ background: C.surface }}>
          <button
            {...bindTap({ kind: 'action', id: 'settings.ai.related.toggle' }, { onTrigger: () => setSetting('aiRelated', !settings.aiRelated) })}
            className="w-full flex items-center px-4 h-12 bg-transparent border-none cursor-pointer text-left border-b"
            style={{ color: C.text, fontSize: 15, borderColor: C.border }}
          >
            <span className="flex-1 flex items-center gap-2">
              相关笔记
              <span className="px-1.5 rounded font-bold" style={{ background: C.green, color: '#fff', fontSize: 10 }}>PRO</span>
            </span>
            <Toggle on={settings.aiRelated} />
          </button>
          <button
            {...bindTap({ kind: 'action', id: 'settings.ai.insight.toggle' }, { onTrigger: () => setSetting('aiInsight', !settings.aiInsight) })}
            className="w-full flex items-center px-4 h-12 bg-transparent border-none cursor-pointer text-left"
            style={{ color: C.text, fontSize: 15 }}
          >
            <span className="flex-1 flex items-center gap-2">
              AI 洞察
              <span className="px-1.5 rounded font-bold" style={{ background: C.green, color: '#fff', fontSize: 10 }}>PRO</span>
            </span>
            <Toggle on={settings.aiInsight} />
          </button>
        </div>

        {/* AI 语音输入 */}
        <div className="rounded-2xl overflow-hidden mt-3" style={{ background: C.surface }}>
          <button
            {...bindTap({ kind: 'action', id: 'settings.ai.voice.open' }, { onTrigger: () => toast('该功能暂未开放') })}
            className="w-full flex items-center gap-2 px-4 h-12 bg-transparent border-none cursor-pointer text-left"
            style={{ color: C.text, fontSize: 15 }}
          >
            <span className="flex-1">AI 语音输入</span>
            <span style={{ color: C.sub, fontSize: 13 }}>已开启</span>
            <IcArrowRight size={18} style={{ color: C.sub }} />
          </button>
        </div>

        {/* 个性化信息 */}
        <div className="rounded-2xl overflow-hidden mt-3" style={{ background: C.surface }}>
          <button
            {...bindTap({ kind: 'action', id: 'settings.ai.persona.open' }, { onTrigger: () => toast('该功能暂未开放') })}
            className="w-full flex items-start gap-2 px-4 py-3 bg-transparent border-none cursor-pointer text-left"
            style={{ color: C.text, fontSize: 15 }}
          >
            <span className="flex-1">
              个性化信息
              <span className="block mt-0.5" style={{ color: C.sub, fontSize: 12 }}>帮助 AI 更好的了解你</span>
            </span>
            <IcArrowRight size={18} className="mt-1" style={{ color: C.sub }} />
          </button>
        </div>

        <div className="text-center mt-6" style={{ color: C.sub, fontSize: 11 }}>
          网信算备 31010476398890124号
        </div>
      </div>
    </div>
  );
}
