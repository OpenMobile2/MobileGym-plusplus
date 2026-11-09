import React from 'react';
import { useBossStore } from '../state';
import { COLORS } from '../res/colors';

/** 未实现/受环境限制的入口统一使用可确认弹窗，避免短暂 toast 被 agent 漏看。 */
const NoticeDialog: React.FC = () => {
  const notice = useBossStore((s) => s._temp.notice);
  const dismissNotice = useBossStore((s) => s.dismissNotice);

  if (!notice) return null;

  return (
    <div className="absolute inset-0 z-[80] flex items-center justify-center bg-black/40 px-8" role="dialog" aria-modal="true" aria-label="功能提示">
      <div className="w-full rounded-2xl bg-white p-5 shadow-xl">
        <div className="text-center text-[17px] font-semibold text-gray-900">功能提示</div>
        <p className="mt-2 whitespace-pre-wrap text-center text-[14px] leading-relaxed text-gray-600">{notice}</p>
        <button
          onClick={dismissNotice}
          className="mt-5 w-full rounded-full py-2.5 text-[15px] font-medium text-white"
          style={{ backgroundColor: COLORS.primaryBtn }}
        >
          我知道了
        </button>
      </div>
    </div>
  );
};

export default NoticeDialog;
