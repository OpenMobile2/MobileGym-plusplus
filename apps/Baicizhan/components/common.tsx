import React from 'react';
import { useDarkMode } from '../../../os/hooks/useDarkMode';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { colors } from '../res/colors';
import { IcArrowLeft, IcClose, IcChevronRight } from '../res/icons';
import { wordImage, productImage, articleImage } from '../assets';

/** 顶部返回栏。返回键一律 bindBack(§11 合同)。 */
export const PageHeader: React.FC<{
  title?: string; dark?: boolean; close?: boolean; right?: React.ReactNode;
}> = ({ title, dark, close, right }) => {
  const { bindBack } = useBaicizhanGestures();
  const { isDark } = useDarkMode();
  const fg = dark ? '#fff' : 'var(--app-c-ink)';
  return (
    <div className="grid shrink-0 grid-cols-[auto_1fr_auto] items-center px-3 pb-2 pt-12" data-status-bar-foreground={dark || isDark ? 'light' : 'dark'}>
      <button {...bindBack()} className="flex h-9 w-9 items-center justify-center" aria-label="back">
        {close ? <IcClose size={22} color={fg} /> : <IcArrowLeft size={22} color={fg} />}
      </button>
      <div className="truncate px-2 text-center text-base font-semibold" style={{ color: fg }}>{title}</div>
      <div className="flex items-center gap-2">{right}</div>
    </div>
  );
};

/** 分段切换器 */
export const Segmented: React.FC<{
  value: string;
  options: { key: string; label: string; bind: Record<string, any> }[];
  color?: string;
}> = ({ value, options, color = colors.primary }) => (
  <div className="flex items-center gap-4 overflow-x-auto">
    {options.map((o) => {
      const active = o.key === value;
      return (
        <button key={o.key} {...o.bind}
          className="relative shrink-0 py-2 text-sm font-medium"
          style={{ color: active ? color : colors.inkSub }}>
          {o.label}
          {active && <span className="absolute -bottom-0.5 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full" style={{ background: color }} />}
        </button>
      );
    })}
  </div>
);

const GRADS = ['#B7C9E8', '#C6D8C0', '#E8C9C2', '#D6C9E8', '#C9E1E8', '#E8DEC2'];
function hashHue(key: string): string {
  let h = 0;
  for (let i = 0; i < key.length; i += 1) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return GRADS[h % GRADS.length];
}

/** 单词/商品/文章配图:有生成的 PNG 用 PNG,缺失回落到色块占位(§5.3)。 */
export const WordImage: React.FC<{ id: string; label?: string; className?: string; rounded?: number }> = ({ id, label, className, rounded = 16 }) => {
  const src = wordImage(id);
  if (src) return <img src={src} alt={label ?? id} className={className} style={{ borderRadius: rounded, objectFit: 'cover' }} />;
  return (
    <div className={className} style={{ borderRadius: rounded, background: `linear-gradient(135deg, ${hashHue(id)}, #ffffff)` }}>
      <div className="flex h-full w-full items-end justify-center pb-2">
        <span className="text-xs font-medium text-black/45">{label ?? id}</span>
      </div>
    </div>
  );
};

export const ProductImage: React.FC<{ id: string; label?: string; className?: string; rounded?: number }> = ({ id, label, className, rounded = 12 }) => {
  const src = productImage(id);
  if (src) return <img src={src} alt={label ?? id} className={className} style={{ borderRadius: rounded, objectFit: 'cover' }} />;
  return <div className={className} style={{ borderRadius: rounded, background: hashHue(id) }} />;
};

export const ArticleImage: React.FC<{ id: string; label?: string; className?: string; rounded?: number }> = ({ id, label, className, rounded = 12 }) => {
  const src = articleImage(id);
  if (src) return <img src={src} alt={label ?? id} className={className} style={{ borderRadius: rounded, objectFit: 'cover' }} />;
  return <div className={className} style={{ borderRadius: rounded, background: `linear-gradient(135deg, ${hashHue(id)}, #90A4C8)` }} />;
};

/** 学习内容统一封面。用于没有独立位图的课程/书单，避免空白色块。 */
export const LearningCover: React.FC<{
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  className?: string;
  compact?: boolean;
}> = ({ id, title, subtitle, icon = 'Aa', className, compact = false }) => {
  const base = hashHue(id);
  return (
    <div data-learning-cover={id} className={`relative overflow-hidden ${className ?? ''}`} style={{ background: `linear-gradient(145deg, ${base}, #7894C7)` }}>
      <span className="absolute -right-4 -top-5 h-20 w-20 rounded-full bg-white/20" />
      <span className="absolute -bottom-8 -left-5 h-20 w-20 rounded-full bg-[#2F58E8]/15" />
      <div className={`relative flex h-full flex-col ${compact ? 'justify-center p-2' : 'justify-between p-3'}`}>
        <span className={`${compact ? 'text-base' : 'text-2xl'} font-black tracking-tight text-white/90`}>{icon}</span>
        <div className="min-w-0">
          <div className={`${compact ? 'text-[10px]' : 'text-sm'} line-clamp-2 font-bold leading-tight text-white`}>{title}</div>
          {subtitle && !compact && <div className="mt-1 truncate text-[10px] text-white/75">{subtitle}</div>}
        </div>
      </div>
    </div>
  );
};

/** 设置类导航/开关行 */
export const Row: React.FC<{ label: string; right?: React.ReactNode; bind?: Record<string, any>; sub?: string; danger?: boolean }> = ({ label, right, bind, sub, danger }) => (
  <button {...bind} className="flex w-full items-center border-b border-[#F4F4F4] bg-white px-4 py-3.5 text-left">
    <div>
      <div className="text-sm" style={{ color: danger ? '#E4574C' : colors.ink }}>{label}</div>
      {sub && <div className="mt-0.5 text-xs text-[#9AA5B1]">{sub}</div>}
    </div>
    <div className="ml-auto flex items-center gap-1 text-xs text-[#9AA5B1]">{right ?? <IcChevronRight size={16} color="#C9CDD3" />}</div>
  </button>
);

/** 开关(纯展示,受控) */
export const Toggle: React.FC<{ on: boolean; bind: Record<string, any>; disabled?: boolean }> = ({ on, bind, disabled }) => (
  <button {...bind} disabled={disabled}
    className="relative h-6 w-10 rounded-full transition-colors"
    style={{ background: on ? colors.primary : '#D8DCE3', opacity: disabled ? 0.4 : 1 }}>
    <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all" style={{ left: on ? 18 : 2 }} />
  </button>
);

/** 空态 */
export const Empty: React.FC<{ text: string; icon?: React.ReactNode }> = ({ text, icon }) => (
  <div className="flex flex-col items-center justify-center gap-2 py-16">
    <div className="text-3xl opacity-30">{icon ?? '📭'}</div>
    <div className="text-sm text-[#C9CDD3]">{text}</div>
  </div>
);
