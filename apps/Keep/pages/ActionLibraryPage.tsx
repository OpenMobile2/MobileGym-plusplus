import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { TopBar, C } from '../components/ui';
import { useKeepGestures } from '../hooks/useKeepGestures';
import { useKeepStrings } from '../hooks/useKeepStrings';
import { Img } from '../res/images';
import { useKeepStore } from '../state';
import type { KeepActionItem } from '../types';

const action = (id: string) => ({ kind: 'action' as const, id });

const PARTS = ['全部', '胸部', '腹部', '背部', '腿部', '臀部', '肩部', '手臂', '核心', '全身'];
const AB_SUBS = ['全部', '上腹部', '下腹部', '侧腹'];
const GEAR_OPTS = ['全部', '自重', '哑铃', '器械'];
const POSE_OPTS = ['全部', '站立', '仰卧', '俯卧'];

function matchPart(a: KeepActionItem, part: string): boolean {
  if (part === '全部') return true;
  if (part === '腹部') {
    return a.bodyPart.includes('腹') || a.muscle.some((m) => m.includes('腹'));
  }
  return a.bodyPart.includes(part) || a.muscle.some((m) => m.includes(part));
}

function matchSub(a: KeepActionItem, sub: string): boolean {
  if (!sub || sub === '全部') return true;
  return a.bodyPart.includes(sub) || a.muscle.some((m) => m.includes(sub.replace('部', '')));
}

function gearOf(a: KeepActionItem): string {
  return a.equipment ?? '自重';
}

function poseOf(a: KeepActionItem): string {
  return a.posture ?? '站立';
}

/** 动作库列表 —— 证据 n11/n12；筛选与子类必须刷新列表 */
export default function ActionLibraryPage() {
  const { bindTap } = useKeepGestures();
  const s = useKeepStrings();
  const [params, setParams] = useSearchParams();
  const actions = useKeepStore((s) => s.actionsLib);
  const setCurrent = useKeepStore((s) => s.setCurrent);

  const part = params.get('part') ?? '全部';
  const sub = params.get('sub') ?? '全部';
  const gear = params.get('gear') ?? '全部';
  const pose = params.get('pose') ?? '全部';
  const flt = params.get('flt'); // gear | pose | null
  const partLabels: Record<string, string> = {
    全部: s.filterAll, 胸部: s.bodyChest, 腹部: s.bodyAbs, 背部: s.bodyBack, 腿部: s.bodyLegs,
    臀部: s.bodyGlutes, 肩部: s.bodyShoulders, 手臂: s.bodyArms, 核心: s.bodyCore, 全身: s.bodyFull,
  };
  const subLabels: Record<string, string> = {
    全部: s.allAbs, 上腹部: s.bodyUpperAbs, 下腹部: s.bodyLowerAbs, 侧腹: s.bodySideAbs,
  };
  const gearLabels: Record<string, string> = {
    全部: s.filterAll, 自重: s.gearBodyweight, 哑铃: s.gearDumbbell, 器械: s.gearMachine,
  };
  const poseLabels: Record<string, string> = {
    全部: s.filterAll, 站立: s.poseStanding, 仰卧: s.poseSupine, 俯卧: s.poseProne,
  };

  const setMany = (patch: Record<string, string | null>) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [k, v] of Object.entries(patch)) {
        if (v == null || v === '' || (k !== 'part' && v === '全部')) next.delete(k);
        else next.set(k, v);
      }
      return next;
    }, { replace: true });
  };

  const visible = actions.filter((a) => {
    if (!matchPart(a, part)) return false;
    if (part === '腹部' && !matchSub(a, sub)) return false;
    if (gear !== '全部' && gearOf(a) !== gear) return false;
    if (pose !== '全部' && poseOf(a) !== pose) return false;
    return true;
  });

  const gearLabel = gear === '全部' ? s.equipment : gearLabels[gear];
  const poseLabel = pose === '全部' ? s.posture : poseLabels[pose];

  return (
    <div className="h-full bg-app-surface flex flex-col" data-status-bar-foreground="dark">
      <TopBar title={s.allActions} />
      <div className="flex-1 flex min-h-0">
        <aside className="w-20 bg-app-bg overflow-y-auto shrink-0" data-scroll-container="parts" data-scroll-direction="vertical">
          {PARTS.map((p) => (
            <button
              key={p}
              type="button"
              {...bindTap(action('action.library.part.switch'), {
                params: { part: p },
                onTrigger: () => setMany({ part: p, sub: null, flt: null }),
              })}
              className={`w-full py-4 border-none text-sm ${
                part === p ? 'bg-white font-bold text-emerald-600' : 'bg-transparent text-app-text-muted'
              }`}
            >
              {partLabels[p]}
            </button>
          ))}
        </aside>

        <main className="flex-1 overflow-y-auto p-3 min-w-0" data-scroll-container="main" data-scroll-direction="vertical">
          <div className="flex gap-2 mb-2 flex-wrap">
            <button
              type="button"
              {...bindTap(action('action.library.filter.open'), {
                params: { which: '器械' },
                onTrigger: () => setMany({ flt: flt === 'gear' ? null : 'gear' }),
              })}
              className="px-3 py-1.5 rounded-full border-none text-xs"
              style={{
                background: gear !== '全部' || flt === 'gear' ? '#E9FAF2' : '#F2F3F6',
                color: gear !== '全部' || flt === 'gear' ? C.greenDeep : '#666',
                fontWeight: gear !== '全部' ? 600 : 400,
              }}
            >
              {gearLabel}⌄
            </button>
            <button
              type="button"
              {...bindTap(action('action.library.filter.open'), {
                params: { which: '姿势' },
                onTrigger: () => setMany({ flt: flt === 'pose' ? null : 'pose' }),
              })}
              className="px-3 py-1.5 rounded-full border-none text-xs"
              style={{
                background: pose !== '全部' || flt === 'pose' ? '#E9FAF2' : '#F2F3F6',
                color: pose !== '全部' || flt === 'pose' ? C.greenDeep : '#666',
                fontWeight: pose !== '全部' ? 600 : 400,
              }}
            >
              {poseLabel}⌄
            </button>
          </div>

          {flt === 'gear' && (
            <div className="mb-3 rounded-xl border border-app-border bg-app-surface flex flex-wrap gap-2 p-3">
              {GEAR_OPTS.map((op) => (
                <button
                  key={op}
                  type="button"
                  {...bindTap(action('action.library.filter.open'), {
                    params: { which: '器械', value: op },
                    onTrigger: () => setMany({ gear: op, flt: null }),
                  })}
                  className="px-3 py-1.5 rounded-full text-[12px] border-none"
                  style={
                    gear === op
                      ? { background: '#E9FAF2', color: C.greenDeep, fontWeight: 600 }
                      : { background: '#F2F3F6', color: '#666' }
                  }
                >
                  {gearLabels[op]}
                </button>
              ))}
            </div>
          )}

          {flt === 'pose' && (
            <div className="mb-3 rounded-xl border border-app-border bg-app-surface flex flex-wrap gap-2 p-3">
              {POSE_OPTS.map((op) => (
                <button
                  key={op}
                  type="button"
                  {...bindTap(action('action.library.filter.open'), {
                    params: { which: '姿势', value: op },
                    onTrigger: () => setMany({ pose: op, flt: null }),
                  })}
                  className="px-3 py-1.5 rounded-full text-[12px] border-none"
                  style={
                    pose === op
                      ? { background: '#E9FAF2', color: C.greenDeep, fontWeight: 600 }
                      : { background: '#F2F3F6', color: '#666' }
                  }
                >
                  {poseLabels[op]}
                </button>
              ))}
            </div>
          )}

          {part === '腹部' && (
            <div className="flex gap-2 mb-3 overflow-x-auto" data-scroll-container="subs" data-scroll-direction="horizontal">
              {AB_SUBS.map((s) => (
                <button
                  key={s}
                  type="button"
                  {...bindTap(action('action.library.subpart.switch'), {
                    params: { sub: s },
                    onTrigger: () => setMany({ part: '腹部', sub: s === '全部' ? null : s }),
                  })}
                  className="shrink-0 px-3 py-1.5 rounded-full border-none text-xs"
                  style={
                    (s === '全部' ? sub === '全部' || !params.get('sub') : sub === s)
                      ? { background: '#E9FAF2', color: C.greenDeep, fontWeight: 600 }
                      : { background: '#F2F3F6', color: '#666' }
                  }
                >
                  {subLabels[s]}
                </button>
              ))}
            </div>
          )}

          {visible.map((a) => (
            <button
              key={a.id}
              type="button"
              {...bindTap('action.detail.open', {
                params: { actionId: a.id },
                beforeTrigger: () => setCurrent('actionId', a.id),
              })}
              className="w-full flex items-center gap-3 py-3 border-x-0 border-t-0 border-b border-app-border bg-white text-left"
            >
              <Img id={a.id} className="w-16 h-14 rounded-lg object-cover shrink-0" alt={a.name} />
              <div className="min-w-0 flex-1">
                <b className="text-sm text-app-text">{a.name}</b>
                <small className="block text-app-text-muted">{a.muscle.join(' · ')}</small>
              </div>
              <span className="text-app-text-muted">›</span>
            </button>
          ))}

          {visible.length === 0 && (
            <div className="py-16 text-center text-[13px] text-app-text-muted">{s.noFilteredActions}</div>
          )}
        </main>
      </div>
    </div>
  );
}
