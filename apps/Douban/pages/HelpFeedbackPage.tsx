// 节点: help.feedback —— 帮助与反馈(evidence IMG_0305,静态样式页)。
// 问题搜索框 + 常见问题列表 + 「你在什么地方遇到问题啦」竖排图标行(闪退卡顿/首页/书影音…,右侧灰色提示副文)。全部入口 → wontfix。
import React from 'react';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, TopBar } from '../components/ui';

// mod7 审计:真机 11 条常见问题(逐条对齐)
const FAQS = [
  '社区指导原则是什么?',
  '关于「未成年人模式」',
  '如何查看在豆瓣购买的商品订单?',
  '什么是网络诈骗,如何防范?',
  '什么是「创作者认证」?',
  '申请「创作者认证」需要提供哪些信息?',
  '如何关闭提示音?',
  '所有的推送开关已关闭,为什么还有推送?',
  '网络从业者不良行为举报',
  '自身合法权益受侵害或被网暴',
  '如何联系我们?',
];

/** 「遇到问题」竖排图标行:彩色线性图标 + 标题 + 右侧具体问题(部分行无提示)。
 * mod7 审计:真机为齿轮/房子/星标/圆球等线性图标,首行「闪退、卡顿或界面错位」。 */
type SectionIcon = 'gear' | 'house' | 'star' | 'globe' | 'group' | 'bag' | 'clock' | 'shield';
const SECTIONS: { name: string; hint?: string; icon: SectionIcon; color: string }[] = [
  { name: '闪退、卡顿或界面错位', icon: 'gear', color: '#8A8F99' },
  { name: '首页', hint: '推荐的依据是什么', icon: 'house', color: '#4C9AF0' },
  { name: '书影音', hint: '条目信息错误', icon: 'star', color: '#F5A623' },
  { name: '小组', hint: '如何删除小组讨论', icon: 'group', color: '#5BC48A' },
  { name: '同城', icon: 'globe', color: '#E0608A' },
  { name: '豆品', hint: '订单物流问题', icon: 'bag', color: '#F26D5B' },
  { name: '豆瓣时间', icon: 'clock', color: '#7A6BD6' },
  { name: '账号安全', hint: '登录、密码、注销', icon: 'shield', color: '#2FA39A' },
];

/** 线性小图标(24×24,stroke=当前 section color) */
function SectionIconSvg({ icon, color }: { icon: SectionIcon; color: string }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className: 'shrink-0',
  };
  switch (icon) {
    case 'gear':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3.2" />
          <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" />
        </svg>
      );
    case 'house':
      return (
        <svg {...common}>
          <path d="M4 11l8-6 8 6" />
          <path d="M6 10v9h12v-9" />
        </svg>
      );
    case 'star':
      return (
        <svg {...common}>
          <path d="M12 4l2.3 4.7 5.2.7-3.8 3.7.9 5.2L12 15.8 7.2 18.3l.9-5.2L4.3 9.4l5.2-.7z" />
        </svg>
      );
    case 'globe':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <path d="M4 12h16M12 4a13 13 0 010 16M12 4a13 13 0 000 16" />
        </svg>
      );
    case 'group':
      return (
        <svg {...common}>
          <circle cx="9" cy="9" r="3" />
          <path d="M3.5 19a5.5 5.5 0 0111 0" />
          <path d="M16 7.5a3 3 0 010 5.5M20.5 19a5.5 5.5 0 00-4-5.3" />
        </svg>
      );
    case 'bag':
      return (
        <svg {...common}>
          <path d="M6 8h12l-1 12H7z" />
          <path d="M9 8a3 3 0 016 0" />
        </svg>
      );
    case 'clock':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v4l3 2" />
        </svg>
      );
    case 'shield':
      return (
        <svg {...common}>
          <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
        </svg>
      );
  }
}

export default function HelpFeedbackPage() {
  const { bindTap } = useDoubanGestures();
  const toast = useDoubanStore((s) => s.toast);

  const sectionBind = () =>
    bindTap(
      { kind: 'action', id: 'help.feedback.section.wontfix' },
      { onTrigger: () => toast('该功能暂未开放') },
    );

  return (
    <div className="flex flex-col h-full bg-[#F7F7F8]" data-status-bar-foreground="dark">
      <TopBar
        title="帮助与反馈"
        borderless
        right={
          <button
            {...sectionBind()}
            className="w-9 h-10 flex items-center justify-center bg-transparent border-none cursor-pointer"
            aria-label="反馈记录"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="3" width="14" height="18" rx="2" />
              <path d="M9 8h6M9 12h6M9 16h3" />
            </svg>
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto pb-8" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 搜索框 */}
        <div className="px-4 py-3 bg-white">
          <button
            {...bindTap(
              { kind: 'action', id: 'help.feedback.search.wontfix' },
              { onTrigger: () => toast('该功能暂未开放') },
            )}
            className="w-full h-9 rounded-full flex items-center gap-2 px-3 border-none cursor-pointer"
            style={{ background: '#F2F3F5' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B9BEC6" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
            </svg>
            <span className="text-sm" style={{ color: '#B9BEC6' }}>搜索你想找的问题</span>
          </button>
        </div>

        {/* 常见问题 */}
        <div className="mt-2 bg-white">
          <div className="px-4 pt-3 pb-1 text-[13px]" style={{ color: '#B9BEC6' }}>常见问题</div>
          {FAQS.map((q, i) => (
            <button
              key={q}
              {...bindTap(
                { kind: 'action', id: 'help.feedback.faq.wontfix' },
                { onTrigger: () => toast('该功能暂未开放') },
              )}
              className="w-full flex items-center gap-2 px-4 text-left bg-white border-none cursor-pointer"
              style={{ height: 50, borderTop: i === 0 ? 'none' : `0.5px solid ${C.border}` }}
            >
              <span className="flex-1 text-[15px] truncate" style={{ color: C.text }}>{q}</span>
              <span className="text-lg shrink-0" style={{ color: '#C7CCD4' }}>›</span>
            </button>
          ))}
        </div>

        {/* 「遇到问题」竖排图标行列表 */}
        <div className="mt-2 bg-white">
          <div className="px-4 pt-3 pb-1 text-[13px]" style={{ color: '#B9BEC6' }}>你在什么地方遇到问题啦</div>
          {SECTIONS.map((s, i) => (
            <button
              key={s.name}
              {...sectionBind()}
              className="w-full flex items-center gap-3 px-4 text-left bg-white border-none cursor-pointer"
              style={{ height: 56, borderTop: i === 0 ? 'none' : `0.5px solid ${C.border}` }}
            >
              <SectionIconSvg icon={s.icon} color={s.color} />
              <span className="text-[15px] shrink-0" style={{ color: C.text }}>{s.name}</span>
              <span className="flex-1 text-xs truncate text-right" style={{ color: '#B9BEC6' }}>{s.hint ?? ''}</span>
              <span className="text-lg shrink-0" style={{ color: '#C7CCD4' }}>›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
