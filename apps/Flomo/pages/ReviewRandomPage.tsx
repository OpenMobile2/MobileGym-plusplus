import React, { useMemo, useState } from 'react';
import * as TimeService from '@/os/TimeService';
import { useFlomoStore } from '../state';
import { useFlomoGestures } from '../hooks/useFlomoGestures';
import { C, MemoImages, renderContent } from '../components/ui';
import { fullTime } from '../utils/format';
import { IcClose, IcDice, IcUndo } from '../res/icons';
import type { FlomoMemo } from '../types';

type Props = Record<string, unknown>;

/** 合并两套手势绑定到同一元素:保留 primary 的 data-trigger,叠加二者的 pointer 处理。 */
function mergePointer(primary: Props, secondary: Props): Props {
  const out: Props = { ...secondary, ...primary };
  const keys = ['onPointerDown', 'onPointerMove', 'onPointerUp', 'onPointerCancel', 'onPointerLeave'] as const;
  for (const k of keys) {
    const a = primary[k] as ((e: unknown) => void) | undefined;
    const b = secondary[k] as ((e: unknown) => void) | undefined;
    if (a && b) out[k] = (e: unknown) => { a(e); b(e); };
    else out[k] = a || b;
  }
  return out;
}

/** N 天前(相对当前模拟时间)。 */
function daysAgo(ts: number): number {
  const diff = TimeService.now() - ts;
  return Math.max(0, Math.floor(diff / 86400000));
}

/** 为一条分支笔记推导一个确定性(非随机)相似度 80~95%,越靠前越高。 */
function similarity(branch: FlomoMemo, index: number): number {
  const wobble = branch.id.length % 4; // 0~3,基于 id 的稳定扰动
  const sim = 95 - index * 3 - wobble;
  return Math.max(80, Math.min(95, sim));
}

/**
 * 随机漫步:整页 overlay。中心「当前」笔记(绿框)在左,连线向右分叉到若干相关笔记卡片,
 * 每张显示日期 + 内容 + 绿色相似度%。点分支卡=漫步到它(设为新中心)。整体横向可滚动的点阵画布。
 */
export default function ReviewRandomPage() {
  const { bindTap, bindDoubleTap, bindBack } = useFlomoGestures();
  const memos = useFlomoStore((s) => s.memos);
  const tags = useFlomoStore((s) => s.tags);
  const currentMemoId = useFlomoStore((s) => s.currentMemoId);
  const setCurrentMemo = useFlomoStore((s) => s.setCurrentMemo);
  const setCurrentTag = useFlomoStore((s) => s.setCurrentTag);
  const toast = useFlomoStore((s) => s.toast);

  // nonce 驱动「换一批」:对候选做按 nonce 旋转切片,避免 Math.random。
  const [nonce, setNonce] = useState(0);
  // 已漫步步数:每次单击分支「继续漫步」时 +1。
  const [steps, setSteps] = useState(0);

  const live = useMemo(() => memos.filter((m) => !m.deleted), [memos]);

  // 中心节点:currentMemoId 命中的存活笔记,否则第一条。
  const center = useMemo<FlomoMemo | null>(() => {
    if (!live.length) return null;
    return live.find((m) => m.id === currentMemoId) ?? live[0];
  }, [live, currentMemoId]);

  // 分支节点:最多 4 条其它存活笔记,按 nonce 旋转起点。
  const branches = useMemo<FlomoMemo[]>(() => {
    if (!center) return [];
    const others = live.filter((m) => m.id !== center.id);
    if (!others.length) return [];
    const offset = (nonce * 2 + 1) % others.length;
    const rotated = [...others.slice(offset), ...others.slice(0, offset)];
    return rotated.slice(0, Math.min(4, others.length));
  }, [live, center, nonce]);

  const tagProps = (name: string) =>
    bindTap('tag.filter.open', {
      stopPropagation: true,
      beforeTrigger: () => {
        const t = tags.find((x) => x.name === name);
        setCurrentTag(t ? t.id : null);
      },
    }) as React.HTMLAttributes<HTMLSpanElement>;

  const dotBg =
    'radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)';

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      {/* 顶栏:关闭 / 随机漫步 / 撤销 + 骰子 */}
      <div className="flex items-center h-12 px-3 shrink-0">
        <button
          {...bindBack()}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-black/5 border-none cursor-pointer"
          style={{ color: C.text }}
          aria-label="关闭"
        >
          <IcClose size={18} />
        </button>
        <div className="flex-1 text-center font-semibold text-base" style={{ color: C.text }}>
          随机漫步
          {steps > 0 && (
            <span className="ml-1.5 font-normal" style={{ color: C.sub, fontSize: 12 }}>已漫步 {steps} 步</span>
          )}
        </div>
        <button
          {...bindTap(
            { kind: 'action', id: 'review.random.reroll.do' },
            { onTrigger: () => { setNonce((n) => Math.max(0, n - 1)); toast('已回退'); } },
          )}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-black/5 border-none cursor-pointer mr-2"
          style={{ color: C.text }}
          aria-label="上一步"
        >
          <IcUndo size={18} />
        </button>
        <button
          {...bindTap(
            { kind: 'action', id: 'review.random.reroll.do' },
            { onTrigger: () => { setNonce((n) => n + 1); toast('已换一批'); } },
          )}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-black/5 border-none cursor-pointer"
          style={{ color: C.text }}
          aria-label="再来一组"
        >
          <IcDice size={18} />
        </button>
      </div>

      {/* 点阵画布:横向可滚动的连线树 */}
      <div
        className="flex-1 overflow-x-auto overflow-y-auto"
        style={{ backgroundImage: dotBg, backgroundSize: '22px 22px' }}
        data-scroll-container="main"
        data-scroll-direction="horizontal"
      >
        {!center ? (
          <div className="text-center mt-24" style={{ color: C.sub, fontSize: 14 }}>暂无笔记</div>
        ) : (
          <div className="flex items-start gap-0 min-w-max px-6 py-16">
            {/* 中心「当前」笔记:绿框卡片 */}
            <div
              className="shrink-0 rounded-2xl px-4 py-3 border-2 self-center"
              style={{ width: 240, background: C.surface, borderColor: C.green }}
            >
              <div className="mb-1.5" style={{ color: C.sub, fontSize: 12 }}>{daysAgo(center.createdAt)} 天前</div>
              {renderContent(center.content, tagProps)}
              <MemoImages images={center.images} />
              {branches.length === 0 && (
                <div className="mt-2" style={{ color: C.sub, fontSize: 12 }}>暂无更多相关</div>
              )}
            </div>

            {/* 连线 + 分支笔记列 */}
            {branches.length > 0 && (
              <>
                {/* 主干横线 */}
                <div className="shrink-0 self-center" style={{ width: 40, height: 2, background: C.border }} />

                {/* 分支卡片纵列,每条左侧带连接线 */}
                <div className="shrink-0 flex flex-col gap-5">
                  {branches.map((b, i) => {
                    const sim = similarity(b, i);
                    // 双击 = 打开详情(导航,primary,保留 data-trigger);单击 = 漫步到该分支(action)。
                    // bindTap 走 onClick,会被 doubleTap 的 onClick 覆盖,故单击行为经 doubleTap
                    // 的 onSingleTap 分发(仅在确认非双击后触发),action 绑定保留 data-action 标注。
                    const doWalk = () => { setCurrentMemo(b.id); setSteps((n) => n + 1); };
                    const openBind = bindDoubleTap('review.random.openMemo', {
                      beforeTrigger: () => setCurrentMemo(b.id),
                      onSingleTap: doWalk,
                    }) as unknown as Props;
                    const walkBind = bindTap(
                      { kind: 'action', id: 'review.random.walk.step' },
                      { onTrigger: doWalk },
                    ) as unknown as Props;
                    const cardGestures = mergePointer(openBind, walkBind);
                    return (
                      <div key={b.id} className="flex items-center">
                        {/* 分支短连线 */}
                        <div className="shrink-0" style={{ width: 24, height: 2, background: C.border }} />
                        <button
                          {...cardGestures}
                          className="text-left rounded-2xl px-4 py-3 border cursor-pointer shrink-0"
                          style={{ width: 240, background: C.surface, borderColor: C.border }}
                        >
                          <div className="mb-1.5" style={{ color: C.sub, fontSize: 12 }}>{fullTime(b.createdAt)}</div>
                          {renderContent(b.content, tagProps)}
                          <MemoImages images={b.images} />
                          <div className="mt-2 font-medium" style={{ color: C.green, fontSize: 12 }}>{sim}%</div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
