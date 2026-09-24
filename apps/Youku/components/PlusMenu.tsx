import React from 'react';

/**
 * 顶栏「+」下拉菜单(阶段⑥走查补做,参考 youku_images/added_2):
 * 筛选 / 扫一扫 / 投屏。首页与长尾频道页共用;URL 驱动(?menu=plus),点遮罩 back 关闭。
 * 绑定 id 由各页以字符串字面量创建后传入(nav checker 铁律)。
 */

type Bind = React.HTMLAttributes<HTMLElement>;

function IcFunnel({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 5h16l-6 7v6l-4 2v-8L4 5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}
function IcScan({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 8V5a1 1 0 011-1h3M16 4h3a1 1 0 011 1v3M20 16v3a1 1 0 01-1 1h-3M8 20H5a1 1 0 01-1-1v-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M3.5 12h17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function IcCast({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 20h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function PlusMenu({
  open,
  backdropBind,
  filterBind,
  scanBind,
  castBind,
  filterLabel,
  scanLabel,
  castLabel,
}: {
  open: boolean;
  backdropBind: Bind;
  filterBind: Bind;
  scanBind: Bind;
  castBind: Bind;
  filterLabel: string;
  scanLabel: string;
  castLabel: string;
}) {
  if (!open) return null;
  const itemCls =
    'flex w-full cursor-pointer items-center gap-2.5 border-none bg-transparent px-4 py-3 text-left text-[15px] text-(--app-c-text-primary)';
  return (
    <div {...backdropBind} className="absolute inset-0 z-40 cursor-default">
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute right-3 top-[68px] w-40 overflow-hidden rounded-2xl bg-(--app-c-card-bg) py-1 shadow-lg ring-1 ring-white/10"
      >
        <button {...(filterBind as React.HTMLAttributes<HTMLButtonElement>)} className={itemCls}>
          <IcFunnel />
          {filterLabel}
        </button>
        <button {...(scanBind as React.HTMLAttributes<HTMLButtonElement>)} className={itemCls}>
          <IcScan />
          {scanLabel}
        </button>
        <button {...(castBind as React.HTMLAttributes<HTMLButtonElement>)} className={itemCls}>
          <IcCast />
          {castLabel}
        </button>
      </div>
    </div>
  );
}
