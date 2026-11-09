import React from 'react';
import { useXiaorichangStore } from '../state';
import { useXiaorichangGestures } from '../hooks/useXiaorichangGestures';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';
import { PageHeader, SettingRow, Switch } from '../components/common';

const BG_COLORS = ['#FFF5D5', '#FFE9E3', '#E8F6EE', '#E9F2FB', '#F1EDF9', '#FBEEF1', '#F7F7F7', '#FDF3E3'];

/** 小组件设置(s186)。 */
export default function WidgetPage() {
  const st = useXiaorichangStore();
  const { action, back } = useXiaorichangGestures();
  const s = useStrings();
  const w = st.settings.widget;
  const setW = (patch: Partial<typeof w>) => st.updateSettings({ widget: { ...w, ...patch } });

  return (
    <div className="flex h-full flex-col bg-[#F8F8F8]" data-status-bar-foreground="dark">
      <PageHeader title={s.widgetSettings}
        right={<button {...action('widget.settings.commit', () => back())}
          className="rounded-full px-4 py-1.5 text-sm font-bold text-[#5B4718]" style={{ background: colors.brand }}>
          完成
        </button>} />
      <div className="px-4">
        <div className="overflow-hidden rounded-2xl">
          <SettingRow label="直接打卡" hint="小组件上点击图标直接完成打卡">
            <Switch on={w.directCheckin} {...action('widget.directCheckin.toggle', () => setW({ directCheckin: !w.directCheckin }))} />
          </SettingRow>
          <SettingRow label="完成后保留显示">
            <Switch on={w.keepVisible} {...action('widget.keepVisible.toggle', () => setW({ keepVisible: !w.keepVisible }))} />
          </SettingRow>
        </div>
        <div className="mt-3 rounded-2xl bg-white p-4">
          <div className="mb-2 text-sm font-semibold text-[#424242]">背景颜色</div>
          <div className="flex flex-wrap gap-2.5">
            {BG_COLORS.map((c, i) => (
              <button key={c}
                {...action('widget.bg.pick', () => setW({ bgColor: c }), { params: { colorId: String(i) } })}
                className="h-9 w-9 rounded-full border border-black/5"
                style={{ background: c, outline: w.bgColor === c ? `2px solid ${colors.inkStrong}` : 'none', outlineOffset: 2 }} />
            ))}
            <button {...action('widget.bg.custom.wontfixToast', () => st.showNotice(s.notAvailable))}
              className="h-9 w-9 rounded-full border-2 border-dashed border-[#C9CDD3] text-xs text-[#9AA5B1]">+</button>
          </div>
        </div>
      </div>
    </div>
  );
}
