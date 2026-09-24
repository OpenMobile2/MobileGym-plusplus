import React from 'react';
import { useFlomoGestures } from '../hooks/useFlomoGestures';

/**
 * flomo 主题色 —— 全部走 CSS 变量,由 FlomoApp 根节点按 settings.theme 注入实际值,
 * 因此偏好设置里的「深色模式」开关是真实换肤(全局生效)。
 */
export const C = {
  bg: 'var(--fl-bg)',
  surface: 'var(--fl-surface)',
  text: 'var(--fl-text)',
  sub: 'var(--fl-sub)',
  green: '#33B679',
  tagText: 'var(--fl-tag-text)',
  tagBg: 'var(--fl-tag-bg)',
  border: 'var(--fl-border)',
  linkBlue: 'var(--fl-link)',
};

export const THEME_VARS: Record<'light' | 'dark', Record<string, string>> = {
  light: {
    '--fl-bg': '#F7F8FA',
    '--fl-surface': '#FFFFFF',
    '--fl-text': '#1A1A1A',
    '--fl-sub': '#9AA0A6',
    '--fl-tag-text': '#3E7BF2',
    '--fl-tag-bg': '#EAF1FE',
    '--fl-border': '#ECECEC',
    '--fl-link': '#3B7DE0',
  },
  dark: {
    '--fl-bg': '#0D0D0D',
    '--fl-surface': '#1C1C1E',
    '--fl-text': '#ECECEC',
    '--fl-sub': '#8A8F99',
    '--fl-tag-text': '#8FAFF8',
    '--fl-tag-bg': '#26304A',
    '--fl-border': '#2A2A2C',
    '--fl-link': '#7FA5F5',
  },
};

const IMG_FALLBACK =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 80'><rect width='100' height='80' fill='%23EEF1FB'/></svg>";

export function TopBar({
  title,
  left,
  right,
}: {
  title?: React.ReactNode;
  left?: React.ReactNode;
  right?: React.ReactNode;
}) {
  const { bindBack } = useFlomoGestures();
  return (
    <div
      className="flex items-center h-11 px-2 shrink-0 border-b"
      style={{ borderColor: C.border, background: C.bg }}
    >
      <div className="w-16 flex items-center">
        {left ?? (
          <button
            {...bindBack()}
            className="w-9 h-9 flex items-center justify-center text-2xl bg-transparent border-none cursor-pointer"
            style={{ color: C.text }}
          >
            ‹
          </button>
        )}
      </div>
      <div className="flex-1 text-center font-semibold text-base truncate" style={{ color: C.text }}>
        {title}
      </div>
      <div className="w-16 flex items-center justify-end">{right}</div>
    </div>
  );
}

/** 圆形浅灰图标按钮(顶栏汉堡/搜索等)。binding 由调用方 spread 进来。 */
export function CircleBtn({
  children,
  ...rest
}: React.HTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className="w-9 h-9 rounded-full flex items-center justify-center bg-black/5 border-none cursor-pointer"
      style={{ color: C.text }}
    >
      {children}
    </button>
  );
}

export function MemoImages({ images }: { images: string[] }) {
  if (!images?.length) return null;
  const cols = images.length === 1 ? 1 : images.length === 2 ? 2 : 3;
  return (
    <div
      className="mt-2 grid gap-1"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}
    >
      {images.map((src, i) => (
        <img
          key={i}
          src={src}
          alt=""
          className={`w-full object-cover rounded-lg ${images.length === 1 ? 'max-h-52' : 'aspect-square'}`}
          onError={(e) => {
            (e.target as HTMLImageElement).src = IMG_FALLBACK;
          }}
        />
      ))}
    </div>
  );
}

/**
 * 渲染笔记正文:按行处理 有序/无序列表,行内 #标签 可点(tagProps 工厂)、URL 链接。
 */
export function renderContent(
  content: string,
  tagProps: (tagText: string) => React.HTMLAttributes<HTMLSpanElement>,
  fontSize = 15,
) {
  const lines = content.split('\n');
  return (
    <div style={{ color: C.text, fontSize, lineHeight: 1.6 }} className="whitespace-pre-wrap break-words">
      {lines.map((line, li) => {
        const bullet = /^-\s+/.test(line);
        const ordered = line.match(/^(\d+)\.\s+/);
        const body = bullet ? line.replace(/^-\s+/, '') : ordered ? line.replace(/^\d+\.\s+/, '') : line;
        const inner = renderInline(body, tagProps);
        if (bullet) {
          return (
            <div key={li} className="flex gap-2">
              <span style={{ color: C.sub }}>•</span>
              <span className="flex-1">{inner}</span>
            </div>
          );
        }
        if (ordered) {
          return (
            <div key={li} className="flex gap-2">
              <span style={{ color: C.sub }}>{ordered[1]}.</span>
              <span className="flex-1">{inner}</span>
            </div>
          );
        }
        return <div key={li}>{inner}</div>;
      })}
    </div>
  );
}

function renderInline(
  text: string,
  tagProps: (tagText: string) => React.HTMLAttributes<HTMLSpanElement>,
) {
  // 拆分 **加粗** / ==荧光笔== / __下划线__ / #标签 / URL,其余为普通文本
  const parts = text
    .split(/(\*\*[^*]+\*\*|==[^=]+==|__[^_]+__|#[^\s#]+|https?:\/\/\S+)/g)
    .filter((p) => p !== '');
  return parts.map((p, i) => {
    if (/^\*\*[^*]+\*\*$/.test(p)) {
      return (
        <strong key={i} style={{ fontWeight: 700 }}>
          {p.slice(2, -2)}
        </strong>
      );
    }
    if (/^==[^=]+==$/.test(p)) {
      return (
        <mark key={i} style={{ background: '#FDE68A', color: '#1A1A1A', borderRadius: 3, padding: '0 2px' }}>
          {p.slice(2, -2)}
        </mark>
      );
    }
    if (/^__[^_]+__$/.test(p)) {
      return (
        <span key={i} style={{ textDecorationLine: 'underline', textUnderlineOffset: 3 }}>
          {p.slice(2, -2)}
        </span>
      );
    }
    if (/^#[^\s#]+$/.test(p)) {
      return (
        <span
          key={i}
          {...tagProps(p.slice(1))}
          className="inline-block px-1.5 rounded mx-0.5 cursor-pointer"
          style={{ color: C.tagText, background: C.tagBg, fontSize: '0.9em' }}
        >
          {p}
        </span>
      );
    }
    if (/^https?:\/\//.test(p)) {
      return (
        <span key={i} style={{ color: C.linkBlue }}>
          {p}
        </span>
      );
    }
    return <React.Fragment key={i}>{p}</React.Fragment>;
  });
}
