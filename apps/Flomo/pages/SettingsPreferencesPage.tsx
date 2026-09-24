import React from 'react';
import { useFlomoStore } from '../state';
import { useFlomoGestures } from '../hooks/useFlomoGestures';
import { C } from '../components/ui';
import { IcNavBack, IcArrowRight } from '../res/icons';

const FONT_SIZES = [14, 16, 18];

/** 偏好设置(含深色模式) · 节点 settings.preferences · 证据 IMG_0196 */
export default function SettingsPreferencesPage() {
  const { bindTap, bindBack } = useFlomoGestures();
  const settings = useFlomoStore((s) => s.settings);
  const setTheme = useFlomoStore((s) => s.setTheme);
  const setSetting = useFlomoStore((s) => s.setSetting);
  const toast = useFlomoStore((s) => s.toast);

  const isDark = settings.theme === 'dark';

  const cycleFont = () => {
    const idx = FONT_SIZES.indexOf(settings.fontSize);
    const next = FONT_SIZES[(idx + 1) % FONT_SIZES.length] ?? FONT_SIZES[0];
    setSetting('fontSize', next);
    toast(`字号已设为 ${next}`);
  };

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
        <div className="flex-1 text-center font-semibold" style={{ color: C.text }}>偏好设置</div>
        <div className="w-10" />
      </div>

      <div
        className="flex-1 overflow-y-auto px-3 pb-8"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {/* 显示 */}
        <SectionLabel>显示</SectionLabel>
        <Card>
          <ToggleRow
            label="深色模式"
            on={isDark}
            bind={bindTap({ kind: 'action', id: 'settings.preferences.dark.toggle' }, { onTrigger: () => setTheme(isDark ? 'light' : 'dark') })}
          />
          <SelectRow
            label="字体大小"
            value={`${settings.fontSize}`}
            bind={bindTap({ kind: 'action', id: 'settings.preferences.fontsize.select' }, { onTrigger: cycleFont })}
            last
          />
        </Card>

        {/* 内容 */}
        <SectionLabel>内容</SectionLabel>
        <Card>
          <ToggleRow
            label="内容过长折叠"
            on={settings.foldLong}
            bind={bindTap({ kind: 'action', id: 'settings.preferences.fold.toggle' }, { onTrigger: () => setSetting('foldLong', !settings.foldLong) })}
            last
          />
        </Card>

        {/* 其他 */}
        <SectionLabel>其他</SectionLabel>
        <Card>
          <SelectRow
            label="语言"
            value="简体中文"
            bind={bindTap({ kind: 'action', id: 'settings.preferences.lang.select' }, { onTrigger: () => toast('该功能暂未开放') })}
          />
          <ToggleRow
            label="Spotlight 搜索"
            on={false}
            bind={bindTap({ kind: 'action', id: 'settings.preferences.misc.toggle' }, { onTrigger: () => toast('该功能暂未开放') })}
            last
          />
        </Card>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="px-2 mt-4 mb-1.5" style={{ color: C.sub, fontSize: 12 }}>{children}</div>;
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl overflow-hidden" style={{ background: C.surface }}>{children}</div>;
}

/** 绿色药丸开关:开启时背景 C.green,圆点右移。 */
export function Toggle({ on }: { on: boolean }) {
  return (
    <span
      className="inline-flex items-center w-11 h-6 rounded-full px-0.5 transition-colors shrink-0"
      style={{ background: on ? C.green : '#D5D7DB', justifyContent: on ? 'flex-end' : 'flex-start' }}
    >
      <span className="w-5 h-5 rounded-full bg-white shadow-sm" />
    </span>
  );
}

function ToggleRow({ label, on, bind, last }: { label: string; on: boolean; bind: object; last?: boolean }) {
  return (
    <button
      {...bind}
      className={`w-full flex items-center px-4 h-12 bg-transparent border-none cursor-pointer text-left ${last ? '' : 'border-b'}`}
      style={{ color: C.text, fontSize: 15, borderColor: C.border }}
    >
      <span className="flex-1">{label}</span>
      <Toggle on={on} />
    </button>
  );
}

function SelectRow({ label, value, bind, last }: { label: string; value: string; bind: object; last?: boolean }) {
  return (
    <button
      {...bind}
      className={`w-full flex items-center gap-2 px-4 h-12 bg-transparent border-none cursor-pointer text-left ${last ? '' : 'border-b'}`}
      style={{ color: C.text, fontSize: 15, borderColor: C.border }}
    >
      <span className="flex-1">{label}</span>
      <span style={{ color: C.sub, fontSize: 13 }}>{value}</span>
      <IcArrowRight size={18} style={{ color: C.sub }} />
    </button>
  );
}
