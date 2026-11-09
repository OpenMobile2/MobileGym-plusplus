import React from 'react';
import { useXiaorichangGestures } from '../hooks/useXiaorichangGestures';
import { IcBack } from '../res/icons';
import { useStrings } from '../hooks/useStrings';

/** 标准页头:返回 + 标题 + 右侧插槽。每页顶部预留状态栏 pt-10 由页面容器负责。 */
export const PageHeader: React.FC<{ title: string; right?: React.ReactNode }> = ({ title, right }) => {
  const { bindBack } = useXiaorichangGestures();
  return (
    <div className="flex shrink-0 items-center justify-between px-3 pb-2 pt-10">
      <button {...bindBack()} aria-label="返回"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
        <IcBack size={20} />
      </button>
      <div className="text-[15px] font-semibold text-[#424242]">{title}</div>
      <div className="flex min-w-9 items-center justify-end gap-2">{right}</div>
    </div>
  );
};

/** 路由 ID 缺失或所指数据已被删除时的可返回空态。 */
export const MissingContent: React.FC = () => {
  const s = useStrings();
  return (
    <div className="flex h-full flex-col bg-[#F8F8F8]" data-status-bar-foreground="dark">
      <PageHeader title={s.contentMissingTitle} />
      <div className="flex flex-1 flex-col items-center justify-center px-8 pb-20 text-center">
        <div className="text-sm font-semibold text-[#6B7280]">{s.contentMissing}</div>
        <div className="mt-1 text-xs text-[#9AA5B1]">{s.contentMissingHint}</div>
      </div>
    </div>
  );
};

/** 菜单行 */
export const MenuRow: React.FC<{
  label: string; danger?: boolean; icon?: React.ReactNode; trailing?: React.ReactNode;
} & Record<string, any>> = ({ label, danger, icon, trailing, ...bind }) => (
  <button {...bind}
    className="flex w-full items-center gap-3 px-6 py-3.5 text-left text-[15px]"
    style={{ color: danger ? '#DE4A3F' : '#424242' }}>
    {icon}
    <span className="flex-1">{label}</span>
    {trailing}
  </button>
);

/** 开关 */
export const Switch: React.FC<{ on: boolean } & Record<string, any>> = ({ on, ...bind }) => (
  <button {...bind} role="switch" aria-checked={on}
    className="relative h-7 w-12 rounded-full transition-colors"
    style={{ background: on ? '#F7CE45' : '#E3E5E8' }}>
    <span className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all"
      style={{ left: on ? 22 : 2 }} />
  </button>
);

/** 设置行(label + 尾部控件) */
export const SettingRow: React.FC<{ label: string; children?: React.ReactNode; hint?: string }> =
  ({ label, children, hint }) => (
    <div className="flex items-center justify-between border-b border-[#F2F2F2] bg-white px-4 py-3.5">
      <div>
        <div className="text-sm text-[#424242]">{label}</div>
        {hint && <div className="mt-0.5 text-xs text-[#9AA5B1]">{hint}</div>}
      </div>
      {children}
    </div>
  );

/** 分段选择胶囊组 */
export const Segmented: React.FC<{
  options: { key: string; label: string; bind: Record<string, any> }[];
  value: string;
}> = ({ options, value }) => (
  <div className="flex rounded-full bg-[#F2F3F5] p-1">
    {options.map((o) => (
      <button key={o.key} {...o.bind}
        className="flex-1 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px]"
        style={value === o.key ? { background: '#fff', color: '#424242', fontWeight: 600 } : { color: '#9AA5B1' }}>
        {o.label}
      </button>
    ))}
  </div>
);
