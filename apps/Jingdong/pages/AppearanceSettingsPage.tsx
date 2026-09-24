import React, { useState } from 'react';
import { useJingdongGestures } from '../hooks/useJingdongGestures';
import { TopBar } from '../components/ui';
import { useJingdongStore } from '../state';
import { useJingdongStrings } from '../hooks/useJingdongStrings';
import { IcCheck } from '../res/icons';

type DarkChoice = 'normal' | 'dark' | 'system';
type AppLocale = 'zh-Hans' | 'en';

const FONT_STEPS: { label: string; value: number }[] = [
  { label: '小', value: 0.85 },
  { label: '标准', value: 1 },
  { label: '大', value: 1.15 },
  { label: '特大', value: 1.3 },
];

export function AppearanceSettingsPage() {
  const { bindTap, bindBack } = useJingdongGestures();
  const t = useJingdongStrings();

  const appearanceMode = useJingdongStore((s) => s.settings.appearanceMode ?? (s.settings.darkMode ? 'dark' : 'normal'));
  const fontScale = useJingdongStore((s) => s.settings.fontScale);
  const language = useJingdongStore((s) => s.settings.language ?? 'zh-Hans');
  const setAppearanceMode = useJingdongStore((s) => s.setAppearanceMode);
  const setFontScale = useJingdongStore((s) => s.setFontScale);
  const setLanguage = useJingdongStore((s) => s.setLanguage);

  const [darkChoice, setDarkChoice] = useState<DarkChoice>(appearanceMode);
  const activeStep =
    FONT_STEPS.reduce(
      (best, s, i) => (Math.abs(s.value - fontScale) < Math.abs(FONT_STEPS[best].value - fontScale) ? i : best),
      1,
    );

  const darkOptions: { id: DarkChoice; label: string }[] = [
    { id: 'normal', label: '普通' },
    { id: 'dark', label: '深色' },
    { id: 'system', label: '跟随系统' },
  ];

  const langOptions: { id: AppLocale; label: string }[] = [
    { id: 'zh-Hans', label: '中文' },
    { id: 'en', label: 'English' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5] pt-10" data-status-bar-foreground="dark">
      <TopBar title="外观与语言" />
      <div className="flex-1 overflow-y-auto pb-6">
        {/* 暗黑模式 */}
        <div className="px-4 pt-4 pb-1.5 text-[12px] text-[#999]">暗黑模式</div>
        <div className="bg-white mx-3 rounded-xl p-3 grid grid-cols-3 gap-3">
          {darkOptions.map((opt) => {
            const on = darkChoice === opt.id;
            return (
              <button
                key={opt.id}
                {...bindTap(
                  { kind: 'action', id: 'appearance.darkmode.select.mode' },
                  {
                    onTrigger: () => {
                      setDarkChoice(opt.id);
                      setAppearanceMode(opt.id);
                    },
                  },
                )}
                className="flex flex-col items-center gap-2"
              >
                <div
                  className={`w-full h-16 rounded-lg border-2 flex items-center justify-center ${
                    on ? 'border-[#E1251B]' : 'border-transparent'
                  } ${
                    opt.id === 'dark'
                      ? 'bg-[#1A1A1A]'
                      : opt.id === 'system'
                        ? 'bg-gradient-to-br from-white to-[#1A1A1A]'
                        : 'bg-[#EFEFEF]'
                  }`}
                >
                  <span className={`text-[13px] ${opt.id === 'dark' ? 'text-white' : 'text-[#666]'}`}>
                    Aa
                  </span>
                </div>
                <span className={`text-[13px] ${on ? 'text-[#E1251B] font-semibold' : 'text-[#333]'}`}>
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* 字体大小 */}
        <div className="px-4 pt-4 pb-1.5 text-[12px] text-[#999]">字体大小</div>
        <div className="bg-white mx-3 rounded-xl p-4">
          <div className="text-[#1A1A1A] mb-4" style={{ fontSize: `${15 * FONT_STEPS[activeStep].value}px` }}>
            京东,多快好省
          </div>
          <div className="relative h-8 flex items-center">
            <div className="absolute left-2 right-2 h-0.5 bg-[#EEE]" />
            <div className="relative flex-1 flex justify-between px-1">
              {FONT_STEPS.map((s, i) => (
                <button
                  key={s.label}
                  {...bindTap(
                    { kind: 'action', id: 'appearance.fontsize.set' },
                    { params: { scale: s.value }, onTrigger: () => setFontScale(s.value) },
                  )}
                  className="flex flex-col items-center"
                >
                  <span
                    className={`w-4 h-4 rounded-full border-2 ${
                      i === activeStep ? 'bg-[#E1251B] border-[#E1251B]' : 'bg-white border-[#CCC]'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-between px-1 mt-1 text-[12px] text-[#999]">
            {FONT_STEPS.map((s) => (
              <span key={s.label} className={s.value === FONT_STEPS[activeStep].value ? 'text-[#E1251B]' : ''}>
                {s.label}
              </span>
            ))}
          </div>
        </div>

        {/* 语言:仅影响本 App,不改系统 locale */}
        <div className="px-4 pt-4 pb-1.5 text-[12px] text-[#999]">语言 / Language（仅京东 App）</div>
        <div className="bg-white mx-3 rounded-xl overflow-hidden">
          {langOptions.map((opt) => {
            const on = language === opt.id;
            return (
              <button
                key={opt.id}
                {...bindTap(
                  { kind: 'action', id: 'appearance.language.select.locale' },
                  { params: { locale: opt.id }, onTrigger: () => setLanguage(opt.id) },
                )}
                className="w-full flex items-center px-4 h-[52px] text-left border-b border-[#F2F2F2] last:border-0"
              >
                <span className="flex-1 text-[15px] text-[#1A1A1A]">{opt.label}</span>
                {on && <IcCheck size={20} className="text-[#E1251B]" />}
              </button>
            );
          })}
        </div>

        {/* 确定 */}
        <div className="mx-3 mt-6">
          <button
            {...bindBack()}
            className="w-full h-11 rounded-full bg-[#E1251B] text-white text-[16px] font-semibold"
          >
            {t.btn_confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
