import React, { useState } from 'react';
import { useKapiStore } from '../state';
import { useKapiGestures } from '../hooks/useKapiGestures';
import { CategoryIcon } from './ui';
import { RECORD_TYPES } from '../constants';

/**
 * 分类选择网格(record.category 弹层)。支出/收入分段 + 网格 + 分类编辑入口。
 * onPicked:选中后回调(通常关闭弹层)。
 */
export function CategoryGrid({ onPicked }: { onPicked: () => void }) {
  const expense = useKapiStore((s) => s.categories.expense);
  const income = useKapiStore((s) => s.categories.income);
  const selectedId = useKapiStore((s) => s._draft.categoryId);
  const pickCategory = useKapiStore((s) => s.pickCategory);
  const { bindAction, bindTap } = useKapiGestures();
  const [tab, setTab] = useState<'expense' | 'income'>('expense');
  const list = tab === 'income' ? income : expense;

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-4 pb-3">
        <div className="flex bg-[#F0F2F8] rounded-full p-1">
          {(['expense', 'income'] as const).map((t) => (
            <button
              key={t}
              {...bindAction('category.type.select.tab', () => setTab(t), { value: t })}
              className={`px-5 py-1.5 rounded-full text-[14px] border-none cursor-pointer ${
                tab === t ? 'bg-white text-[#4B6EF5] font-semibold' : 'bg-transparent text-[#8A92A6]'
              }`}
            >
              {RECORD_TYPES.find((r) => r.id === t)?.label}
            </button>
          ))}
        </div>
        <button
          {...bindTap('category.edit.open')}
          className="text-[14px] text-[#4B6EF5] bg-transparent border-none cursor-pointer"
        >
          分类编辑
        </button>
      </div>

      <div className="grid grid-cols-4 gap-y-4 px-3 pb-6">
        {list.map((c) => {
          const selected = c.id === selectedId;
          return (
            <button
              key={c.id}
              {...bindAction(
                'category.pick.select.item',
                () => {
                  pickCategory(c.id);
                  onPicked();
                },
                { categoryId: c.id },
              )}
              className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer"
            >
              <CategoryIcon icon={c.icon} color={c.color} selected={selected} />
              <span className={`text-[12px] ${selected ? 'text-[#4B6EF5] font-medium' : 'text-[#5A6172]'}`}>
                {c.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
