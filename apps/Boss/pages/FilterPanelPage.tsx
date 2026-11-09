import React, { useRef, useState } from 'react';
import { useBossGestures } from '../hooks/useBossGestures';
import { useStrings } from '../hooks/useStrings';
import { useBossStore } from '../state';
import { FILTER_GROUPS } from '../constants';
import { COLORS } from '../res/colors';
import { IcClose } from '../res/icons';

/** 筛选面板(IMG_8497~8499):全屏页,左分组锚点 + 右 chips,底部清除/确定 */
const FilterPanelPage: React.FC = () => {
  const { bindTap, action, bindBack, back } = useBossGestures();
  const t = useStrings();
  const store = useBossStore();
  const [draft, setDraft] = useState<Record<string, string[]>>(() => ({ ...store.filter }));
  const [activeGroup, setActiveGroup] = useState(FILTER_GROUPS[0].key);
  const [expanded, setExpanded] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const groupRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const scrollToGroup = (key: string) => {
    setActiveGroup(key);
    const el = groupRefs.current[key];
    const container = scrollRef.current;
    if (el && container) container.scrollTo({ top: el.offsetTop - container.offsetTop, behavior: 'smooth' });
  };

  const isOn = (g: string, v: string) => {
    const cur = draft[g] ?? [];
    if (v === '全部' || v === '不限') return cur.length === 0;
    return cur.includes(v);
  };

  const toggleDraft = (group: string, value: string, single: boolean) => {
    setDraft((current) => {
      const cur = current[group] ?? [];
      let next: string[];
      if (value === '全部' || value === '不限') next = [];
      else if (single) next = cur.includes(value) ? [] : [value];
      else next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
      return { ...current, [group]: next };
    });
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="grid grid-cols-[48px_1fr_48px] items-center px-1 pb-2 pt-12">
        <button {...bindBack()} className="flex h-10 w-10 items-center justify-center text-gray-800" aria-label="关闭">
          <IcClose size={22} />
        </button>
        <div className="text-center text-[16px] font-semibold text-gray-900">{t.filter}</div>
        <span />
      </div>

      <div className="flex min-h-0 flex-1">
        {/* 左侧分组导航 */}
        <div className="w-24 shrink-0 overflow-y-auto bg-[#F5F6F7]" data-scroll-container="filter-groups" data-scroll-direction="vertical">
          {FILTER_GROUPS.map((g) => (
            <button
              key={g.key}
              {...action('filter.group.scroll', () => scrollToGroup(g.key), { params: { group: g.key } })}
              className={`relative block w-full px-3 py-4 text-left text-[14px] ${activeGroup === g.key ? 'bg-white font-semibold' : 'text-gray-600'}`}
              style={activeGroup === g.key ? { color: COLORS.primary } : undefined}
            >
              {activeGroup === g.key && <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r" style={{ backgroundColor: COLORS.primary }} />}
              {g.title.replace('要求', '').replace('待遇', '').replace('状态', '').replace('分类', '').replace('阶段', '')}
            </button>
          ))}
        </div>

        {/* 右侧 chips 分组 */}
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 pb-6" data-scroll-container="main" data-scroll-direction="vertical">
          {FILTER_GROUPS.map((g) => {
            const showAll = expanded.includes(g.key);
            const options = g.expandable && !showAll ? g.options.slice(0, 8) : g.options;
            return (
              <div key={g.key} ref={(el) => { groupRefs.current[g.key] = el; }} className="pt-4">
                <div className="text-[15px] font-semibold text-gray-900">
                  {g.title}
                  {g.single && <span className="ml-1 text-[12px] font-normal text-gray-400">(单选)</span>}
                  {g.hint && <span className="ml-1 text-[12px] font-normal text-gray-400">{g.hint}</span>}
                </div>
                <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                  {options.map((opt) => {
                    const on = isOn(g.key, opt);
                    const bind = g.key === 'salary'
                      ? action('filter.select.salary', () => toggleDraft(g.key, opt, true), { params: { value: opt } })
                      : g.key === 'active'
                        ? action('filter.select.active', () => toggleDraft(g.key, opt, true), { params: { value: opt } })
                        : action('filter.option.toggle', () => toggleDraft(g.key, opt, false), { params: { group: g.key, value: opt } });
                    return (
                      <button
                        key={opt}
                        {...bind}
                        className="rounded-lg border px-3 py-3 text-[14px]"
                        style={on
                          ? { borderColor: COLORS.primary, color: COLORS.primary, fontWeight: 600, backgroundColor: '#FFFFFF' }
                          : { borderColor: 'transparent', backgroundColor: '#F5F5F5', color: '#374151' }}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {g.expandable && !showAll && (
                  <button
                    {...action('filter.industry.expand', () => setExpanded((e) => [...e, g.key]), { params: {} })}
                    className="mt-2 w-full text-right text-[13px] text-gray-400"
                  >
                    展开 ⌄
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex shrink-0 gap-3 border-t border-gray-100 bg-white px-4 py-3">
        <button
          {...action('filter.reset.clear', () => setDraft({}))}
          className="w-28 rounded-full bg-[#F0F1F3] py-3 text-center text-[15px] text-gray-700"
        >
          {t.clear}
        </button>
        <button
          {...bindTap('filter.confirm', { beforeTrigger: () => store.setFilter(draft), onTrigger: () => back() })}
          className="flex-1 rounded-full py-3 text-center text-[15px] font-medium text-white"
          style={{ backgroundColor: COLORS.primaryBtn }}
        >
          {t.confirm}
        </button>
      </div>
    </div>
  );
};

export default FilterPanelPage;
