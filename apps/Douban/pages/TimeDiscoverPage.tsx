import React from 'react';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { C, TopBar } from '../components/ui';

// 节点: time.discover —— 豆瓣时间|发现。头图 + 编者文案 + 时间好物长图 + 「立即购买」→market.product。
// evidence: IMG_0325 · IMG_F1d5e43_t0030

export default function TimeDiscoverPage() {
  const { bindTap } = useDoubanGestures();

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      <TopBar title="豆瓣时间 | 发现" right={<span className="text-lg" style={{ color: C.text }}>⋯</span>} />

      <div className="flex-1 overflow-y-auto pb-6 bg-white" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 进入即商品长图(mod7 审计:去掉自造深色 hero 与编辑部介绍段) */}
        {[
          {
            id: 'pd_stamp',
            title: '「时间刻痕」电影胶带套装',
            tag: '经典复古 | 影像还原',
            frame: 'linear-gradient(160deg,#EDE4D6,#E1D6C2)',
            slogan1: '原创插画 | 百变拼贴',
            slogan2: '悉心选材 | 限量预售',
            desc: '以老式放映机与胶片盒为灵感,六款原创插画胶带,收藏每一帧值得铭记的画面。',
          },
          {
            id: 'pd_notebook',
            title: '「留白」棉纸手账本',
            tag: '素雅装帧 | 顺滑书写',
            frame: 'linear-gradient(160deg,#E7ECE6,#D8E1D6)',
            slogan1: '天然棉纸 | 裸脊线装',
            slogan2: '可平摊 | 限量首发',
            desc: '选用微黄棉纸,裸脊线装可180°平摊,为每一次记录留出恰到好处的呼吸感。',
          },
        ].map((p) => (
          <div key={p.id} className="pt-5 pb-7 px-4 border-b" style={{ borderColor: C.border }}>
            {/* 居中大标题 */}
            <div className="text-center text-lg font-bold" style={{ color: C.text }}>{p.title}</div>
            <div className="text-center text-xs mt-1" style={{ color: C.sub }}>{p.tag}</div>
            {/* 相框式图片 */}
            <div className="mt-4 mx-auto rounded-lg p-2.5" style={{ background: '#fff', border: '1px solid #E2DAC8', maxWidth: 300, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div className="h-44 rounded" style={{ background: p.frame }} />
            </div>
            {/* 居中两行口号 */}
            <div className="mt-4 text-center text-sm leading-relaxed" style={{ color: '#52616B' }}>
              <div>{p.slogan1}</div>
              <div>{p.slogan2}</div>
            </div>
            <div className="mt-3 text-sm leading-relaxed text-center px-2" style={{ color: '#8A8F99' }}>{p.desc}</div>
            {/* 立即购买:浅蓝小椭圆、居中、约40%宽 */}
            <div className="mt-5 flex justify-center">
              <button
                {...bindTap('time.discover.product-open', { params: { productId: p.id } })}
                className="h-9 rounded-full text-sm font-medium cursor-pointer text-white"
                style={{ background: '#8FC0E8', border: 'none', width: '40%' }}
              >
                立即购买
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
