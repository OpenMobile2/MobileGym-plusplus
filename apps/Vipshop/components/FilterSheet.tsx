/**
 * 筛选弹层(搜索结果页 / 品牌专场共用)。
 *
 * 原本是独立路由页 /search/filter,确认后 replace 回结果页,导致返回键在
 * 结果页和筛选页之间打转。改成本页弹层后:开=push 一条 search 参数,
 * 确认/关闭=back() 弹掉这一条,返回栈始终干净。
 *
 * 受控组件:草稿态由调用页持有,"确认"才把草稿落成生效条件。
 * 绑定同样由调用页传入(不同入口 actionId 不同),保证绑定处 id 是字符串字面量。
 */
import React from 'react';
import { BottomSheet, VIP } from './ui';
import { buildFilterGroups, filterToken } from '../utils/search';
import type { VipItem } from '../types';

export function FilterSheet({
  candidates, draft, onToggle, onClose, optionBindingOf, resetBinding, confirmBinding,
}: {
  /** 当前列表的候选集:筛选项从它派生,保证每个选项都筛得出东西 */
  candidates: VipItem[];
  draft: string[];
  onToggle: (token: string) => void;
  onClose: () => void;
  optionBindingOf: (token: string, onTrigger: () => void) => object;
  resetBinding: object;
  confirmBinding: object;
}) {
  const groups = buildFilterGroups(candidates);

  return (
    <BottomSheet onClose={onClose} title="筛选" heightClass="max-h-[78%]">
      {groups.length === 0 ? (
        <div className="text-center text-[13px] text-[#888888] py-10">当前结果太少,没有可筛的条件</div>
      ) : (
        groups.map((group) => (
          <div key={group.id} className="px-3 pt-3 pb-1">
            <div className="text-[14px] font-semibold text-[#222222] mb-2">{group.label}</div>
            <div className="flex flex-wrap gap-2">
              {group.options.map((opt) => {
                const token = filterToken(group.id, opt);
                const on = draft.includes(token);
                return (
                  <button
                    key={token}
                    {...optionBindingOf(token, () => onToggle(token))}
                    className="text-[12px] rounded-full px-3 py-1.5 border cursor-pointer"
                    style={on
                      ? { color: VIP.primary, borderColor: VIP.primary, background: '#FDECF5' }
                      : { color: '#333', borderColor: '#EEE', background: '#F8F8F8' }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))
      )}

      <div className="flex items-center gap-3 px-3 py-4 mt-1">
        <button
          {...resetBinding}
          className="text-[14px] rounded-full px-6 py-2 border cursor-pointer bg-white"
          style={{ color: '#666', borderColor: '#DDD' }}
        >
          重置
        </button>
        <button
          {...confirmBinding}
          className="flex-1 text-[15px] rounded-full py-2 border-none cursor-pointer text-white font-semibold"
          style={{ background: VIP.primary }}
        >
          确认{draft.length > 0 ? `(${draft.length})` : ''}
        </button>
      </div>
    </BottomSheet>
  );
}
