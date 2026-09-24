// apps/Tencentvideo/components/search.tsx —— 搜索族(hub/suggest/result/empty)+ 筛选页共用件。
// 证据:843/858/f_005/f_034(搜索中间页)、f_013/f_014(联想)、f_020/f_024/f_028(结果)、
// f_032(空态)、795/794/796/749(筛选页)。
// 绑定纪律与 cards.tsx 一致:组件自身不绑任何 id,全部由页面以 BindProps 传入(硬规则2/8)。
import React from 'react';
import { TV_COLORS as C } from '../constants';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import type { TvContent } from '../types';
import { TvImg } from './Img';
import { Badge, BindProps } from './ui';
import { IcClose, IcMic, IcSearch } from '../res/icons';

/** 片名/演员是否与搜索词对上(双方都 trim;空词永不命中)。 */
function contentMatchesQuery(c: TvContent, q: string): boolean {
  const word = q.trim();
  if (!word) return false;
  if (c.title.includes(word) || word.includes(c.title)) return true;
  return (c.cast ?? []).some((m) => m.name.includes(word) || word.includes(m.name));
}

/**
 * 主命中内容:优先最长片名命中,其次演员名命中。无命中返回 undefined ——
 * 禁止回落 contents[0],否则乱码词会落到「千芳劫」这类库首条。
 */
export function findSearchHit(contents: TvContent[], q: string): TvContent | undefined {
  let hit: TvContent | undefined;
  for (const c of contents) {
    if (!contentMatchesQuery(c, q)) continue;
    if (!hit || c.title.length > hit.title.length) hit = c;
  }
  return hit;
}

/**
 * 词能不能命中内容库:命中 → 结果页,不命中 → 空结果页(证据 f_032「aizbs」)。
 * hub / 联想 / 结果页共用同一口径。
 */
export const searchHasMatch = (contents: TvContent[], q: string): boolean =>
  findSearchHit(contents, q) !== undefined;

/* ---------- 顶部搜索条(4 个搜索页共用) ---------- */

export interface SearchTopBarProps {
  /** 输入框当前值(单一来源 = store.search.input) */
  value: string;
  placeholder: string;
  /** 输入变化回调;不传 = 只读展示(结果/空态页的词条形态也可编辑,真机就是同一个框) */
  onValueChange?: (v: string) => void;
  /** 键盘搜索键(Enter)提交 */
  onSubmit?: () => void;
  /**
   * 输入框自身的 actionId(spec 里 behavior:'input' 的那条,如 search.suggest.refresh)。
   * 走 data-action + data-action-type="input",与 apps/Keep 搜索页同约定。
   */
  inputActionId?: string;
  /** 右侧语音 icon(仅 hub 有,证据 843) */
  voiceBind?: BindProps;
  /** 右侧清除 ×(有词时出现,证据 f_013/f_020/f_032) */
  clearBind?: BindProps;
  /** 「取消」= bindBack()(平台合同硬规则1) */
  cancelBind: BindProps;
  cancelLabel: string;
  /** 自动聚焦(hub/suggest 进页即弹键盘,证据 843 键盘弹起态) */
  autoFocus?: boolean;
}

export function SearchTopBar({
  value,
  placeholder,
  onValueChange,
  onSubmit,
  inputActionId,
  voiceBind,
  clearBind,
  cancelBind,
  cancelLabel,
  autoFocus = false,
}: SearchTopBarProps) {
  const s = useTencentvideoStrings();
  return (
    <div
      className="flex items-center gap-1 px-3 py-2 shrink-0"
      style={{ background: C.pageBg }}
      // 键盘配件:点清空/语音/取消时键盘别收,收了这条会移位、点空
      data-keep-keyboard="true"
    >
      <div
        className="flex-1 min-w-0 flex items-center gap-1.5 h-9 rounded-full px-3"
        style={{ background: C.chipGray }}
      >
        <IcSearch size={15} className="shrink-0" />
        <input
          {...(inputActionId ? { 'data-action': inputActionId, 'data-action-type': 'input' } : {})}
          value={value}
          readOnly={!onValueChange}
          onChange={(e) => onValueChange?.(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSubmit?.();
          }}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="flex-1 min-w-0 bg-transparent border-none outline-none text-[14px]"
          style={{ color: C.text }}
        />
        {clearBind && (
          <button
            {...clearBind}
            className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center border-none text-white"
            style={{ background: C.divider }}
            aria-label={s.searchClear}
          >
            <IcClose size={11} />
          </button>
        )}
        {voiceBind && (
          <button
            {...voiceBind}
            className="shrink-0 bg-transparent border-none p-0"
            style={{ color: C.textSub }}
            aria-label={s.searchVoice}
          >
            <IcMic size={16} />
          </button>
        )}
      </div>
      <button
        {...cancelBind}
        className="shrink-0 bg-transparent border-none px-2 text-[15px]"
        style={{ color: C.text }}
      >
        {cancelLabel}
      </button>
    </div>
  );
}

/* ---------- 命中词高亮(联想页前缀命中 / 结果页主命中片名) ---------- */

/**
 * 命中片段染色。联想页命中字是橙红(证据 f_013「快」字),结果页主命中片名是品牌青
 * (证据 f_020 片名「逐玉」整条青色)—— 所以 color 由调用方给。
 * 搜索词比片名长时(如「这一刻心动大结局」vs 片名「这一刻心动」)整名算命中,与真机一致。
 */
export function HighlightText({
  text,
  keyword,
  color = C.badgeOrange,
  className,
}: {
  text: string;
  keyword: string;
  color?: string;
  className?: string;
}) {
  const kw = keyword.trim();
  if (!kw) return <span className={className}>{text}</span>;
  if (kw.length >= text.length && kw.toLowerCase().includes(text.toLowerCase())) {
    return <span className={className} style={{ color }}>{text}</span>;
  }
  const at = text.toLowerCase().indexOf(kw.toLowerCase());
  if (at < 0) return <span className={className}>{text}</span>;
  return (
    <span className={className}>
      {text.slice(0, at)}
      <span style={{ color }}>{text.slice(at, at + kw.length)}</span>
      {text.slice(at + kw.length)}
    </span>
  );
}

/* ---------- 文本 tab 行(hub 榜单/找片、result 全部/影视/…) ---------- */

export function TextTabRow({
  tabs,
  activeTab,
  getTabBind,
  right,
  size = 'lg',
  className,
}: {
  tabs: readonly string[];
  activeTab: string;
  getTabBind: (tab: string) => BindProps;
  /** 行尾插槽(result 页右侧「反馈」按钮,证据 f_020) */
  right?: React.ReactNode;
  /** lg = hub 双 tab(17px);sm = result 六 tab(14px) */
  size?: 'lg' | 'sm';
  className?: string;
}) {
  return (
    <div className={`flex items-center shrink-0 ${className ?? ''}`}>
      <div
        className={`flex-1 min-w-0 flex items-center overflow-x-auto scrollbar-none px-3 ${
          size === 'lg' ? 'gap-5 py-1.5' : 'gap-4 py-2'
        }`}
        data-scroll-container="searchTabs"
        data-scroll-direction="horizontal"
      >
        {tabs.map((t) => {
          const active = t === activeTab;
          return (
            <button
              key={t}
              {...getTabBind(t)}
              className={`shrink-0 bg-transparent border-none p-0 whitespace-nowrap ${
                size === 'lg'
                  ? active
                    ? 'text-[17px] font-bold'
                    : 'text-[16px]'
                  : active
                    ? 'text-[15px] font-bold'
                    : 'text-[14px]'
              }`}
              style={{ color: active ? C.text : C.textSub }}
            >
              {t}
            </button>
          );
        })}
      </div>
      {right && <div className="shrink-0 pr-3">{right}</div>}
    </div>
  );
}

/* ---------- 三列宫格结果卡(hub 找片 / 空态推荐 / 筛选结果) ---------- */

export interface GridResultCardProps {
  content: TvContent;
  bind?: BindProps;
  /** 左上角年份(证据 f_034/795:海报左上白色小字年份) */
  showYear?: boolean;
  /** 是否露出片名;空搜推荐架关掉,避免种子片名当「伪命中」 */
  showTitle?: boolean;
  /** 右下角文案(缺省自动:更新至N集/全N集) */
  cornerNote?: string;
  /** 左下角文案(短剧结果卡的热度值,证据 749「🔥10480」) */
  cornerLeft?: string;
  /** 标题下副标题(缺省 content.recommend);传空串可隐藏 */
  subtitle?: React.ReactNode;
  /** 副标题下的 chip(榜单/讨论/评分,证据 795「讨论破500万」「评分9.4」) */
  chip?: React.ReactNode;
  className?: string;
}

/** 结果卡右下角文案:多集给更新进度/总集数(证据 795「更新至29集」「全18集」)。 */
export function gridCornerNote(content: TvContent): string {
  const total = content.episodes ?? 0;
  if (total <= 1) return '';
  const upTo = content.updatedTo ?? total;
  return upTo < total ? `更新至${String(upTo).padStart(2, '0')}集` : `全${total}集`;
}

export function GridResultCard({
  content,
  bind,
  showYear = true,
  showTitle = true,
  cornerNote,
  cornerLeft,
  subtitle,
  chip,
  className,
}: GridResultCardProps) {
  const note = cornerNote === undefined ? gridCornerNote(content) : cornerNote;
  const sub = subtitle === undefined
    ? (showTitle ? (content.recommend ?? content.tags.join(' ')) : '')
    : subtitle;
  return (
    <div className={`flex flex-col min-w-0 ${className ?? ''}`}>
      <div {...(bind ?? {})} className="flex flex-col min-w-0 cursor-pointer">
        <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden">
          <TvImg
            id={content.poster}
            alt={showTitle ? content.title : '推荐内容'}
            className="w-full h-full object-cover"
          />
          {showYear && content.year !== undefined && (
            <span
              className="absolute top-0 left-0 px-1 py-[1px] text-[10px] leading-[14px] text-white rounded-br-[6px]"
              style={{ background: C.maskBadge }}
            >
              {content.year}
            </span>
          )}
          {content.badge && (
            <div className="absolute top-0 right-0">
              <Badge
                text={content.badge}
                className="rounded-none rounded-bl-[6px] rounded-tr-[8px]"
              />
            </div>
          )}
          {(note || cornerLeft) && (
            <div
              className="absolute bottom-0 inset-x-0 flex items-end justify-between gap-1 px-1 pb-0.5 pt-4 text-[10px] leading-none text-white"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }}
            >
              <span className="truncate">{cornerLeft ?? ''}</span>
              <span className="shrink-0">{note}</span>
            </div>
          )}
        </div>
        {showTitle && (
          <div className="mt-1.5 text-[13px] font-medium truncate" style={{ color: C.text }}>
            {content.title}
          </div>
        )}
        {sub && (
          <div className="mt-0.5 text-[11px] truncate" style={{ color: C.textSub }}>
            {sub}
          </div>
        )}
      </div>
      {chip && <div className="mt-1 flex items-center gap-1 overflow-hidden">{chip}</div>}
    </div>
  );
}

/* ---------- 维度行(筛选页 类型/资费/地区/年份…;hub 找片 分类/类型/排序) ---------- */

export interface FacetRowProps {
  /** 左侧维度名(证据 795 淡青胶囊 / f_034 灰色纯文字);不传 = 无标签的纯选项行 */
  label?: string;
  options: readonly string[];
  active: string;
  getBind: (option: string) => BindProps;
  /** 选项显示文案(缺省 = option 本身) */
  getLabel?: (option: string) => string;
  /**
   * pill = 筛选页样式:维度名与选中项都是淡青胶囊(证据 795/794/796/749);
   * text = 搜索页「找片」样式:维度名灰色纯文字、选中项只染青字不带底(证据 f_034)。
   */
  variant?: 'pill' | 'text';
  className?: string;
}

export function FacetRow({ label, options, active, getBind, getLabel, variant = 'pill', className }: FacetRowProps) {
  const pill = variant === 'pill';
  return (
    <div className={`flex items-center gap-2 px-3 py-1 ${className ?? ''}`}>
      {label && (
        <span
          className={`shrink-0 text-[12px] leading-[16px] ${pill ? 'px-2 py-[3px] rounded-md' : ''}`}
          style={pill ? { background: C.primaryBg, color: C.primary } : { color: C.textSub }}
        >
          {label}
        </span>
      )}
      <div
        className="flex-1 min-w-0 flex items-center gap-1 overflow-x-auto scrollbar-none"
        data-scroll-container="facets"
        data-scroll-direction="horizontal"
      >
        {options.map((o) => {
          const on = o === active;
          return (
            <button
              key={o}
              {...getBind(o)}
              className="shrink-0 px-2 py-[3px] rounded-md text-[13px] leading-[16px] border-none whitespace-nowrap"
              style={
                on
                  ? { background: pill ? C.primaryBg : 'transparent', color: C.primary }
                  : { background: 'transparent', color: C.text }
              }
            >
              {getLabel ? getLabel(o) : o}
            </button>
          );
        })}
      </div>
    </div>
  );
}
