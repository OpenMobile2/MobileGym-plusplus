// 草稿箱(drafts.box,/mine/drafts,IMG_0231,frame:38a79c@t0005):
// 标题「草稿箱 N」+ 草稿行(时间+摘要) + 右上管理/取消 + 本地保存灰字。
// 管理态:行首圆选框 + 底部「全部清除 | 清除N」。resume→compose 续写。
import React, { useMemo, useState } from 'react';
import * as TimeService from '@/os/TimeService';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { TopBar, C, EmptyState } from '../components/ui';

/** 相对时间:「刚刚 / N分钟前 / N小时前 / N天前 / MM-DD」(基于模拟时钟,确定性) */
function fmtRelTime(ts: number): string {
  const diff = TimeService.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return '刚刚';
  if (min < 60) return `${min}分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}小时前`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}天前`;
  const d = TimeService.fromTimestamp(ts);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export default function DraftsBoxPage() {
  const { bindTap } = useDoubanGestures();
  const toast = useDoubanStore((s) => s.toast);
  const drafts = useDoubanStore((s) => s.drafts);
  const deleteDrafts = useDoubanStore((s) => s.deleteDrafts);

  const [manage, setManage] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const sorted = useMemo(() => [...drafts].sort((a, b) => b.savedAt - a.savedAt), [drafts]);

  const toggleSel = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const exitManage = () => {
    setManage(false);
    setSelected([]);
  };

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      <TopBar
        title={`草稿箱 ${drafts.length}`}
        right={
          drafts.length > 0 ? (
            manage ? (
              <button
                {...bindTap({ kind: 'action', id: 'drafts.manage.mode.exit' }, { onTrigger: exitManage })}
                className="text-sm bg-transparent border-none cursor-pointer"
                style={{ color: C.sub }}
              >
                取消
              </button>
            ) : (
              <button
                {...bindTap({ kind: 'action', id: 'drafts.manage.mode.enter' }, { onTrigger: () => setManage(true) })}
                className="text-sm px-3 py-1 rounded-full bg-transparent border-none cursor-pointer"
                style={{ color: C.text, background: '#F2F3F5' }}
              >
                管理
              </button>
            )
          ) : undefined
        }
      />

      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {sorted.length === 0 ? (
          <EmptyState text="草稿箱空空如也" sub="灵感来了就记下来吧" />
        ) : (
          <>
            {sorted.map((d) => {
              const checked = selected.includes(d.id);
              const firstLine = (d.title || d.text).trim() || '(空草稿)';
              const rowContent = (
                <>
                  {manage && (
                    <span
                      className="w-5 h-5 mt-0.5 rounded-full border shrink-0 flex items-center justify-center self-start"
                      style={{
                        borderColor: checked ? C.green : '#CBD2D9',
                        background: checked ? C.green : 'transparent',
                      }}
                    >
                      {checked && <span className="text-white text-[11px]">✓</span>}
                    </span>
                  )}
                  <span className="flex-1 min-w-0">
                    {/* 行首:相对时间灰字左上 + 行尾 ⋯ */}
                    <span className="flex items-center justify-between">
                      <span className="text-[12px]" style={{ color: '#B9BEC6' }}>{fmtRelTime(d.savedAt)}</span>
                      {!manage && (
                        <span
                          onClick={(e) => { e.stopPropagation(); toast('该功能暂未开放'); }}
                          className="text-lg leading-none px-1 -mr-1 cursor-pointer"
                          style={{ color: C.sub }}
                          role="button"
                          aria-label="更多"
                        >
                          ⋯
                        </span>
                      )}
                    </span>
                    <span className="block mt-1.5 text-[15px] leading-snug line-clamp-2" style={{ color: C.text }}>{firstLine}</span>
                  </span>
                </>
              );
              return manage ? (
                <button
                  key={d.id}
                  {...bindTap({ kind: 'action', id: 'drafts.manage.item.toggle' }, {
                    params: { draftId: d.id },
                    onTrigger: () => toggleSel(d.id),
                  })}
                  className="w-full flex items-start gap-3 px-4 py-3.5 bg-white border-b text-left cursor-pointer"
                  style={{ borderColor: '#F2F3F5' }}
                >
                  {rowContent}
                </button>
              ) : (
                <button
                  key={d.id}
                  {...bindTap('drafts.resume-open', { params: { draftId: d.id } })}
                  className="w-full flex items-start gap-3 px-4 py-3.5 bg-white border-b text-left cursor-pointer"
                  style={{ borderColor: '#F2F3F5' }}
                >
                  {rowContent}
                </button>
              );
            })}
            <div className="px-4 py-4 text-[11px] leading-relaxed text-center" style={{ color: '#B9BEC6' }}>
              草稿保存在本地,卸载豆瓣App即清除,请及时发布
            </div>
          </>
        )}
      </div>

      {/* 管理态底部操作条 */}
      {manage && drafts.length > 0 && (
        <div className="flex items-center border-t bg-white shrink-0" style={{ borderColor: C.border }}>
          <button
            {...bindTap({ kind: 'action', id: 'drafts.manage.all.clear' }, {
              onTrigger: () => {
                deleteDrafts(drafts.map((d) => d.id));
                exitManage();
              },
            })}
            className="flex-1 h-12 bg-transparent border-none cursor-pointer text-[15px]"
            style={{ color: C.text }}
          >
            全部清除
          </button>
          <span className="w-px h-6 self-center" style={{ background: C.border }} />
          <button
            {...bindTap({ kind: 'action', id: 'drafts.manage.selected.clear' }, {
              onTrigger: () => {
                if (selected.length === 0) return;
                deleteDrafts(selected);
                exitManage();
              },
            })}
            disabled={selected.length === 0}
            className="flex-1 h-12 bg-transparent border-none cursor-pointer text-[15px] font-semibold"
            style={{ color: selected.length === 0 ? '#BFE9C6' : C.green }}
          >
            清除{selected.length > 0 ? ` ${selected.length}` : ''}
          </button>
        </div>
      )}
    </div>
  );
}
