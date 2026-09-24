import React from 'react';
import { useKapiGestures } from '../hooks/useKapiGestures';
import { IcBackspace, IcPlus, IcMinus } from '../res/icons';

/**
 * 内置数字键盘。inputActionId 走 record.amount.input.value / discount.amount.input.value 等。
 * primary=完成(蓝),secondary=再记(白,可选)。
 */
export function Keypad({
  inputActionId,
  onInput,
  primaryLabel = '完成',
  primaryActionId,
  onPrimary,
  secondaryLabel,
  secondaryActionId,
  onSecondary,
}: {
  inputActionId: string;
  onInput: (key: string) => void;
  primaryLabel?: string;
  primaryActionId: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  secondaryActionId?: string;
  onSecondary?: () => void;
}) {
  const { bindAction } = useKapiGestures();
  const Key = ({ k, children }: { k: string; children: React.ReactNode }) => (
    <button
      {...bindAction(inputActionId, () => onInput(k), { value: k })}
      className="h-12 rounded-lg bg-white text-[22px] text-[#1A1D26] flex items-center justify-center border-none cursor-pointer active:bg-[#EAECF2] shadow-[0_1px_0_rgba(0,0,0,0.04)]"
    >
      {children}
    </button>
  );

  return (
    <div className="grid grid-cols-4 gap-2 p-2 bg-[#E9ECF3]">
      <Key k="1">1</Key>
      <Key k="2">2</Key>
      <Key k="3">3</Key>
      <button
        {...bindAction(inputActionId, () => onInput('del'), { value: 'del' })}
        className="h-12 rounded-lg bg-white flex items-center justify-center border-none cursor-pointer active:bg-[#EAECF2]"
      >
        <IcBackspace size={22} className="text-[#1A1D26]" />
      </button>

      <Key k="4">4</Key>
      <Key k="5">5</Key>
      <Key k="6">6</Key>
      <button
        {...bindAction(inputActionId, () => onInput('+'), { value: '+' })}
        className="h-12 rounded-lg bg-white flex items-center justify-center border-none cursor-pointer active:bg-[#EAECF2]"
      >
        <IcPlus size={22} className="text-[#1A1D26]" />
      </button>

      <Key k="7">7</Key>
      <Key k="8">8</Key>
      <Key k="9">9</Key>
      <button
        {...bindAction(inputActionId, () => onInput('-'), { value: '-' })}
        className="h-12 rounded-lg bg-white flex items-center justify-center border-none cursor-pointer active:bg-[#EAECF2]"
      >
        <IcMinus size={22} className="text-[#1A1D26]" />
      </button>

      {secondaryActionId && onSecondary ? (
        <button
          {...bindAction(secondaryActionId, onSecondary)}
          className="h-12 rounded-lg bg-white text-[16px] text-[#4B6EF5] flex items-center justify-center border-none cursor-pointer active:bg-[#EAECF2]"
        >
          {secondaryLabel}
        </button>
      ) : (
        <div className="h-12 rounded-lg bg-white" />
      )}
      <Key k="0">0</Key>
      <Key k=".">.</Key>
      <button
        {...bindAction(primaryActionId, onPrimary)}
        className="h-12 rounded-lg bg-[#4B6EF5] text-[16px] text-white flex items-center justify-center border-none cursor-pointer active:bg-[#3D5CE0]"
      >
        {primaryLabel}
      </button>
    </div>
  );
}
