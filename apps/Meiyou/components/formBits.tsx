/** 记录项/表单共享小组件:档位图标(选中绿勾) */
import React from 'react';
import { IcCheck } from '../res/icons';
export { MY } from './ui';

export function IconCheckWrap({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <div className="relative w-12 h-12 rounded-full flex items-center justify-center text-[13px] text-[#C65A80]"
      style={{ background: active ? '#FFE3ED' : '#F7F0F3', border: active ? '2px solid #FA4B85' : '2px solid transparent' }}>
      {children}
      {active && (
        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#4CD07D] flex items-center justify-center border border-white">
          <IcCheck size={10} className="text-white" />
        </span>
      )}
    </div>
  );
}
