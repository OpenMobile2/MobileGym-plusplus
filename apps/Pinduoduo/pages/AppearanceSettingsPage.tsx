import React from 'react';
import { usePinduoduoGestures } from '../hooks/usePinduoduoGestures';
import { usePinduoduoStore } from '../state';
import { TopBar, showToast } from '../components/ui';
import { IcCheck } from '../res/icons';

const LANGS = [
  { lang: 'zh', label: '简体中文' },
  { lang: 'en', label: 'English' },
];
const FONTS: { scale: number; label: string }[] = [
  { scale: 1, label: '标准' },
  { scale: 1.1, label: '大号' },
  { scale: 1.2, label: '超大号' },
];
const MODES = [
  { mode: 'normal', label: '普通' },
  { mode: 'dark', label: '深色' },
];

// 外观与语言
export function AppearanceSettingsPage() {
  const { bindTap } = usePinduoduoGestures();
  const darkMode = usePinduoduoStore((s) => s.settings.darkMode);
  const fontScale = usePinduoduoStore((s) => s.settings.fontScale);
  const setFontScale = usePinduoduoStore((s) => s.setFontScale);
  const setDarkMode = usePinduoduoStore((s) => s.setDarkMode);

  const RadioRow = ({
    active,
    label,
    bind,
    last,
  }: {
    active: boolean;
    label: string;
    bind: React.HTMLAttributes<HTMLElement>;
    last?: boolean;
  }) => (
    <button
      {...bind}
      className={`w-full flex items-center px-4 py-3.5 text-left ${last ? '' : 'border-b border-[#F5F5F5]'}`}
    >
      <span className={`flex-1 text-[15px] ${active ? 'text-[#E22E1F]' : 'text-[#333]'}`}>{label}</span>
      {active && <IcCheck size={18} className="text-[#E22E1F]" />}
    </button>
  );

  return (
    <div className="h-full flex flex-col pt-10 bg-[#F5F5F5] overflow-hidden" data-status-bar-foreground="dark">
      <TopBar title="外观与语言" />

      <div className="flex-1 overflow-y-auto">
        {/* 语言 */}
        <div className="px-4 pt-4 pb-1 text-[12px] text-[#999]">语言</div>
        <div className="mx-3 bg-white rounded-xl overflow-hidden">
          {LANGS.map((l, i) => (
            <RadioRow
              key={l.lang}
              active={l.lang === 'zh'}
              label={l.label}
              last={i === LANGS.length - 1}
              bind={bindTap(
                { kind: 'action', id: 'appearance.language.select' },
                { params: { lang: l.lang }, onTrigger: () => showToast('语言跟随系统设置') },
              )}
            />
          ))}
        </div>

        {/* 字体大小 */}
        <div className="px-4 pt-4 pb-1 text-[12px] text-[#999]">字体大小</div>
        <div className="mx-3 bg-white rounded-xl overflow-hidden">
          {FONTS.map((f, i) => (
            <RadioRow
              key={f.scale}
              active={fontScale === f.scale}
              label={f.label}
              last={i === FONTS.length - 1}
              bind={bindTap(
                { kind: 'action', id: 'appearance.fontsize.set' },
                { params: { scale: f.scale }, onTrigger: () => setFontScale(f.scale) },
              )}
            />
          ))}
        </div>

        {/* 深色模式 */}
        <div className="px-4 pt-4 pb-1 text-[12px] text-[#999]">深色模式</div>
        <div className="mx-3 bg-white rounded-xl overflow-hidden mb-4">
          {MODES.map((m, i) => (
            <RadioRow
              key={m.mode}
              active={m.mode === 'dark' ? darkMode : !darkMode}
              label={m.label}
              last={i === MODES.length - 1}
              bind={bindTap(
                { kind: 'action', id: 'appearance.darkmode.select' },
                { params: { mode: m.mode }, onTrigger: () => setDarkMode(m.mode === 'dark') },
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
