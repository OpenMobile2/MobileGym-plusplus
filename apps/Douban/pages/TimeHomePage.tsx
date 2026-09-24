import React, { useMemo } from 'react';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, Img, TopBar } from '../components/ui';

// 节点: time.home —— 豆瓣时间首页。banner + 五宫格入口 + 课程 rows。
// evidence: IMG_0321/0331/0332 · IMG_F1d5e43_t0020/t0040

/** 五宫格:彩色实心圆 + 白色线性图标(mod7 审计:真机粉/蓝/橙/紫/绿实心圆) */
function GridCell({ bind, label, bg, icon }: { bind: object; label: string; bg: string; icon: React.ReactNode }) {
  return (
    <button {...bind} className="flex flex-col items-center gap-1.5 bg-transparent border-none cursor-pointer">
      <span className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: bg }}>{icon}</span>
      <span className="text-[11px]" style={{ color: C.text }}>{label}</span>
    </button>
  );
}

const gIcon = (path: string) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    {path.split('|').map((d, i) => (
      <path key={i} d={d} />
    ))}
  </svg>
);

export default function TimeHomePage() {
  const { bindTap } = useDoubanGestures();
  const courses = useDoubanStore((s) => s.courses);

  const newArrivals = useMemo(() => courses.slice(0, 1), [courses]);
  const summerList = useMemo(() => courses, [courses]);
  const bestSellers = useMemo(() => courses, [courses]);

  const courseTap = (courseId: string) =>
    bindTap('time.home.course-open', { params: { courseId } });

  // 价格「49.00元」+ 划线原价「99.00元」(元后缀、两位小数,mod7 审计)
  const priceBlock = (price: number, strike?: number) => (
    <span className="inline-flex items-baseline gap-1">
      <span className="text-sm font-bold" style={{ color: '#E8702A' }}>{price.toFixed(2)}元</span>
      {strike != null && (
        <span className="text-[10px] line-through font-normal" style={{ color: '#B9BEC6' }}>{strike.toFixed(2)}元</span>
      )}
    </span>
  );

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      <TopBar
        title="豆瓣时间"
        right={
          <span className="relative inline-flex items-center justify-center w-8 h-8 text-lg" style={{ color: C.text }}>
            ⋯
            <span className="absolute top-1 right-1 rounded-full" style={{ width: 6, height: 6, background: '#E5484D' }} />
          </span>
        }
      />

      <div className="flex-1 overflow-y-auto pb-6" data-scroll-container="main" data-scroll-direction="vertical">
        {/* banner:图片轮播 + 居中 6 圆点 + 两侧露出(mod7 审计) */}
        <div className="pt-3 pb-1">
          <button
            {...bindTap('time.home.banner-open', { params: { courseId: courses[0]?.id ?? 'crs_lian' } })}
            className="relative block mx-6 w-auto rounded-xl overflow-hidden text-left border-none cursor-pointer p-0"
            style={{ height: 150 }}
          >
            <Img src={courses[0]?.cover} className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,0.35))' }} />
          </button>
          {/* 居中 6 圆点 */}
          <div className="flex justify-center gap-1.5 mt-2">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <span key={i} className="rounded-full" style={{ width: 6, height: 6, background: i === 0 ? C.green : '#D5D8DD' }} />
            ))}
          </div>
        </div>

        {/* 五宫格(彩色实心圆 + 白色线性图标) */}
        <div className="mx-3 mb-3 grid grid-cols-5 gap-1 bg-white rounded-xl py-3">
          <GridCell bind={bindTap('time.home.qjacademy-open')} label="青椒学院" bg="#E0608A" icon={gIcon('M12 3l9 5-9 5-9-5z|M5 10v5c0 1.5 3 3 7 3s7-1.5 7-3v-5')} />
          <GridCell bind={bindTap('time.home.discover-open')} label="时间发现" bg="#4C9AF0" icon={gIcon('M12 3a9 9 0 100 18 9 9 0 000-18z|M15 9l-2 4-4 2 2-4z')} />
          <GridCell bind={bindTap('time.home.columns-open')} label="全部专栏" bg="#E8912E" icon={gIcon('M5 4h10a2 2 0 012 2v14l-4-2-3 2V6a2 2 0 00-2-2z|M5 4a2 2 0 00-2 2v12')} />
          <GridCell bind={bindTap('time.home.checkin-open')} label="签到" bg="#7A6BD6" icon={gIcon('M5 5h14v15H5z|M5 9h14M9 3v4M15 3v4')} />
          <GridCell bind={bindTap('time.home.mine-open')} label="我的" bg="#5BC48A" icon={gIcon('M12 4a4 4 0 100 8 4 4 0 000-8z|M5 20a7 7 0 0114 0')} />
        </div>

        {/* 新品上架(大卡 + 副题 + 简介行 + 试读横滑) */}
        <div className="mx-3 mb-3">
          <div className="text-base font-bold mb-2 leading-snug" style={{ color: C.text }}>
            新品上架:用传播学读懂你的社交密码
          </div>
          {newArrivals.map((c) => (
            <div key={c.id} className="bg-white rounded-xl overflow-hidden">
              <div {...courseTap(c.id)} className="flex gap-3 p-3 cursor-pointer">
                <Img src={c.cover} className="rounded-lg object-cover shrink-0" style={{ width: 92, height: 122 }} />
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="text-[15px] font-bold leading-snug" style={{ color: C.text }}>{c.title}</div>
                  <div className="mt-1 text-xs leading-relaxed line-clamp-2" style={{ color: C.sub }}>
                    从社交焦虑到人际影响,用传播学的视角重新认识每一次沟通。
                  </div>
                  <div className="mt-1.5 flex gap-1">
                    <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: C.greenSoft, color: C.green }}>发刊词</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: '#FBF0E6', color: '#E8702A' }}>可试读</span>
                  </div>
                  <div className="mt-auto">{priceBlock(c.price, c.price === 0 ? 99 : 99)}</div>
                </div>
              </div>
              {/* 横滑试读章节卡 */}
              <div className="flex gap-2 px-3 pb-3 overflow-x-auto" data-scroll-container="trial" data-scroll-direction="horizontal">
                {['发刊词 · 我们为什么要听这门课', '19_我们怎么如此痴迷于社交', '05_人设是如何被制造的'].map((t) => (
                  <div
                    key={t}
                    {...courseTap(c.id)}
                    className="w-40 shrink-0 rounded-lg px-2.5 py-2 flex items-start gap-2 cursor-pointer"
                    style={{ background: '#F5F7F6', border: `1px solid ${C.border}` }}
                  >
                    <span className="shrink-0 mt-0.5" style={{ color: C.green }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M7 3h7l4 4v14H7z" /><path d="M14 3v4h4" />
                      </svg>
                    </span>
                    <div className="min-w-0">
                      <div className="text-[11px]" style={{ color: C.green }}>试读</div>
                      <div className="text-[11px] leading-snug line-clamp-2 mt-0.5" style={{ color: C.text }}>{t}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 盛夏读书会(横滑) */}
        <div className="mb-3">
          <div className="flex items-center justify-between px-3 mb-2">
            <div className="text-base font-bold" style={{ color: C.text }}>盛夏读书会</div>
            <button {...bindTap('time.home.more-open')} className="text-xs bg-transparent border-none cursor-pointer" style={{ color: C.sub }}>
              查看更多 ›
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto px-3 pb-1" data-scroll-container="summer" data-scroll-direction="horizontal">
            {summerList.map((c) => (
              <div key={c.id} {...courseTap(c.id)} className="w-32 shrink-0 cursor-pointer">
                <div className="relative">
                  <Img src={c.cover} className="w-32 h-40 rounded-lg object-cover" />
                  <span className="absolute bottom-1.5 right-1.5 px-1 rounded text-[9px] text-white" style={{ background: 'rgba(0,0,0,0.55)' }}>
                    {c.kind === 'video' ? '视频' : '音频'}
                  </span>
                </div>
                <div className="mt-1.5 text-xs font-medium leading-snug line-clamp-2" style={{ color: C.text }}>{c.title}</div>
                <div className="mt-1">{priceBlock(c.price)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 精品畅销(列表) */}
        <div className="mx-3">
          <div className="text-base font-bold mb-2" style={{ color: C.text }}>精品畅销</div>
          <div className="bg-white rounded-xl overflow-hidden">
            {bestSellers.map((c, i) => (
              <div
                key={c.id}
                {...courseTap(c.id)}
                className={`flex gap-3 p-3 cursor-pointer ${i > 0 ? 'border-t' : ''}`}
                style={{ borderColor: C.border }}
              >
                <Img src={c.cover} className="rounded object-cover shrink-0" style={{ width: 56, height: 76 }} />
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="text-sm font-semibold truncate" style={{ color: C.text }}>{c.title}</div>
                  <div className="mt-1 text-xs truncate" style={{ color: C.sub }}>{c.author}</div>
                  <div className="mt-1">{priceBlock(c.price)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 专题长图占位 */}
        <div className="mx-3 mt-3 rounded-xl" style={{ height: 120, background: 'linear-gradient(135deg,#F3EFE6,#EAF6EC)', border: `1px solid ${C.border}` }} />
      </div>
    </div>
  );
}
