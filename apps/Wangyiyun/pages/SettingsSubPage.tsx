import React from 'react';
import { useParams } from 'react-router-dom';
import { useWangyiyunStore } from '../state';
import { TopBar, Screen, WY } from '../components/ui';

const ITEMS: Record<string, { key: string; type: 'toggle' | 'choice'; opts?: string[] }[]> = {
  '音质': [{ key: '音质', type: 'choice', opts: ['标准', '极高', '无损'] }],
  '播放与下载': [{ key: '流量提醒', type: 'toggle' }],
  '通用': [{ key: '夜间模式', type: 'toggle' }],
  '未成年人模式': [{ key: '未成年人模式', type: 'toggle' }],
};
export default function SettingsSubPage() {
  const { section = '' } = useParams();
  const settings = useWangyiyunStore((s) => s.settings);
  const setSetting = useWangyiyunStore((s) => s.setSetting);
  const items = ITEMS[section] || [{ key: section, type: 'toggle' as const }];
  return (
    <Screen>
      <TopBar title={section} />
      <div className="flex-1 overflow-y-auto">
        {items.map((it) => {
          const val = settings[it.key];
          if (it.type === 'choice') {
            return (
              <div key={it.key}>
                {it.opts!.map((o) => (
                  <button key={o} onClick={() => setSetting(it.key, o)} className="flex items-center w-full px-4 py-3.5 bg-white border-b bg-transparent border-none cursor-pointer text-left" style={{ borderColor: WY.divider }}>
                    <span className="flex-1 text-[15px]" style={{ color: WY.textPrimary }}>{o}</span>
                    {val === o && <span style={{ color: WY.primary }}>✓</span>}
                  </button>
                ))}
              </div>
            );
          }
          return (
            <button key={it.key} onClick={() => setSetting(it.key, !val)} className="flex items-center w-full px-4 py-3.5 bg-white border-b bg-transparent border-none cursor-pointer text-left" style={{ borderColor: WY.divider }}>
              <span className="flex-1 text-[15px]" style={{ color: WY.textPrimary }}>{it.key}</span>
              <span className="w-11 h-6 rounded-full relative transition-colors" style={{ background: val ? WY.primary : '#D8D8DC' }}>
                <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all" style={{ left: val ? 22 : 2 }} />
              </span>
            </button>
          );
        })}
      </div>
    </Screen>
  );
}
