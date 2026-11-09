// apps/Tencentvideo/components/detailExtra.tsx —— 详情族剩余页面(电影/剧场版/体育/二创/
// 讨论/评论/选集弹层)共用的积木,补 components/detail.tsx 没覆盖的形态。
// 视觉证据:804/810(剧场版:黑条「立即播放」+ tab 行右侧金按钮 + 宽标题选集 chip)、
// 775(体育:只读播放器控件行)、805/808(二创/讨论沿用宿主详情页黑条 + tab 行)、
// 803/806(选集/评论弹层:顶部蒙层 + 「标题 + ∨」面板头 + 底部输入条)。
// 绑定纪律同 detail.tsx:组件自身不含任何 actionId/transitionId,全部由页面字面量传入。
import React from 'react';
import { TV_COLORS as C } from '../constants';
import { TvImg } from './Img';
import { BindProps } from './ui';
import { fmtTime } from './PlayerCore';
import { IcArrowDown, IcNavBack, IcPlay, IcTv } from '../res/icons';

/* ---------- 宿主详情页黑条(未展开播放器形态) ---------- */

/**
 * 详情页顶部黑条:返回 ‹ +「▶ 立即播放」+ 右侧 TV 投屏(证据 804/805/808/803/806)。
 * 剧场版未播态是它;二创/讨论 tab 页沿用宿主页的同一条黑条。
 * playBind 缺省时中间只渲染静态文案(该页没有「开始播放」这条交互)。
 */
export function DetailHostBar({
  backBind,
  playLabel,
  playBind,
  castBind,
}: {
  backBind?: BindProps;
  playLabel: string;
  playBind?: BindProps;
  castBind?: BindProps;
}) {
  const playInner = (
    <>
      <IcPlay size={15} />
      <span className="text-[15px] font-medium">{playLabel}</span>
    </>
  );
  return (
    <div className="shrink-0 flex items-center h-12 px-2" style={{ background: C.darkBg }}>
      <button
        {...(backBind ?? {})}
        className="bg-transparent border-none p-1 text-white"
        aria-label="返回"
      >
        <IcNavBack size={22} />
      </button>
      <div className="flex-1 flex justify-center min-w-0">
        {playBind ? (
          <button
            {...playBind}
            className="flex items-center gap-1.5 bg-transparent border-none p-0 text-white"
          >
            {playInner}
          </button>
        ) : (
          <span className="flex items-center gap-1.5 text-white/85">{playInner}</span>
        )}
      </div>
      <div className="w-8 flex justify-end">
        {castBind && (
          <button
            {...castBind}
            className="bg-transparent border-none p-1 text-white"
            aria-label="投屏"
          >
            <IcTv size={19} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------- 详情 tab 行(右侧带金色 CTA) ---------- */

/**
 * 详情/二创/讨论 tab 行 + 右侧金色 CTA(证据 804「开通SVIP」/ 775「特惠开体育VIP」)。
 * getTabBind 返回 undefined 时该 tab 渲染为纯文本 —— 二创/讨论是独立路由,
 * 彼此之间没有申报过 transition,不做成点了没反应的假按钮(同 detail.tsx 的口径)。
 */
export function DetailSubTabRow({
  tabs,
  activeTab,
  badges,
  getTabBind,
  ctaLabel,
  ctaBind,
}: {
  tabs: readonly string[];
  activeTab: string;
  badges?: Record<string, string | undefined>;
  getTabBind: (tab: string, index: number) => BindProps | undefined;
  ctaLabel?: string;
  ctaBind?: BindProps;
}) {
  return (
    <div className="shrink-0 flex items-center gap-3 px-3 pt-3 pb-2" style={{ background: C.pageBg }}>
      <div
        className="flex-1 min-w-0 flex items-end gap-4 overflow-x-auto scrollbar-none"
        data-scroll-container="detailTabs"
        data-scroll-direction="horizontal"
      >
        {tabs.map((t, i) => {
          const active = t === activeTab;
          const badge = badges?.[t];
          const bind = getTabBind(t, i);
          const cls = `shrink-0 relative whitespace-nowrap ${active ? 'text-[18px] font-bold' : 'text-[16px]'}`;
          const style = { color: active ? C.text : C.textSub };
          const inner = (
            <>
              {t}
              {badge && (
                <span
                  className="absolute -top-1.5 -right-3 text-[9px] font-semibold leading-none"
                  style={{ color: C.redDot }}
                >
                  {badge}
                </span>
              )}
            </>
          );
          return bind ? (
            <button key={t} {...bind} className={`${cls} bg-transparent border-none p-0`} style={style}>
              {inner}
            </button>
          ) : (
            <span key={t} className={cls} style={style}>
              {inner}
            </span>
          );
        })}
      </div>
      {ctaLabel && ctaBind && (
        <button
          {...ctaBind}
          className="shrink-0 rounded-full border-none px-3.5 py-1.5 text-[13px] font-semibold"
          style={{
            background: `linear-gradient(to bottom, ${C.goldBtnFrom}, ${C.goldBtnTo})`,
            color: C.goldBtnText,
          }}
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}

/* ---------- 只读播放器控件行 ---------- */

/**
 * 只读控件行:播放态图标 + 时间码 + 进度条(证据 775/810)。
 * 体育/剧场版详情页的控件行在 spec 里没有对应交互(不像剧集/电影可整块进竖屏播放态),
 * 所以这里全部渲染为静态元素,不做可点按钮 —— 避免「可见可点但点了没反应」。
 */
export function StaticPlayerControlRow({
  playing,
  positionSec,
  durationSec,
}: {
  playing: boolean;
  positionSec: number;
  durationSec: number;
}) {
  const pct = durationSec > 0 ? Math.min(100, (positionSec / durationSec) * 100) : 0;
  return (
    <div className="flex items-center gap-2 px-2.5 pb-1.5 text-white">
      <span className="shrink-0 p-0.5">
        {playing ? (
          <span className="flex gap-[3px] items-center h-[18px]">
            <span className="w-[3px] h-[14px] bg-white rounded-[1px]" />
            <span className="w-[3px] h-[14px] bg-white rounded-[1px]" />
          </span>
        ) : (
          <IcPlay size={18} />
        )}
      </span>
      <span className="text-[11px] tabular-nums shrink-0">{fmtTime(positionSec)}</span>
      <div className="flex-1 min-w-0">
        <div className="h-[3px] rounded-full overflow-hidden" style={{ background: C.progressRest }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: C.primarySoft }} />
        </div>
      </div>
      <span className="text-[11px] tabular-nums shrink-0">{fmtTime(durationSec)}</span>
      <span
        className="shrink-0 rounded-[4px] border px-1 py-[1px] text-[11px] leading-[13px]"
        style={{ borderColor: 'rgba(255,255,255,0.7)' }}
      >
        弹
      </span>
    </div>
  );
}

/* ---------- 弹层面板头 ---------- */

/** 弹层面板头:「选集 / 评论 N」+ 右侧 ∨ 收起(证据 803/806)。 */
export function PanelHeader({
  title,
  note,
  closeBind,
}: {
  title: React.ReactNode;
  note?: string;
  closeBind?: BindProps;
}) {
  return (
    <div className="shrink-0 px-3 pt-3">
      <div className="flex items-center">
        <div className="flex-1 min-w-0 text-[17px] font-bold truncate" style={{ color: C.text }}>
          {title}
        </div>
        <button
          {...(closeBind ?? {})}
          className="shrink-0 bg-transparent border-none p-1"
          style={{ color: C.textSub }}
          aria-label="收起"
        >
          <IcArrowDown size={20} />
        </button>
      </div>
      {note && (
        <div className="text-[12px] pt-0.5" style={{ color: C.textSub }}>
          {note}
        </div>
      )}
    </div>
  );
}

/* ---------- 底部输入条 ---------- */

/**
 * 底部输入条:头像 + 输入框 + 右侧图标区(证据 806 评论弹层 / 808 讨论 tab)。
 * 输入框可以是真输入(评论页)也可以是整块可点的假输入(讨论页 @AI小助理,wontfix)。
 */
export function CommentInputBar({
  avatar,
  placeholder,
  value,
  onChangeValue,
  inputBind,
  rightSlot,
  trailing,
}: {
  avatar?: string;
  placeholder: string;
  /** 传入 value/onChangeValue = 真输入框;都不传 = 整条可点的假输入 */
  value?: string;
  onChangeValue?: (v: string) => void;
  inputBind?: BindProps;
  /** 输入框内右侧(表情 icon) */
  rightSlot?: React.ReactNode;
  /** 输入框外右侧(发送 / +) */
  trailing?: React.ReactNode;
}) {
  const editable = value !== undefined && onChangeValue !== undefined;
  return (
    <div
      className="shrink-0 flex items-center gap-2 px-3 py-2 border-t"
      style={{ background: C.pageBg, borderColor: C.chipGray }}
      // 键盘配件:按表情/发送时系统键盘不能收 —— 一收整条输入条掉回屏幕底部,这一下就点空了
      data-keep-keyboard="true"
    >
      <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
        <TvImg id={avatar} alt="我" className="w-full h-full object-cover" />
      </div>
      <div
        className="flex-1 min-w-0 flex items-center gap-2 rounded-full px-3 h-9"
        style={{ background: C.chipGray }}
      >
        {editable ? (
          <input
            value={value}
            onChange={(e) => onChangeValue(e.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
            className="flex-1 min-w-0 bg-transparent border-none outline-none text-[13px]"
            style={{ color: C.text }}
          />
        ) : (
          <button
            {...(inputBind ?? {})}
            className="flex-1 min-w-0 text-left bg-transparent border-none p-0 text-[13px] truncate"
            style={{ color: C.textSub }}
          >
            {placeholder}
          </button>
        )}
        {rightSlot}
      </div>
      {trailing}
    </div>
  );
}
