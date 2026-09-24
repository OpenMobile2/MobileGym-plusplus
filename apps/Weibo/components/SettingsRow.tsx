import React from 'react';

/** 普通导航/信息行(右侧可带说明文字+箭头)。binding 自带 onTrigger。 */
export function NavRow({
  label, value, binding, showArrow = true,
}: {
  label: string;
  value?: string;
  binding: object;
  showArrow?: boolean;
}) {
  return (
    <button
      {...binding}
      className="flex items-center w-full px-4 py-3.5 bg-transparent border-none border-b border-[#FAFAFA] cursor-pointer text-left"
    >
      <span className="flex-1 text-[15px] text-[#1A1A1A]">{label}</span>
      {value && <span className="text-[13px] text-[#9A9A9A] mr-1">{value}</span>}
      {showArrow && <span className="text-[#CCCCCC] text-[16px]">›</span>}
    </button>
  );
}

/** 开关行(iOS 风格 toggle)。binding 需自带 onTrigger(执行状态变更)。 */
export function ToggleRow({
  label, sub, value, binding,
}: {
  label: string;
  sub?: string;
  value: boolean;
  binding: object;
}) {
  return (
    <button
      {...binding}
      className="flex items-center w-full px-4 py-3.5 bg-transparent border-none border-b border-[#FAFAFA] cursor-pointer text-left"
    >
      <div className="flex-1 min-w-0">
        <div className="text-[15px] text-[#1A1A1A]">{label}</div>
        {sub && <div className="text-[12px] text-[#9A9A9A] mt-0.5">{sub}</div>}
      </div>
      <span className={`w-11 h-6 rounded-full shrink-0 relative transition-colors ${value ? 'bg-[#FF8200]' : 'bg-[#DDDDDD]'}`}>
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${value ? 'left-[22px]' : 'left-0.5'}`} />
      </span>
    </button>
  );
}

/** 单选段。binding(id) 需自带 onTrigger。 */
export function SelectRow<T extends string>({
  label, value, options, binding,
}: {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  binding: (id: T) => object;
}) {
  return (
    <div className="border-b border-[#FAFAFA]">
      <div className="px-4 pt-3 pb-1 text-[13px] text-[#9A9A9A]">{label}</div>
      {options.map((o) => (
        <button
          key={o.id}
          {...binding(o.id)}
          className="flex items-center w-full px-4 py-3 bg-transparent border-none cursor-pointer text-left"
        >
          <span className="flex-1 text-[15px] text-[#1A1A1A]">{o.label}</span>
          {value === o.id && <span className="text-[#FF8200] text-[18px]">✓</span>}
        </button>
      ))}
    </div>
  );
}
