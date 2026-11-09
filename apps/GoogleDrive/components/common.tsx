// apps/GoogleDrive/components/common.tsx — 共享外观件
import React, { useRef, useState } from 'react';
import * as TimeService from '@/os/TimeService';
import { useLocale } from '@/os/locale';
import { GD } from '../res/colors';
import { DIM } from '../res/dimens';
import {
  IcFileDoc, IcFileSheet, IcFileSlide, IcFilePdf, IcFileImage, IcFileGeneric,
  IcFolder, IcClose, IcMore, IcSortAsc, IcSortDesc, IcViewGrid, IcViewList, IcStar, IcOffline,
} from '../res/icons';
import type { DriveItem, ItemKind, SortOrder } from '../types';
import { useGoogleDriveGestures } from '../hooks/useGoogleDriveGestures';

/**
 * 手势 hook 绑好的 DOM props。共享组件统一收这个类型 ——
 * 调用处用字面量 ID 调 bindTap/bindLongPress/bindBack，把结果整体传下来。
 */
export type BindProps = React.HTMLAttributes<HTMLElement> & {
  'data-trigger'?: string;
  'data-trigger-type'?: string;
  'data-trigger-params'?: string;
  'data-action'?: string;
  'data-action-type'?: string;
  'data-action-params'?: string;
};

// ═══════════════════════════════════════════════════════════
// Toast
// ═══════════════════════════════════════════════════════════
let toastTimer: ReturnType<typeof setTimeout> | null = null;

export function showToast(msg: string) {
  if (typeof document === 'undefined') return;
  let el = document.getElementById('gd-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'gd-toast';
    el.style.cssText =
      `position:absolute;left:16px;right:16px;bottom:96px;z-index:400;background:${GD.toastBg};` +
      `color:#fff;padding:14px 16px;border-radius:${DIM.toastRadius}px;font-size:14px;` +
      'pointer-events:none;transition:opacity .2s;opacity:0';
    const root = document.querySelector('[data-app-root="googledrive"]') || document.body;
    root.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = '1';
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { if (el) el.style.opacity = '0'; }, 1800);
}

// ═══════════════════════════════════════════════════════════
// 日期 / 大小格式化
// ═══════════════════════════════════════════════════════════
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 副标题里的日期：今天→HH:MM；今年→Jul 15 / 7月15日；更早→2024/5/6（与截图一致） */
export function useDateFormat() {
  const locale = useLocale();
  const en = locale !== 'zh-Hans';
  return (ts: number) => {
    if (!ts) return '';
    const d = TimeService.fromTimestamp(ts);
    const now = TimeService.getDate();
    const sameDay = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    if (sameDay) return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    if (d.getFullYear() === now.getFullYear()) {
      return en ? `${MONTHS_EN[d.getMonth()]} ${d.getDate()}` : `${d.getMonth() + 1}月${d.getDate()}日`;
    }
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  };
}

export function formatSize(bytes: number) {
  if (bytes <= 0) return '—';
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

export function formatTemplate(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));
}

// ═══════════════════════════════════════════════════════════
// 文件类型图标
// ═══════════════════════════════════════════════════════════
const TYPE_MAP: Record<ItemKind, { Icon: typeof IcFileGeneric; color: string }> = {
  folder: { Icon: IcFolder, color: GD.typeFolder },
  doc: { Icon: IcFileDoc, color: GD.typeDoc },
  sheet: { Icon: IcFileSheet, color: GD.typeSheet },
  slide: { Icon: IcFileSlide, color: GD.typeSlide },
  pdf: { Icon: IcFilePdf, color: GD.typePdf },
  image: { Icon: IcFileImage, color: GD.typePdf },
  other: { Icon: IcFileGeneric, color: GD.typeDoc },
};

/** 只按类型画图标（本机文件选择器用 —— 那里的条目不是 DriveItem） */
export const FileTypeGlyph: React.FC<{ kind: ItemKind; size?: number }> = ({ kind, size = DIM.itemIcon }) => {
  const { Icon, color } = TYPE_MAP[kind];
  return <Icon size={size} color={color} />;
};

export const ItemIcon: React.FC<{ item: DriveItem; size?: number }> = ({ item, size = DIM.itemIcon }) => {
  const { Icon, color } = TYPE_MAP[item.kind];
  // 文件夹三种呈现：改过颜色=实心彩色；已共享=深灰内嵌人像；普通=深灰（design-tokens §1.4）
  const isFolder = item.kind === 'folder';
  const fill = isFolder ? (item.color ?? GD.typeFolder) : 'none';
  return (
    <span className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <Icon size={size} color={isFolder ? fill : color} fill={isFolder ? fill : 'none'} strokeWidth={isFolder ? 1.5 : 2} />
      {isFolder && item.sharedFolder && (
        <span className="absolute inset-0 flex items-center justify-center pt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
        </span>
      )}
    </span>
  );
};

// ═══════════════════════════════════════════════════════════
// 底部弹层：三条关闭通路 —— 点遮罩 / 下滑 / 系统返回键（全部 bindBack）
// ═══════════════════════════════════════════════════════════
export const BottomSheet: React.FC<{
  children: React.ReactNode;
  /** 可上拖展开为全屏（文件 ⋮ 菜单用，IMG_2291） */
  expandable?: boolean;
  header?: React.ReactNode;
}> = ({ children, expandable = false, header }) => {
  const { bindBack, back } = useGoogleDriveGestures();
  const [expanded, setExpanded] = useState(false);
  const startY = useRef<number | null>(null);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    startY.current = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const from = startY.current;
    startY.current = null;
    if (from === null) return;
    const dy = e.clientY - from;
    if (dy > 56) {
      // 下滑：先收起展开态，已是收起态则关闭整个弹层
      if (expandable && expanded) setExpanded(false);
      else back();
    } else if (dy < -56 && expandable && !expanded) {
      setExpanded(true);
    }
  };

  return (
    <div data-gd-overlay="sheet" className="absolute inset-0 z-[200] flex flex-col justify-end">
      <div {...bindBack()} className="absolute inset-0" style={{ background: GD.scrim }} />
      <div
        className="relative bg-white flex flex-col overflow-hidden"
        style={{
          borderTopLeftRadius: DIM.sheetRadius,
          borderTopRightRadius: DIM.sheetRadius,
          maxHeight: expanded ? '100%' : '72%',
          height: expanded ? '100%' : undefined,
          paddingTop: expanded ? DIM.pagePadding + 24 : 0,
        }}
      >
        <div
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => { startY.current = null; }}
          className="shrink-0"
          style={{ touchAction: 'none' }}
        >
          {expanded && (
            <button {...bindBack()} className="absolute left-3 top-9 w-10 h-10 flex items-center justify-center">
              <IcClose size={22} color={GD.text} />
            </button>
          )}
          {header}
        </div>
        <div
          className="flex-1 overflow-y-auto"
          data-scroll-container="main"
          data-scroll-direction="vertical"
        >
          {children}
        </div>
        <div className="h-4 shrink-0" />
      </div>
    </div>
  );
};

/** 弹层头部：对象自身（图标 + 名称）+ 分隔线 */
export const SheetHeader: React.FC<{ item: DriveItem; subtitle?: string }> = ({ item, subtitle }) => (
  <div className="flex items-center gap-3 px-4 py-4" style={{ borderBottom: `1px solid ${GD.divider}` }}>
    <ItemIcon item={item} size={24} />
    <div className="min-w-0">
      <div className="text-[15px] truncate" style={{ color: GD.text }}>{item.name}</div>
      {subtitle && <div className="text-[12px] truncate" style={{ color: GD.textSecondary }}>{subtitle}</div>}
    </div>
  </div>
);

/** 弹层菜单项：56 高，线性图标 */
export const SheetItem: React.FC<{
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  badge?: string;
  disabled?: boolean;
  danger?: boolean;
  bind?: BindProps;
  onClick?: () => void;
}> = ({ icon: Icon, label, badge, disabled, danger, bind, onClick }) => (
  <button
    disabled={disabled}
    {...(onClick ? { onClick } : {})}
    {...(bind ?? {})}
    className="w-full flex items-center gap-4 px-4 text-left active:bg-black/5 disabled:active:bg-transparent"
    style={{ height: DIM.sheetItemH, opacity: disabled ? 0.38 : 1 }}
  >
    <Icon size={22} color={danger ? GD.danger : GD.textSecondary} />
    <span className="text-[15px] flex-1 truncate" style={{ color: danger ? GD.danger : GD.text }}>{label}</span>
    {badge && (
      <span className="text-[11px] px-2 py-0.5 rounded-full text-white shrink-0" style={{ background: GD.blueStrong }}>
        {badge}
      </span>
    )}
  </button>
);

// ═══════════════════════════════════════════════════════════
// 居中对话框：点遮罩 / 返回键关闭（无下滑 —— 居中层拖不动）
// ═══════════════════════════════════════════════════════════
export const CenterDialog: React.FC<{ children: React.ReactNode; wide?: boolean }> = ({ children, wide }) => {
  const { bindBack } = useGoogleDriveGestures();
  return (
    <div data-gd-overlay="dialog" className="absolute inset-0 z-[220] flex items-center justify-center px-6">
      <div {...bindBack()} className="absolute inset-0" style={{ background: GD.scrim }} />
      {/*
        data-keep-keyboard：重命名 / 新建文件夹这类带输入框的对话框，键盘是弹起的。
        不声明的话，点「创建」的第一下会被 OS 用来收起键盘、动作不执行，
        用户得点两下才生效。遮罩不加这个属性 —— 点遮罩本来就是关闭。
      */}
      <div
        data-keep-keyboard="true"
        className="relative bg-white w-full overflow-hidden"
        style={{ borderRadius: DIM.dialogRadius, maxWidth: wide ? 320 : 300 }}
      >
        {children}
      </div>
    </div>
  );
};

/** 对话框右下角的文字按钮组 */
export const DialogActions: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex justify-end items-center gap-2 px-4 pb-4 pt-2">{children}</div>
);

export const DialogTextButton: React.FC<{
  label: string;
  danger?: boolean;
  disabled?: boolean;
  bind?: BindProps;
  onClick?: () => void;
}> = ({ label, danger, disabled, bind, onClick }) => (
  <button
    disabled={disabled}
    {...(onClick ? { onClick } : {})}
    {...(bind ?? {})}
    className="px-3 py-2 text-[14px] font-medium rounded-full active:bg-black/5"
    style={{ color: danger ? GD.danger : GD.blue, opacity: disabled ? 0.38 : 1 }}
  >
    {label}
  </button>
);

// ═══════════════════════════════════════════════════════════
// 列表行 / 网格卡片
// ═══════════════════════════════════════════════════════════
/**
 * 双行列表行，72 高、无分隔线（design-tokens：列表行之间是纯白，靠留白分隔）。
 * tapProps / menuProps / longPressProps 都由调用处绑定好再传进来 ——
 * 平台规则要求 transitionId 在调用处是字面量，不能在共享组件里按 prop 拼。
 */
export const ItemRow: React.FC<{
  item: DriveItem;
  subtitle: string;
  starred?: boolean;
  offline?: boolean;
  selected?: boolean;
  selectMode?: boolean;
  tapProps?: BindProps;
  menuProps?: BindProps;
  longPressProps?: BindProps;
  onTap?: () => void;
}> = ({ item, subtitle, starred, offline, selected, selectMode, tapProps, menuProps, longPressProps, onTap }) => (
  <div
    {...(tapProps ?? {})}
    {...(longPressProps ?? {})}
    {...(onTap ? { onClick: onTap } : {})}
    className="flex items-center active:bg-black/5"
    style={{
      height: DIM.rowH,
      paddingLeft: DIM.itemIconLeft,
      paddingRight: 4,
      background: selected ? GD.blueSurface : undefined,
    }}
  >
    {selectMode ? (
      <span
        className="shrink-0 flex items-center justify-center rounded-sm"
        style={{
          width: 20, height: 20,
          border: `2px solid ${selected ? GD.blue : GD.textSecondary}`,
          background: selected ? GD.blue : 'transparent',
        }}
      >
        {selected && <span className="text-white text-[13px] leading-none">✓</span>}
      </span>
    ) : (
      <ItemIcon item={item} />
    )}
    <div className="flex-1 min-w-0 ml-4">
      <div className="text-[15px] truncate" style={{ color: GD.text }}>{item.name}</div>
      <div className="flex items-center gap-1 mt-0.5">
        {starred && <IcStar size={13} color={GD.textSecondary} fill={GD.textSecondary} />}
        {offline && <IcOffline size={13} color={GD.textSecondary} />}
        <span className="text-[12px] truncate" style={{ color: GD.textSecondary }}>{subtitle}</span>
      </div>
    </div>
    {!selectMode && menuProps && (
      <button
        {...menuProps}
        // 行本身带长按进多选。⋮ 的 stopPropagation 只作用于 click，
        // pointerdown 仍会冒泡上去启动长按计时器，所以这里必须单独截断指针事件。
        onPointerDown={e => e.stopPropagation()}
        onPointerUp={e => e.stopPropagation()}
        className="w-11 h-11 flex items-center justify-center shrink-0"
        aria-label="more"
      >
        <IcMore size={20} color={GD.textSecondary} />
      </button>
    )}
  </div>
);

/** 网格卡片：标题在缩略图上方（IMG_2249 确认，与常见「图上题下」相反） */
export const ItemCard: React.FC<{
  item: DriveItem;
  tapProps?: BindProps;
  menuProps?: BindProps;
  longPressProps?: BindProps;
}> = ({ item, tapProps, menuProps, longPressProps }) => (
  <div className="rounded-lg overflow-hidden border" style={{ borderColor: GD.divider }}>
    <div className="flex items-center gap-2 px-2 py-2">
      <ItemIcon item={item} size={18} />
      <span className="text-[12px] flex-1 truncate" style={{ color: GD.text }}>{item.name}</span>
      {menuProps && (
        <button
          {...menuProps}
          onPointerDown={e => e.stopPropagation()}
          onPointerUp={e => e.stopPropagation()}
          className="w-6 h-6 flex items-center justify-center shrink-0"
          aria-label="more"
        >
          <IcMore size={16} color={GD.textSecondary} />
        </button>
      )}
    </div>
    <div
      {...(tapProps ?? {})}
      {...(longPressProps ?? {})}
      className="h-24 flex items-center justify-center"
      style={{ background: GD.cardBg }}
    >
      <ItemIcon item={item} size={36} />
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════
// 排序条：左侧字段 chip（箭头带蓝色圆底）+ 右侧视图切换
// ═══════════════════════════════════════════════════════════
export const SortBar: React.FC<{
  label: string;
  order: SortOrder;
  view: 'list' | 'grid';
  sortProps?: BindProps;
  onToggleView?: () => void;
  toggleA11y: string;
}> = ({ label, order, view, sortProps, onToggleView, toggleA11y }) => (
  <div className="flex items-center justify-between" style={{ paddingLeft: DIM.pagePadding, paddingRight: 8, height: 44 }}>
    <button {...(sortProps ?? {})} data-gd-sortchip className="flex items-center gap-2 active:opacity-60">
      <span className="text-[13px]" style={{ color: GD.text }}>{label}</span>
      <span
        className="flex items-center justify-center rounded-full"
        style={{ width: DIM.iconButton, height: DIM.iconButton, background: GD.blueSurface }}
      >
        {order === 'asc' ? <IcSortAsc size={16} color={GD.blue} /> : <IcSortDesc size={16} color={GD.blue} />}
      </span>
    </button>
    <button
      data-action="googledrive.view.toggle"
      onClick={onToggleView}
      className="w-11 h-11 flex items-center justify-center"
      aria-label={toggleA11y}
    >
      {view === 'list'
        ? <IcViewGrid size={20} color={GD.textSecondary} />
        : <IcViewList size={20} color={GD.textSecondary} />}
    </button>
  </div>
);

// ═══════════════════════════════════════════════════════════
// 空态
// ═══════════════════════════════════════════════════════════
/**
 * 空态。用 h-full 而不是 flex-1 —— 常驻 Tab 页的容器是普通 block（只给了 height:100%），
 * flex-1 在非 flex 父级里不生效，会把插画顶到页面上方。
 */
export const EmptyState: React.FC<{
  icon: React.ComponentType<{ size?: number; color?: string }>;
  title: string;
  desc?: string;
  children?: React.ReactNode;
}> = ({ icon: Icon, title, desc, children }) => (
  <div className="flex-1 h-full flex flex-col items-center justify-center px-10 text-center gap-3">
    <Icon size={64} color={GD.divider} />
    <div className="text-[16px]" style={{ color: GD.text }}>{title}</div>
    {desc && <div className="text-[13px] leading-relaxed" style={{ color: GD.textSecondary }}>{desc}</div>}
    {children}
  </div>
);

/** 子页面顶栏：✕ / < 返回 + 标题 + 右侧插槽 */
export const SubPageBar: React.FC<{
  title: string;
  closeIcon?: 'x' | 'back';
  right?: React.ReactNode;
  a11yClose: string;
}> = ({ title, closeIcon = 'x', right, a11yClose }) => {
  const { bindBack } = useGoogleDriveGestures();
  return (
    <div className="flex items-center shrink-0" style={{ height: DIM.topBarH, paddingLeft: 4, paddingRight: 8 }}>
      <button {...bindBack()} className="w-11 h-11 flex items-center justify-center" aria-label={a11yClose}>
        {closeIcon === 'x'
          ? <IcClose size={22} color={GD.text} />
          : <span className="text-[22px] leading-none" style={{ color: GD.text }}>‹</span>}
      </button>
      <span className="text-[18px] flex-1 truncate ml-1" style={{ color: GD.text }}>{title}</span>
      {right}
    </div>
  );
};
