import React from 'react';
import { IcBack } from '../res/icons';
import { useCainiaoGestures } from '../hooks/useCainiaoGestures';

interface TopBarProps {
  title: React.ReactNode;
  right?: React.ReactNode;
  /** 深色底(白字)变体 */
  dark?: boolean;
  transparent?: boolean;
}

/** 内页顶栏:返回(bindBack)+ 居中标题 + 右侧插槽 */
export default function TopBar({ title, right, dark, transparent }: TopBarProps) {
  const { bindBack } = useCainiaoGestures();
  return (
    <div
      className={`flex h-[84px] shrink-0 items-center px-1 pt-10 ${
        transparent ? '' : dark ? 'bg-(--app-c-brand)' : 'bg-(--app-c-card-bg)'
      }`}
    >
      <button
        {...bindBack()}
        className={`flex h-11 w-11 cursor-pointer items-center justify-center border-none bg-transparent ${dark ? 'text-white' : 'text-(--app-c-text-primary)'}`}
        aria-label="返回"
      >
        <IcBack size={24} />
      </button>
      <div className={`flex-1 truncate text-center text-[17px] font-semibold ${dark ? 'text-white' : 'text-(--app-c-text-primary)'}`}>
        {title}
      </div>
      <div className="flex h-11 min-w-11 items-center justify-end pr-2">{right}</div>
    </div>
  );
}
