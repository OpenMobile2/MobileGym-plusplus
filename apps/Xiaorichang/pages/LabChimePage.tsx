import React from 'react';
import { useXiaorichangStore } from '../state';
import { useXiaorichangGestures } from '../hooks/useXiaorichangGestures';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';
import { IcBell } from '../res/icons';
import { PageHeader } from '../components/common';

/**
 * 整点报时(Gate4 补拍 s251)。原裁定 wontfix(需音频/后台),证明过头:
 * 24 个整点方块是纯本地开关,可完整实现并持久化;
 * 真正做不到的只是「实际发声」,而真机说明条本身就把责任推给了系统通知设置。
 */
export default function LabChimePage() {
  const st = useXiaorichangStore();
  const { action } = useXiaorichangGestures();
  const s = useStrings();
  const on = st.settings.chimeHours;

  return (
    <div className="flex h-full flex-col bg-[#F5F6F7]" data-status-bar-foreground="dark">
      <PageHeader title={s.chimeTitle} />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="rounded-2xl bg-white p-4 text-xs leading-relaxed text-[#424242]">
          {s.chimeHint}
        </div>
        <div className="mt-4 grid grid-cols-4 gap-3">
          {Array.from({ length: 24 }, (_, h) => {
            const active = on.includes(h);
            return (
              <button key={h}
                {...action('lab.chime.hour.toggle', () => st.toggleChimeHour(h), { params: { hour: h } })}
                className="flex h-20 flex-col items-center justify-center gap-1.5 rounded-2xl"
                style={active
                  ? { background: colors.brandSoft, color: '#8A6A1E' }
                  : { background: '#fff', color: '#212121' }}>
                <IcBell size={22} />
                <span className="text-xs font-semibold">{h}:00</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
