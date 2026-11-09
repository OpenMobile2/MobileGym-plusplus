// 节点: community.center —— 社区管理中心(evidence IMG_0306,静态样式页)。
// 绿色插画头图 + 社区指导原则卡 + 公告列表(治理公告/社区规范/处罚公告标签) + 其他法规入口行。全部条目 → wontfix。
import React from 'react';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, TopBar } from '../components/ui';

const GUIDELINE = {
  title: '社区指导原则',
  desc: '分享、互助和开放;宽容和理性地对待不同的看法…',
};

type NoticeCat = '治理公告' | '社区规范' | '处罚公告';
const NOTICES: { title: string; cat: NoticeCat; time: string }[] = [
  { title: '关于“E企护航2026”专项整治行动的治理公告(2026年6月30日)', cat: '治理公告', time: '2026-06-30 11:17:43' },
  { title: '关于“网络暴力治理”的公告(2026年6月29日)', cat: '治理公告', time: '2026-06-29 14:44:46' },
  { title: '6月豆瓣未成年人模式建设情况公告', cat: '社区规范', time: '2026-06-29 10:57:28' },
  { title: '关于“饭圈”乱象治理专项行动的处罚公告(2026年6月26日)', cat: '处罚公告', time: '2026-06-26 10:50:45' },
];
const LAWS = ['豆瓣个人信息保护政策', '法律声明', '豆瓣用户协议'];

export default function CommunityCenterPage() {
  const { bindTap } = useDoubanGestures();
  const toast = useDoubanStore((s) => s.toast);

  const guidelineBind = () =>
    bindTap(
      { kind: 'action', id: 'community.center.guideline.wontfix' },
      { onTrigger: () => toast('该功能暂未开放') },
    );
  const noticeBind = () =>
    bindTap(
      { kind: 'action', id: 'community.center.notice.wontfix' },
      { onTrigger: () => toast('该功能暂未开放') },
    );

  return (
    <div className="flex flex-col h-full bg-[#F7F7F8]" data-status-bar-foreground="dark">
      <TopBar
        title="社区管理中心"
        borderless
        right={
          <button
            {...noticeBind()}
            className="w-8 h-10 flex items-center justify-center text-xl bg-transparent border-none cursor-pointer leading-none"
            style={{ color: C.text }}
          >
            …
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto pb-8" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 绿色插画头图 + 社区指导原则卡(卡片下沿压住头图) */}
        <div className="relative">
          <HeroBanner />
          <div className="px-3 -mt-8 relative">
            <button
              {...guidelineBind()}
              className="w-full flex items-center gap-3 bg-white rounded-xl px-4 text-left border-none cursor-pointer"
              style={{ minHeight: 72, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
            >
              <BooksIcon />
              <span className="flex-1 min-w-0 py-3">
                <span className="block text-[17px] font-semibold" style={{ color: C.text }}>{GUIDELINE.title}</span>
                <span className="block mt-1 text-[12px] truncate" style={{ color: C.sub }}>{GUIDELINE.desc}</span>
              </span>
              <span className="text-lg shrink-0" style={{ color: '#C7CCD4' }}>›</span>
            </button>
          </div>
        </div>

        {/* 公告列表 */}
        <div className="mt-4 px-4">
          <div className="flex items-center">
            <MegaphoneIcon />
            <span className="ml-2 flex-1 text-[17px] font-bold" style={{ color: C.text }}>社区公告</span>
            <button
              {...noticeBind()}
              className="flex items-center gap-0.5 text-[13px] bg-transparent border-none cursor-pointer"
              style={{ color: C.sub }}
            >
              查看更多 ›
            </button>
          </div>
          {NOTICES.map((n) => (
            <button
              key={n.title}
              {...noticeBind()}
              className="w-full flex flex-col items-start gap-1.5 text-left bg-transparent border-none cursor-pointer"
              style={{ paddingTop: 16, paddingBottom: 16 }}
            >
              <span className="text-[16px] leading-snug" style={{ color: C.text }}>{n.title}</span>
              <span className="flex items-center gap-2">
                <span
                  className="px-1.5 py-0.5 rounded text-[11px]"
                  style={{ background: '#F0F1F2', color: '#9AA0A8' }}
                >
                  {n.cat}
                </span>
                <span className="text-[12px]" style={{ color: '#B9BEC6' }}>{n.time}</span>
              </span>
            </button>
          ))}
        </div>

        {/* 其他法规 */}
        <div className="mt-3 h-2" style={{ background: '#F0F1F2' }} />
        <div className="px-4 pt-4">
          <div className="text-[15px]" style={{ color: '#B9BEC6' }}>其他法规</div>
          {LAWS.map((l) => (
            <button
              key={l}
              {...noticeBind()}
              className="w-full flex items-center gap-2 text-left bg-transparent border-none cursor-pointer"
              style={{ height: 52 }}
            >
              <span className="shrink-0 rounded-full" style={{ width: 4, height: 4, background: '#B9BEC6' }} />
              <span className="text-[16px] truncate" style={{ color: C.text }}>
                {l}
                <span className="ml-1 text-sm" style={{ color: '#C7CCD4' }}>›</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** 绿色渐变头图 + 盾牌/小屋/云/飞鸟简笔插画(无外部资源) */
function HeroBanner() {
  return (
    <div className="relative w-full overflow-hidden" style={{ height: 176 }}>
      <svg width="100%" height="100%" viewBox="0 0 360 176" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="dbc-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3FC15A" />
            <stop offset="1" stopColor="#2FB84C" />
          </linearGradient>
        </defs>
        <rect width="360" height="176" fill="url(#dbc-sky)" />
        {/* 远山 */}
        <path d="M0 150 Q90 108 180 140 T360 132 V176 H0 Z" fill="#2AAE45" opacity="0.55" />
        <path d="M0 168 Q120 132 230 160 T360 152 V176 H0 Z" fill="#28A842" opacity="0.6" />
        {/* 盾牌 */}
        <path
          d="M180 30 L216 42 V78 Q216 108 180 122 Q144 108 144 78 V42 Z"
          fill="#37BC53"
          stroke="#EAF9EC"
          strokeWidth="2"
        />
        {/* 小屋 */}
        <g>
          <rect x="164" y="80" width="32" height="26" fill="#F4F8F0" />
          <path d="M158 82 L180 62 L202 82 Z" fill="#F2D024" />
          <rect x="171" y="90" width="7" height="16" fill="#F2D024" />
          <rect x="184" y="90" width="7" height="9" fill="#F2D024" />
        </g>
        {/* 云 */}
        <g fill="#EAF9EC" opacity="0.9">
          <ellipse cx="110" cy="70" rx="20" ry="9" />
          <ellipse cx="126" cy="66" rx="12" ry="8" />
        </g>
        {/* 飞鸟 */}
        <path d="M258 78 q6 -6 12 0 q6 -6 12 0" fill="none" stroke="#EAF9EC" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

/** 叠放书本图标(社区指导原则卡左侧) */
function BooksIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" className="shrink-0">
      <rect x="6" y="26" width="28" height="7" rx="1.5" fill="#4C9AF0" />
      <rect x="8" y="19" width="24" height="7" rx="1.5" fill="#F26D5B" transform="rotate(-4 20 22)" />
      <rect x="9" y="12" width="22" height="7" rx="1.5" fill="#5BC48A" transform="rotate(4 20 15)" />
    </svg>
  );
}

/** 社区公告 小喇叭图标 */
function MegaphoneIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" className="shrink-0">
      <path d="M4 9 L13 5 V17 L4 13 Z" fill={C.green} />
      <rect x="2" y="9" width="3" height="4" rx="1" fill={C.green} />
      <path d="M15 8 q3 3 0 6" fill="none" stroke={C.green} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M5 13 l1.5 4 h2 l-1 -3.6 Z" fill={C.green} />
    </svg>
  );
}
