import React from 'react';
import { TopBar, Screen, WY } from '../components/ui';

const GROUPS: [string, string[]][] = [
  ['我的信息', ['我的年龄', '我的性别', '我的地区', '个人简介']],
  ['我的内容', ['我喜欢的音乐', '我的听歌排行', '我创建的歌单']],
  ['我的页功能', ['我的状态', '搜索', '心动模式']],
];
const OPTIONS = ['所有人', '仅粉丝', '不展示'];
export default function PrivacyPage() {
  const [vals, setVals] = React.useState<Record<string, string>>({});
  return (
    <Screen>
      <TopBar title="隐私设置" />
      <div className="flex-1 overflow-y-auto">
        {GROUPS.map(([g, items]) => (
          <div key={g}>
            <div className="text-[13px] px-4 pt-4 pb-1" style={{ color: WY.textSecondary }}>{g}</div>
            {items.map((it) => {
              const cur = vals[it] || '所有人';
              return (
                <button key={it} onClick={() => setVals((v) => ({ ...v, [it]: OPTIONS[(OPTIONS.indexOf(cur) + 1) % OPTIONS.length] }))} className="flex items-center w-full px-4 py-3 bg-white border-b bg-transparent border-none cursor-pointer text-left" style={{ borderColor: WY.divider }}>
                  <span className="flex-1 text-[14px]" style={{ color: WY.textPrimary }}>{it}</span>
                  <span className="text-[13px]" style={{ color: WY.textSecondary }}>{cur} ›</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </Screen>
  );
}
