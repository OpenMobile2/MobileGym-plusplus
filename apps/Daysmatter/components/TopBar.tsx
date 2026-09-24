import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useDaysmatterGestures } from '../hooks/useDaysmatterGestures';

interface Props {
  title?: string;
  /** 显示返回箭头 */
  back?: boolean;
  /** 左侧自定义(覆盖 back) */
  left?: ReactNode;
  /** 右侧操作区 */
  right?: ReactNode;
  /** 蓝色实心顶栏(首页风格) */
  solid?: boolean;
}

/** 通用顶栏。自带 pt-10 状态栏色条，与顶栏同色，页面外层容器不要再加 pt-10。 */
export default function TopBar({ title, back, left, right, solid }: Props) {
  const { bindBack } = useDaysmatterGestures();
  const textColor = solid ? 'text-white' : 'text-[#1A1A1A]';
  return (
    <div
      className={`flex h-[84px] w-full flex-shrink-0 items-center px-2 pt-10 ${solid ? 'bg-[#3E7CB1]' : 'bg-white'}`}
    >
      <div className="flex w-16 items-center">
        {left ??
          (back ? (
            <button {...bindBack<HTMLButtonElement>()} className="flex items-center p-1" aria-label="返回">
              <ChevronLeft size={26} className={textColor} />
            </button>
          ) : null)}
      </div>
      <div className={`flex-1 truncate text-center text-[17px] font-medium ${textColor}`}>{title}</div>
      <div className="flex w-16 items-center justify-end gap-1.5 pr-1">{right}</div>
    </div>
  );
}
