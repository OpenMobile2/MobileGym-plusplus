// apps/Douban/components/CollectSheet.tsx —— 收藏到豆列 sheet(FOUNDATION,IMG_0279 / R4/R8)。
// 结构:标题「收藏到豆列」+「+ 创建」行 + 豆列列表(封面/名称/N个内容/勾选态)+ 底部「完成」。
// 勾选 → 页面侧 onTrigger 调 collectTarget/uncollectTarget + toast「收藏成功|添加收藏语」。
// 所有绑定页面侧字面量生成后传入。
import React from 'react';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import type { DoubanDoulist } from '../types';
import { C, Img } from './ui';

export interface CollectSheetProps {
  /** 当前用户的豆列(页面侧过滤 ownerId===me) */
  doulists: DoubanDoulist[];
  /** 已收藏本内容的豆列 id 集合(页面侧从 collects 派生) */
  checkedIds: string[];
  /** 「+ 创建」→ doulist.create */
  bindCreate: object;
  /** 勾选/取消勾选某豆列 */
  bindToggle: (doulistId: string) => object;
  /** 底部「完成」(通常 = 关闭 sheet,页面可传 bindBack() 或带 onTrigger 的动作) */
  doneProps: object;
}

export function CollectSheet({ doulists, checkedIds, bindCreate, bindToggle, doneProps }: CollectSheetProps) {
  const { bindBack } = useDoubanGestures();
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <div {...bindBack()} className="flex-1" style={{ background: 'rgba(0,0,0,0.4)' }} />
      <div className="rounded-t-2xl shrink-0 flex flex-col" style={{ background: C.surface, maxHeight: '65%' }}>
        <div className="flex items-center justify-between px-5 py-3.5 shrink-0">
          <div className="text-base font-bold" style={{ color: C.text }}>收藏到豆列</div>
          <button
            {...bindCreate}
            className="text-sm bg-transparent border-none cursor-pointer flex items-center gap-0.5"
            style={{ color: C.green }}
          >
            <span className="text-lg leading-none">+</span> 创建
          </button>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0" data-scroll-container="collect-sheet" data-scroll-direction="vertical">
          {doulists.length === 0 && (
            <div className="py-10 text-center text-sm" style={{ color: C.sub }}>还没有豆列,点右上角创建一个</div>
          )}
          {doulists.map((d) => {
            const checked = checkedIds.includes(d.id);
            return (
              <button
                key={d.id}
                {...bindToggle(d.id)}
                className="w-full flex items-center gap-3 px-5 py-2.5 bg-transparent border-none cursor-pointer text-left"
              >
                <Img src={d.cover} className="w-11 h-11 rounded object-cover shrink-0" style={{ background: '#F2F3F5' }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate" style={{ color: C.text }}>
                    {d.title}
                    {d.isPrivate && <span className="ml-1 text-[10px]" style={{ color: C.sub }}>🔒</span>}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: C.sub }}>{d.items.length}个内容</div>
                </div>
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    border: checked ? 'none' : `1.5px solid ${C.border}`,
                    background: checked ? C.green : 'transparent',
                  }}
                >
                  {checked && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </span>
              </button>
            );
          })}
        </div>
        <div className="px-4 py-3 shrink-0 border-t" style={{ borderColor: C.border }}>
          <button
            {...doneProps}
            className="w-full h-10 rounded-full text-[15px] text-white border-none cursor-pointer"
            style={{ background: C.green }}
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
}
