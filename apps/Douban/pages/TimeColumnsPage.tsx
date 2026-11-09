import React, { useMemo, useState } from 'react';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, Img, TopBar } from '../components/ui';

// 节点: time.columns —— 全部专栏。左侧竖排分类栏 + 右侧课程列表(按分类刷新)。
// evidence: IMG_0326/0327 · IMG_F1d5e43_t0026

const CATEGORIES = [
  '全部专栏', '大咖驾到', '精品畅销', '青椒学院', '心理情感', '文学艺术',
  '社科人文', '观影指南', '生活美学', '音乐人生', '影人PRO', '斜杠青年',
  '精品KEY专栏', "豆瓣时间「Girls' Power」",
] as const;

export default function TimeColumnsPage() {
  const { bindTap } = useDoubanGestures();
  const courses = useDoubanStore((s) => s.courses);
  const [cat, setCat] = useState(0);

  // 各分类给出稳定的课程子集(mock:按分类索引旋转 + 全部展示全集)。
  const list = useMemo(() => {
    if (cat === 0) return courses;
    if (courses.length === 0) return courses;
    const start = cat % courses.length;
    return courses.slice(start).concat(courses.slice(0, start));
  }, [courses, cat]);

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      <TopBar
        title={CATEGORIES[cat]}
        right={
          <span className="relative inline-flex items-center justify-center w-8 h-8 text-lg" style={{ color: C.text }}>
            ⋯
            <span className="absolute top-1 right-1 rounded-full" style={{ width: 6, height: 6, background: '#E5484D' }} />
          </span>
        }
      />

      <div className="flex-1 flex min-h-0">
        {/* 左侧分类栏(选中:黑字加粗 + 文字下方绿色下划线) */}
        <div className="w-24 shrink-0 overflow-y-auto" style={{ background: '#F0F1F3' }}>
          {CATEGORIES.map((label, i) => (
            <button
              key={label}
              {...bindTap(
                { kind: 'action', id: 'time.columns.category.select.target' },
                { params: { category: label }, onTrigger: () => setCat(i) },
              )}
              className="w-full text-left px-3 py-3.5 text-xs bg-transparent border-none cursor-pointer relative block"
              style={{
                color: cat === i ? C.text : '#52616B',
                fontWeight: cat === i ? 700 : 400,
                background: cat === i ? C.surface : 'transparent',
              }}
            >
              <span className="relative inline-block leading-snug">
                {label}
                {cat === i && (
                  <span className="absolute left-0 -bottom-1 h-0.5 rounded" style={{ background: C.green, width: '100%' }} />
                )}
              </span>
            </button>
          ))}
        </div>

        {/* 右侧课程列表 */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3" data-scroll-container="main" data-scroll-direction="vertical">
          {list.map((c) => (
            <div
              key={c.id}
              {...bindTap('time.columns.course-open', { params: { courseId: c.id } })}
              className="flex gap-3 bg-white rounded-lg p-3 cursor-pointer"
            >
              <div className="relative shrink-0">
                <Img src={c.cover} className="rounded object-cover" style={{ width: 84, height: 92 }} />
                <span className="absolute bottom-1 right-1 px-1 rounded text-[9px] text-white" style={{ background: 'rgba(0,0,0,0.55)' }}>
                  {c.kind === 'video' ? '视频' : '音频'}
                </span>
              </div>
              <div className="flex-1 min-w-0 flex flex-col">
                <div className="text-sm font-semibold leading-snug line-clamp-2" style={{ color: C.text }}>{c.title}</div>
                <div className="mt-1 text-xs truncate" style={{ color: C.sub }}>主讲 {c.author}</div>
                <div className="mt-auto flex items-baseline gap-2">
                  <span className="text-sm font-bold" style={{ color: '#E8702A' }}>{(c.price === 0 ? 0 : c.price).toFixed(2)}元</span>
                  <span className="text-[10px] line-through" style={{ color: '#B9BEC6' }}>{(c.price === 0 ? 199 : 298).toFixed(2)}元</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
