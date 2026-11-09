import React from 'react';
import { useDidaGestures } from '../hooks/useDidaGestures';
import { useDidaTheme } from '../hooks/useDidaTheme';
import { IcBack, IcCheck } from '../res/icons';

/** 设置子页通用壳：返回 + 标题 + 可滚动内容 */
export const SettingsScaffold: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => {
  const { bindBack } = useDidaGestures();
  const { isDark } = useDidaTheme();
  return (
    <div
      data-status-bar-foreground={isDark ? 'light' : 'dark'}
      className="dida-page flex h-full flex-col pt-10"
    >
      <div className="flex items-center px-3 py-2">
        <button
          {...bindBack()}
          aria-label="back"
          className="dida-card flex h-10 w-10 items-center justify-center rounded-full"
        >
          <IcBack size={20} />
        </button>
        <span className="ml-2 text-[17px] font-semibold">{title}</span>
      </div>
      <div
        data-scroll-container="main"
        data-scroll-direction="vertical"
        className="min-h-0 flex-1 overflow-y-auto px-3 pb-8"
      >
        {children}
      </div>
    </div>
  );
};

export const SettingsGroup: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div className={`dida-card mb-4 overflow-hidden rounded-2xl ${className}`}>{children}</div>
);

/** 单选行：左侧文案，右侧勾 */
export const SettingsChoiceRow: React.FC<{
  label: string;
  selected: boolean;
  bind: React.HTMLAttributes<HTMLElement>;
  last?: boolean;
  trailing?: React.ReactNode;
}> = ({ label, selected, bind, last, trailing }) => {
  const { accentHex } = useDidaTheme();
  return (
    <button
      {...bind}
      className={`flex w-full items-center justify-between px-4 py-3.5 text-left ${last ? '' : 'border-b'}`}
      style={{ borderColor: 'var(--dida-divider)' }}
    >
      <span className="flex items-center gap-3 text-[16px]">
        {trailing}
        {label}
      </span>
      {selected ? <IcCheck size={18} style={{ color: accentHex }} /> : <span className="h-[18px] w-[18px]" />}
    </button>
  );
};
