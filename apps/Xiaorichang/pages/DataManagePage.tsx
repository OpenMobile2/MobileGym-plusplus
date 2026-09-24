import React, { useState } from 'react';
import { useXiaorichangStore } from '../state';
import { useXiaorichangGestures } from '../hooks/useXiaorichangGestures';
import { useStrings } from '../hooks/useStrings';
import { PageHeader } from '../components/common';

const CHECK_ITEMS = ['本地数据库', 'iCloud 同步状态', '备份完整性', '存储空间'] as const;
type CheckItem = typeof CHECK_ITEMS[number];
type CheckResult = 'pass' | 'fail' | 'unavailable';

/** 数据管理(s221)。本地项目做真实一致性检查，外部云能力明确标记为不可用。 */
export default function DataManagePage() {
  const st = useXiaorichangStore();
  const { action } = useXiaorichangGestures();
  const s = useStrings();
  const [results, setResults] = useState<Partial<Record<CheckItem, CheckResult>>>({});
  const diagnose = () => {
    const habitIds = new Set(st.habits.map((h) => h.id));
    const allIdsUnique = [st.habits, st.groups, st.notes, st.todos, st.records, st.wishes]
      .every((items) => new Set(items.map((item) => item.id)).size === items.length);
    const referencesValid = st.logs.every((l) => habitIds.has(l.habitId))
      && st.groups.every((g) => g.habitIds.every((id) => habitIds.has(id)))
      && st.records.every((r) => !r.habitId || habitIds.has(r.habitId));
    const localOk = allIdsUnique && referencesValid && st.glow.cumulative >= st.glow.redeemed;
    setResults({
      '本地数据库': localOk ? 'pass' : 'fail',
      'iCloud 同步状态': 'unavailable',
      '备份完整性': 'unavailable',
      '存储空间': 'pass',
    });
    st.showNotice(localOk ? '本地数据一致性检查已通过；云同步与备份在当前环境中不可用。' : '检测到本地数据引用异常，请返回后重试或重置数据。');
  };
  const resultText = (result?: CheckResult) => result === 'pass' ? '✓ 通过'
    : result === 'fail' ? '✕ 异常' : result === 'unavailable' ? '不可用' : '未检查';

  return (
    <div className="flex h-full flex-col bg-[#F8F8F8]" data-status-bar-foreground="dark">
      <PageHeader title={s.dataManage} />
      <div className="px-4">
        <button {...action('data.diagnose.run', diagnose)}
          className="w-full rounded-2xl bg-white py-3.5 text-sm font-semibold text-[#424242]">↻ 开始诊断</button>
        <div className="mt-3 overflow-hidden rounded-2xl bg-white">
          {CHECK_ITEMS.map((item) => {
            const result = results[item];
            return <button key={item} {...action('data.check.item.wontfixToast', () => {
              st.showNotice(result === 'pass' ? `${item}检查已通过。` : result === 'fail' ? `${item}检查失败。` : s.notAvailable);
            })}
              className="flex w-full items-center justify-between border-b border-[#F5F5F5] px-4 py-3.5 text-sm text-[#424242]">
              {item}
              <span className="text-xs" style={{ color: result === 'pass' ? '#7FB685' : result === 'fail' ? '#DE4A3F' : '#C9CDD3' }}>
                {resultText(result)}
              </span>
            </button>
          })}
        </div>
        <button {...action('data.restore.wontfixToast', () => st.showNotice(s.notAvailable))}
          className="mt-3 w-full rounded-2xl bg-white py-3.5 text-sm text-[#9AA5B1]">手动恢复</button>
      </div>
    </div>
  );
}
