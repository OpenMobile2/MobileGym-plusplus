import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBossGestures } from '../hooks/useBossGestures';
import { useBossStore } from '../state';
import { INDUSTRY_OPTIONS, POSITION_OPTIONS, CITY_GROUPS } from '../constants';
import { MissingContent, PageHeader, PrimaryButton } from '../components/common';
import { IcChevronRight } from '../res/icons';
import { COLORS } from '../res/colors';

type PickerKey = 'position' | 'city' | 'salary' | 'industry' | null;

const SALARY_K_STEPS = [3, 4, 5, 6, 8, 10, 12, 15, 16, 18, 20, 25, 30, 35, 40, 50, 60, 80, 100];

/** 新增/编辑求职期望(IMG_8501)。四个字段全部弹层选择(Q3:薪资弹选择器,非输入框)。 */
const ExpectEditPage: React.FC = () => {
  const { action, back } = useBossGestures();
  const [searchParams] = useSearchParams();
  const store = useBossStore();
  const expectId = searchParams.get('expectId') ?? undefined;
  const editing = store.expects.find((e) => e.id === expectId);

  const [position, setPosition] = useState(editing?.position ?? '');
  const [city, setCity] = useState(editing?.city ?? store.city);
  const [salary, setSalary] = useState(editing?.salary ?? '');
  const [industry, setIndustry] = useState(editing?.industry ?? '不限');
  const [picker, setPicker] = useState<PickerKey>(null);
  const salaryK = editing?.salary.match(/(\d+)-(\d+)K/);
  const [salMin, setSalMin] = useState<number>(salaryK ? Number(salaryK[1]) : 15);
  const [salMax, setSalMax] = useState<number>(salaryK ? Number(salaryK[2]) : 20);

  if (expectId && !editing) return <MissingContent text="求职期望不存在或已被移除" />;

  const rows: { key: PickerKey; label: string; value: string; placeholder: string; actionId: string }[] = [
    { key: 'position', label: '期望职位', value: position, placeholder: '请选择期望职位', actionId: 'expectadd.select.position' },
    { key: 'city', label: '工作城市', value: city, placeholder: '请选择城市', actionId: 'expectadd.select.city' },
    { key: 'salary', label: '薪资要求', value: salary, placeholder: '请选择薪资要求', actionId: 'expectadd.select.salary' },
    { key: 'industry', label: '期望行业', value: industry === '行业不限' ? '不限' : industry, placeholder: '不限', actionId: 'expectadd.select.industry' },
  ];

  const optionsOf = (k: PickerKey): string[] => {
    if (k === 'position') return POSITION_OPTIONS;
    if (k === 'city') return CITY_GROUPS.flatMap((g) => g.cities);
    return INDUSTRY_OPTIONS;
  };
  const setterOf = (k: PickerKey) => (v: string) => {
    if (k === 'position') setPosition(v);
    else if (k === 'city') setCity(v);
    else if (k === 'salary') setSalary(v);
    else setIndustry(v);
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader />
      <div className="min-h-0 flex-1 overflow-y-auto px-5" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="text-[24px] font-bold text-gray-900">{editing ? '编辑求职期望' : '新增求职期望'}</div>
        <div className="mt-1 text-[13px] text-gray-500">我们会据此展示职位,并将你推荐给BOSS</div>
        {rows.map((row) => (
          <button
            key={row.key}
            {...action(row.actionId, () => setPicker(row.key), { params: { value: row.value || '' } })}
            className="flex w-full items-center justify-between border-b border-gray-100 py-4"
          >
            <span className="text-left">
              <span className="block text-[13px] text-gray-500">{row.label}</span>
              <span className={`mt-1 block text-[18px] ${row.value ? 'text-gray-900' : 'text-gray-300'}`}>{row.value || row.placeholder}</span>
            </span>
            <IcChevronRight size={18} className="text-gray-300" />
          </button>
        ))}
        {editing && (
          <button
            {...action('expectadd.save.commit', () => { store.deleteExpect(editing.id); store.showToast('已删除该期望'); back(); }, { params: {} })}
            className="mt-6 w-full text-center text-[14px] text-gray-400"
          >
            删除该求职期望
          </button>
        )}
      </div>
      <div className="shrink-0 px-4 pb-6" data-keep-keyboard="true">
        <PrimaryButton
          {...action('expectadd.save.commit', () => {
            if (!position || !salary) { store.showToast('请完善期望职位和薪资'); return; }
            store.saveExpect({ position, city, salary, industry }, editing?.id);
            store.showToast('已保存');
            back();
          })}
        >
          保存
        </PrimaryButton>
      </div>

      {/* 薪资:双列 K 范围选择(下限≤上限,避免区间重叠可选) */}
      {picker === 'salary' && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end bg-black/40" onClick={() => setPicker(null)}>
          <div className="rounded-t-2xl bg-white pb-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <button className="text-[14px] text-gray-400" onClick={() => setPicker(null)}>取消</button>
              <span className="text-[15px] font-semibold">期望薪资(K/月)</span>
              <button className="text-[14px]" style={{ color: COLORS.accent }} onClick={() => { setSalary(`${salMin}-${salMax}K`); setPicker(null); }}>确定</button>
            </div>
            <div className="flex">
              {(['min', 'max'] as const).map((col) => (
                <div key={col} className="max-h-64 flex-1 overflow-y-auto" data-scroll-container={`sal-${col}`} data-scroll-direction="vertical">
                  <div className="sticky top-0 bg-white py-1 text-center text-[12px] text-gray-400">{col === 'min' ? '下限' : '上限'}</div>
                  {SALARY_K_STEPS.filter((k) => col === 'min' || k >= salMin).map((k) => {
                    const on = col === 'min' ? salMin === k : salMax === k;
                    return (
                      <button
                        key={k}
                        onClick={() => { if (col === 'min') { setSalMin(k); if (salMax < k) setSalMax(k); } else setSalMax(k); }}
                        className={`block w-full py-2.5 text-center text-[17px] ${on ? 'font-bold text-gray-900' : 'text-gray-300'}`}
                      >
                        {k}K
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 其余字段:列表选择弹层 */}
      {picker && picker !== 'salary' && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end bg-black/40" onClick={() => setPicker(null)}>
          <div className="max-h-[60%] rounded-t-2xl bg-white pb-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <button className="text-[14px] text-gray-400" onClick={() => setPicker(null)}>取消</button>
              <span className="text-[15px] font-semibold">请选择{rows.find((r) => r.key === picker)?.label}</span>
              <button className="text-[14px]" style={{ color: COLORS.accent }} onClick={() => setPicker(null)}>确定</button>
            </div>
            <div className="max-h-72 overflow-y-auto px-4" data-scroll-container="picker" data-scroll-direction="vertical">
              {optionsOf(picker).map((opt) => (
                <button
                  key={opt}
                  onClick={() => { setterOf(picker)(opt); setPicker(null); }}
                  className="block w-full py-3 text-center text-[16px] text-gray-800 active:bg-gray-50"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpectEditPage;
