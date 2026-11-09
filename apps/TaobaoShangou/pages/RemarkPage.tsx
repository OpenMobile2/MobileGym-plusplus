import React, { useState } from 'react';
import { useAppStrings } from '@/os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { useTbsgGestures } from '../hooks/useTbsgGestures';
import { useTbsgStore } from '../state';
import { TopBar, showToast } from '../components/common';
import { IcEdit } from '../res/icons';

const MAX_LEN = 50;

const QUICK_INPUTS = [
  '不要敲门',
  '放前台',
  '放门卫',
  '不要打电话',
  '请提前电话联系',
  '堂食无需打包',
  '我要自取不要配送',
  '对骑手:放指定位置',
  '对商家:少放辣',
];

/** 订单备注编辑页(spec checkout.remark,证据 IMG_6026) */
export default function RemarkPage() {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap } = useTbsgGestures();
  const draft = useTbsgStore((st) => st.checkoutDraft);
  const defaultRemark = useTbsgStore((st) => st.settings.defaultRemark);
  const setCheckoutField = useTbsgStore((st) => st.setCheckoutField);
  const updateSettings = useTbsgStore((st) => st.updateSettings);

  const [text, setText] = useState(draft?.remark ?? '');

  const append = (t: string) => setText((prev) => (prev ? `${prev},${t}` : t).slice(0, MAX_LEN));

  return (
    <div className="flex flex-col h-full bg-white">
      <TopBar
        title={s.remark}
        titleLeft
        right={(
          <button
            {...bindTap<HTMLButtonElement>('checkout.remark.done', {
              beforeTrigger: () => setCheckoutField({ remark: text }),
            })}
            className="h-8 px-4 rounded-lg bg-[#ED6C2C] text-white text-[14px] font-semibold border-none cursor-pointer"
          >
            {s.done}
          </button>
        )}
      />
      <div data-scroll-container="main" data-scroll-direction="vertical" className="flex-1 overflow-y-auto px-4 pb-4">
        {/* 输入卡 */}
        <div className="bg-[#F3F6F8] rounded-xl p-3 mt-2">
          <textarea
            {...bindTap<HTMLTextAreaElement>(
              { kind: 'action', id: 'checkout.remark.input' },
              { onTrigger: () => {} },
            )}
            value={text}
            maxLength={MAX_LEN}
            onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
            placeholder="口味、偏好等要求"
            className="w-full h-32 bg-transparent border-none outline-none resize-none text-[15px] text-[#1A1A1A] placeholder:text-[#BBBBBB]"
          />
          <div className="flex items-center justify-between mt-1">
            <span className="text-[13px] text-[#999999]">{text.length}/{MAX_LEN}</span>
            <button
              {...bindTap<HTMLButtonElement>(
                { kind: 'action', id: 'checkout.remark.setDefault' },
                {
                  onTrigger: () => {
                    updateSettings({ defaultRemark: text });
                    showToast('已设为默认');
                  },
                },
              )}
              className="h-8 px-3 rounded-lg bg-white border border-[#DDDDDD] text-[13px] text-[#1A1A1A] cursor-pointer"
            >
              设为默认备注
            </button>
          </div>
        </div>

        {/* 快捷输入 */}
        <div className="text-[15px] font-semibold text-[#666666] mt-5">快捷输入</div>
        <div className="flex flex-wrap gap-2.5 mt-3">
          {QUICK_INPUTS.map((t) => (
            <button
              key={t}
              {...bindTap<HTMLButtonElement>(
                { kind: 'action', id: 'checkout.remark.quick' },
                { params: { text: t }, onTrigger: () => append(t) },
              )}
              className="h-10 px-4 rounded-lg bg-white border border-[#E5E5E5] text-[14px] text-[#1A1A1A] cursor-pointer"
            >
              {t}
            </button>
          ))}
        </div>

        {/* 默认备注 */}
        <div className="flex items-center justify-between mt-6">
          <span className="text-[15px] font-semibold text-[#666666]">默认备注标签</span>
          <span className="flex items-center gap-1 text-[14px] text-[#666666]">
            <IcEdit size={13} className="text-[#999999]" />
            编辑
          </span>
        </div>
        {defaultRemark ? (
          <div className="inline-block border border-[#E5E5E5] rounded-lg p-2.5 mt-3 max-w-full">
            <span className="text-[11px] text-[#ED6C2C] bg-[#FDEEE3] rounded px-1 py-0.5">餐饮订单默认</span>
            <div className="text-[14px] text-[#1A1A1A] mt-1 break-all">{defaultRemark}</div>
          </div>
        ) : (
          <div className="text-[13px] text-[#999999] mt-3">暂无默认备注</div>
        )}
      </div>
    </div>
  );
}
