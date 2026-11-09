import React from 'react';
import { useDidiGestures } from '../hooks/useDidiGestures';
import { useDidiStrings } from '../hooks/useDidiStrings';
import { useDidiStore } from '../state';
import { isUnavailableMessage } from '../feedback';
import { IcNavBack } from '../res/icons';

/** 滴滴品牌色速查(manifest 主题外的辅助色) */
export const C = {
  orange: '#FF7D41',
  orangeDeep: '#FF5F00',
  green: '#04B578',
  blue: '#3C7CFC',
  dark: '#1A1A1A',
  sub: '#8A8F99',
  bgGray: '#F5F6FA',
  red: '#FF4D4F',
};

/** 顶栏。返回键统一 bindBack;right 可放 icon。 */
export function TopBar({
  title,
  right,
  showBack = true,
  transparent = false,
  titleTestId,
  automationLabel,
}: {
  title?: React.ReactNode;
  right?: React.ReactNode;
  showBack?: boolean;
  transparent?: boolean;
  titleTestId?: string;
  /** 固定中文基线，供自动化精确匹配（不受 locale 影响） */
  automationLabel?: string;
}) {
  const { bindBack } = useDidiGestures();
  const s = useDidiStrings();
  const titleTranslations: Record<string, string> = {
    亲友代付: s.titleFamilyPay,
    问题详情: s.titleQuestionDetail,
    填写信息: s.titleInvoiceForm,
    计价规则: s.titleFareRules,
    费用说明: s.titleFeeExplain,
    支付密码管理: s.titlePayPassword,
    滴滴客服: s.titleSupport,
    订单详情: s.titleOrderDetail,
    行程已结束: s.titleTripFinished,
    常用地址: s.titleAddress,
    支付设置: s.titlePaySettings,
    通用: s.titleGeneral,
    安全工具: s.titleSafety,
    支付方式: s.titlePayMethods,
    车主: s.titleOwner,
    个人信息: s.titleProfile,
    滴滴代驾: s.titleDriver,
    设置: s.titleSettings,
    紧急联系人: s.titleContacts,
    行程分享: s.titleTripShare,
    账号安全: s.accountSecurityTitle,
    永久注销账号: s.accountDelete,
    修改终点: s.titleChangeDestination,
    个人信息与权限: s.titlePrivacy,
    皮肤设置: s.titleSkin,
    订单筛选: s.titleTripsFilter,
    旅行: s.titleTravel,
    更多服务: s.servicesTitle,
  };
  const localizedTitle = typeof title === 'string'
    ? titleTranslations[title]
      ?? title.replace(/^对话\((\d+)\)$/, `${s.titleConversation} ($1)`)
    : title;
  return (
    <div
      className={`flex items-center h-11 px-2 shrink-0 ${
        transparent ? '' : 'border-b border-app-border bg-app-surface'
      }`}
    >
      <div className="w-12 flex items-center">
        {showBack && (
          <button
            {...bindBack()}
            className="flex items-center text-app-text bg-transparent border-none p-1"
            aria-label={s.back}
          >
            <IcNavBack size={22} />
          </button>
        )}
      </div>
      <h1
        data-testid={titleTestId}
        data-automation-label={automationLabel}
        data-page-title={typeof title === 'string' ? title : automationLabel}
        className="flex-1 text-center font-semibold text-app-text truncate text-[16px] m-0"
      >
        {localizedTitle}
      </h1>
      <div className="w-12 flex justify-end items-center gap-1">{right}</div>
    </div>
  );
}

/** 全局 Toast(store.lastToast,自动消失) */
export function Toast() {
  const msg = useDidiStore((s) => s.lastToast);
  const toast = useDidiStore((s) => s.toast);
  const needsConfirmation = Boolean(msg && isUnavailableMessage(msg));
  React.useEffect(() => {
    if (!msg || needsConfirmation) return;
    const t = setTimeout(() => toast(null), 2200);
    return () => clearTimeout(t);
  }, [msg, needsConfirmation, toast]);
  if (!msg) return null;
  if (needsConfirmation) {
    return (
      <div
        className="absolute inset-0 z-50 flex items-center justify-center bg-black/35 px-7"
        role="dialog"
        aria-modal="true"
        aria-labelledby="didi-unavailable-title"
        data-testid="didi-unavailable-dialog"
      >
        <div className="w-full max-w-[300px] rounded-lg bg-app-surface px-5 pb-4 pt-5 text-center shadow-xl">
          <div id="didi-unavailable-title" className="text-[17px] font-semibold text-app-text">功能暂未开放</div>
          <div className="mt-2 text-[14px] leading-relaxed text-app-text-muted">{msg}</div>
          <button
            type="button"
            onClick={() => toast(null)}
            className="mt-5 w-full rounded-full border-none py-2.5 text-[15px] font-semibold text-white"
            style={{ background: C.orange }}
            data-testid="didi-unavailable-confirm"
          >
            我知道了
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="absolute inset-x-0 bottom-24 flex justify-center pointer-events-none z-50">
      <div className="px-4 py-2 rounded-lg bg-black/80 text-white text-sm max-w-[80%] text-center">
        {msg}
      </div>
    </div>
  );
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-app-surface rounded-xl ${className}`}>{children}</div>;
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[13px] text-app-text-muted px-1 pt-3 pb-1.5">{children}</div>;
}

export function MissingData({ message }: { message: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
      <div className="text-[16px] font-semibold text-app-text">内容暂不可用</div>
      <div className="mt-2 text-[13px] leading-relaxed text-app-text-muted">{message}</div>
    </div>
  );
}

/** 设置类行:label + value + › */
export function Row({
  label,
  value,
  last = false,
  bind,
  onClick,
  arrow = true,
  danger = false,
}: {
  label: React.ReactNode;
  value?: React.ReactNode;
  last?: boolean;
  bind?: object;
  onClick?: () => void;
  arrow?: boolean;
  danger?: boolean;
}) {
  const merged: Record<string, unknown> = { ...(bind ?? {}) };
  if (onClick) merged.onClick = onClick;
  return (
    <button
      {...merged}
      className={`flex items-center w-full px-4 py-3.5 bg-transparent border-none text-left ${
        last ? '' : 'border-b border-app-border'
      }`}
    >
      <span className={`flex-1 text-[15px] ${danger ? 'text-red-500' : 'text-app-text'}`}>{label}</span>
      {value != null && <span className="text-[13px] text-app-text-muted mr-1">{value}</span>}
      {arrow && <span className="text-app-text-muted text-base">›</span>}
    </button>
  );
}

/** iOS 风格开关(带 data-action 绑定) */
export function Toggle({
  on,
  bind,
}: {
  on: boolean;
  bind?: object;
}) {
  return (
    <button
      {...(bind ?? {})}
      className="border-none bg-transparent p-0"
      role="switch"
      aria-checked={on}
    >
      <span
        className="inline-flex w-11 h-6.5 rounded-full p-0.5 transition-colors"
        style={{ background: on ? C.green : '#D9DBE0', height: 26, width: 46 }}
      >
        <span
          className="rounded-full bg-white transition-transform"
          style={{
            width: 22, height: 22, marginTop: 0,
            transform: on ? 'translateX(20px)' : 'translateX(0)',
            boxShadow: '0 1px 2px rgba(0,0,0,.2)',
          }}
        />
      </span>
    </button>
  );
}

export function ToggleRow({
  label,
  desc,
  on,
  bind,
  last = false,
}: {
  label: string;
  desc?: string;
  on: boolean;
  bind?: object;
  last?: boolean;
}) {
  return (
    <div className={`flex items-center px-4 py-3 ${last ? '' : 'border-b border-app-border'}`}>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] text-app-text">{label}</div>
        {desc && <div className="text-[12px] text-app-text-muted mt-0.5">{desc}</div>}
      </div>
      <Toggle on={on} bind={bind} />
    </div>
  );
}

/** 圆角主按钮(滴滴橙) */
export function OrangeBtn({
  children,
  bind,
  onClick,
  className = '',
  disabled = false,
}: {
  children: React.ReactNode;
  bind?: object;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}) {
  const merged: Record<string, unknown> = { ...(bind ?? {}) };
  if (onClick) merged.onClick = onClick;
  return (
    <button
      {...merged}
      disabled={disabled}
      className={`w-full py-3 rounded-full text-white text-[16px] font-medium border-none ${className}`}
      style={{ background: disabled ? '#FFC7A8' : C.orange }}
    >
      {children}
    </button>
  );
}

/** 分类 chip */
export function Chip({
  active,
  children,
  bind,
}: {
  active: boolean;
  children: React.ReactNode;
  bind?: object;
}) {
  return (
    <button
      {...(bind ?? {})}
      className="px-3 py-1.5 rounded-full text-[13px] border-none shrink-0"
      style={{
        background: active ? '#FFEFE5' : '#F5F6FA',
        color: active ? C.orangeDeep : '#666',
        fontWeight: active ? 600 : 400,
      }}
    >
      {children}
    </button>
  );
}

/** 勾选圆框(车型/发票行程勾选) */
export function CheckCircle({ checked }: { checked: boolean }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-md shrink-0"
      style={{
        width: 22, height: 22,
        background: checked ? C.orange : 'transparent',
        border: checked ? 'none' : '1.5px solid #D9DBE0',
        color: '#fff', fontSize: 14,
      }}
    >
      {checked ? '✓' : ''}
    </span>
  );
}

export const IMG_FALLBACK =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 80'><rect width='100' height='80' fill='%23EEF1FB'/></svg>";

/** 司机头像 SVG 占位(生图缺失时的兜底) */
export function driverAvatarSvg(name: string) {
  const ch = encodeURIComponent(name.slice(0, 1));
  return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'><rect width='80' height='80' rx='40' fill='%23E8EAF0'/><circle cx='40' cy='30' r='14' fill='%23AAB2C0'/><path d='M12 76c4-18 18-24 28-24s24 6 28 24' fill='%23AAB2C0'/><text x='40' y='74' font-size='0' >${ch}</text></svg>`;
}

/** 司机头像:优先生图 PNG(assets/avatars/),onError 回落 SVG(配合 imgFallback) */
const AVATAR_PNG: Record<string, string> = {
  柯: 'driver_ke', 蔡: 'driver_cai', 陈: 'driver_chen', 李: 'driver_li',
};
export function driverAvatar(name: string) {
  const key = AVATAR_PNG[(name || '').trim().slice(0, 1)] ?? 'driver_li';
  return `/@app-assets/Didi/avatars/${key}.png`;
}

/** img onError 兜底(PNG 缺失→SVG 占位,只降级一次) */
export function imgFallback(name: string) {
  return {
    onError: (e: React.SyntheticEvent<HTMLImageElement>) => {
      const t = e.currentTarget;
      if (t.dataset.fb) return;
      t.dataset.fb = '1';
      t.src = driverAvatarSvg(name);
    },
  };
}

/** 车型小图:优先生图 PNG(assets/cars/),onError 回落轿车 SVG */
const CAR_PNG: Record<string, string> = {
  c_surprise: 'car_economy', c_thrift: 'car_thrift', c_express: 'car_express',
  c_fast: 'car_fast', c_bus: 'car_pool', c_poolcheap: 'car_pool', c_poolfast: 'car_pool',
  c_pig: 'car_economy', c_taxi: 'car_taxi', c_premier: 'car_premier',
  c_luxury: 'car_luxury', c_six: 'car_six',
};
const CAR_SVG =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 24'><path d='M4 16c1-5 4-8 9-8h9c5 0 9 3 12 6l2 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2z' fill='%23E3E6EC'/><circle cx='12' cy='20' r='3' fill='%236B7280'/><circle cx='30' cy='20' r='3' fill='%236B7280'/></svg>";
export function CarImg({ typeId, className = '' }: { typeId: string; className?: string }) {
  const key = CAR_PNG[typeId];
  return (
    <img
      src={key ? `/@app-assets/Didi/cars/${key}.png` : CAR_SVG}
      alt=""
      className={`object-contain ${className}`}
      onError={(e) => {
        const t = e.currentTarget;
        if (t.dataset.fb) return;
        t.dataset.fb = '1';
        t.src = CAR_SVG;
      }}
    />
  );
}
