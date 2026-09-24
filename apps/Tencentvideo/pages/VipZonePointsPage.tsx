// 会员专区·花积分。节点 vip.zone.points(spec 13 条交互)。
// 视觉证据 746(顶部:账号条+订单入口/330积分/权益横条5项/积分抽好礼 banner)
// + 745(商品区:分类tab+搜商品/排序+复选/双列宫格,红包封面 300 积分 + 「会员专享」角标)。
// 积分读 user.points —— 收银台 mock 支付会加积分,这里跟着变(交活标准③)。
import React, { useMemo } from 'react';
import { useTencentvideoGestures } from '../hooks/useTencentvideoGestures';
import { useTencentvideoStore } from '../state';
import { TV_COLORS as C } from '../constants';
import { TvImg } from '../components/Img';
import { EmptyState } from '../components/ui';
import { ZoneAccountRow, ZoneTabRow } from '../components/vipzone';
import { IcCheck } from '../res/icons';

/** 离散 UI 态(走 store.ui,不进 URL) */
const UI_TAB = 'vip.zone.points.tab';
const UI_SORT = 'vip.zone.points.sort';
const UI_PURE = 'vip.zone.points.pureOnly';
const UI_AFFORDABLE = 'vip.zone.points.affordable';

/** membership.pointsMall 在 types.ts 是 Record<string, unknown>,按种子结构收窄 */
interface PointsMallSeed {
  points: number;
  tabs: string[];
  sorts: string[];
  banners: string[];
  lottery: string;
  items: { id: string; name: string; points: number; tag: string; img: string }[];
}

const TAG_PHYSICAL = '实物周边';
const TAG_MEMBER = '会员专享';

export default function VipZonePointsPage() {
  const { bindTap } = useTencentvideoGestures();

  const membership = useTencentvideoStore((s) => s.membership);
  const user = useTencentvideoStore((s) => s.user);
  const ui = useTencentvideoStore((s) => s.ui);
  const setUi = useTencentvideoStore((s) => s.setUi);
  const toggleUi = useTencentvideoStore((s) => s.toggleUi);

  const mall = membership.pointsMall as unknown as PointsMallSeed;
  const tab = String(ui[UI_TAB] ?? mall.tabs[0]);
  const sort = String(ui[UI_SORT] ?? mall.sorts[0]);
  const pureOnly = Boolean(ui[UI_PURE]);
  const affordableOnly = Boolean(ui[UI_AFFORDABLE]);

  const goods = useMemo(() => {
    let list = mall.items.slice();
    // 分类:种子只给了「会员专享/实物周边」两种 tag,红包封面归到虚拟周边
    if (tab === '会员权益') list = list.filter((g) => g.tag === TAG_MEMBER);
    else if (tab === TAG_PHYSICAL) list = list.filter((g) => g.tag === TAG_PHYSICAL);
    else if (tab === '虚拟周边') list = list.filter((g) => g.name.includes('红包封面'));
    // 「纯积分」= 不含实物邮费的纯积分兑换品;「我能兑」= 当前积分够兑
    if (pureOnly) list = list.filter((g) => g.tag !== TAG_PHYSICAL);
    if (affordableOnly) list = list.filter((g) => g.points <= user.points);
    if (sort === '积分') list = list.slice().sort((a, b) => a.points - b.points);
    // 种子没有销量字段,用 id 稳定排序占位(见报告「建议补的种子字段」)
    else if (sort === '销量') list = list.slice().sort((a, b) => a.id.localeCompare(b.id));
    return list;
  }, [mall.items, tab, sort, pureOnly, affordableOnly, user.points]);

  // 精简后的专区只保留有完整内容的「领权益 / 花积分」。当前页唯一可切换项是领权益。
  const tabBind = () => bindTap('vip.zone.rights.open.fromTab');

  const checkbox = (on: boolean, label: string, key: string) => (
    <button
      {...bindTap({ kind: 'action', id: 'vip.points.filter.toggle' }, {
        params: { filter: label },
        onTrigger: () => toggleUi(key),
      })}
      className="flex items-center gap-1 bg-transparent border-none p-0 text-[12px]"
      style={{ color: on ? C.primary : C.textSub }}
      role="checkbox"
      aria-checked={on}
    >
      <span
        className="w-3.5 h-3.5 rounded-[3px] flex items-center justify-center"
        style={{
          background: on ? C.primary : 'transparent',
          border: on ? 'none' : `1px solid ${C.divider}`,
          color: '#FFFFFF',
        }}
      >
        {on && <IcCheck size={10} />}
      </span>
      {label}
    </button>
  );

  return (
    <div className="flex flex-col h-full" style={{ background: C.pageBg }} data-status-bar-foreground="dark">
      <ZoneTabRow tabs={['领权益', '花积分']} activeLabel="花积分" getBind={tabBind} />

      <div
        className="flex-1 overflow-y-auto pb-6"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {/* 积分资产区(证据 746:米金底) */}
        <div style={{ background: C.rankChipBg }}>
          <ZoneAccountRow
            nickname={user.nickname}
            levelLabel={user.vipLevelLabel}
          />
          <div className="flex items-end gap-1 px-3 pt-1 pb-2">
            <span className="text-[36px] font-bold leading-[40px]" style={{ color: C.text }}>
              {user.points}
            </span>
            <span className="text-[13px] pb-1.5" style={{ color: C.textSub }}>
              积分
            </span>
          </div>

          {/* 权益横条 5 项:最后一项是金色按钮(证据 746) */}
          <div className="mx-3 mb-3 flex items-center rounded-lg px-2 py-2" style={{ background: C.pageBg }}>
            {mall.banners.slice(0, -1).map((b) => (
              <span
                key={b}
                className="flex-1 min-w-0 text-center text-[11px] truncate"
                style={{ color: C.text }}
              >
                {b}
              </span>
            ))}
            <span
              className="shrink-0 flex items-center h-8 px-3 rounded-md text-[12px] font-semibold"
              style={{ background: C.goldBtnTo, color: C.goldBtnText }}
            >
              {mall.banners[mall.banners.length - 1]}
            </span>
          </div>
        </div>

        {/* 积分抽好礼 banner(证据 746) */}
        <div
          className="flex items-center w-full mx-3 mt-3 px-3 py-3 rounded-xl border-none text-left"
          style={{ background: C.chipGray, width: 'calc(100% - 24px)' }}
        >
          <span className="flex-1 text-[15px] font-semibold" style={{ color: C.text }}>
            {mall.lottery}
          </span>
          <span
            className="px-2 py-1 rounded-md text-[12px] font-semibold"
            style={{ background: C.vipBadgeBg, color: C.vipBadgeText }}
          >
            {membership.levelLabel}
          </span>
        </div>

        {/* 商品分类 tab + 搜商品(证据 745) */}
        <div className="flex items-center gap-3 px-3 pt-4">
          {mall.tabs.map((t) => {
            const active = t === tab;
            return (
              <button
                key={t}
                {...bindTap({ kind: 'action', id: 'vip.points.tab.switch' }, {
                  params: { tab: t },
                  onTrigger: () => setUi(UI_TAB, t),
                })}
                className="bg-transparent border-none p-0 text-[14px]"
                style={{ color: active ? C.text : C.textSub, fontWeight: active ? 700 : 400 }}
              >
                {t}
              </button>
            );
          })}
          <div className="flex-1" />
        </div>

        {/* 排序 + 复选(证据 745) */}
        <div className="flex items-center gap-4 px-3 pt-3">
          {mall.sorts.map((sname) => {
            const active = sname === sort;
            return (
              <button
                key={sname}
                {...bindTap({ kind: 'action', id: 'vip.points.sort.switch' }, {
                  params: { sort: sname },
                  onTrigger: () => setUi(UI_SORT, sname),
                })}
                className="bg-transparent border-none p-0 text-[13px]"
                style={{ color: active ? C.text : C.textSub, fontWeight: active ? 600 : 400 }}
              >
                {sname}
              </button>
            );
          })}
          <div className="flex-1" />
          {checkbox(pureOnly, '纯积分', UI_PURE)}
          {checkbox(affordableOnly, '我能兑', UI_AFFORDABLE)}
        </div>

        {/* 商品双列宫格(证据 745) */}
        {goods.length === 0 ? (
          <EmptyState text="暂无可兑换的商品" />
        ) : (
          <div className="grid grid-cols-2 gap-2 px-3 pt-3">
            {goods.map((g) => (
              <div
                key={g.id}
                className="rounded-xl p-2 text-left"
                style={{ background: C.chipGray }}
              >
                <div className="flex justify-center">
                  <TvImg
                    id={g.img}
                    alt={g.name}
                    className="w-[86px] h-[116px] rounded-lg object-cover"
                  />
                </div>
                <span
                  className="inline-block mt-2 px-1 rounded-[3px] text-[10px] leading-[15px]"
                  style={{ background: C.premiereYellow, color: C.premiereText }}
                >
                  {g.tag}
                </span>
                <div
                  className="text-[13px] leading-[18px] pt-1 h-[36px] overflow-hidden"
                  style={{ color: C.text }}
                >
                  {g.name}
                </div>
                <div className="pt-1">
                  <span className="text-[16px] font-bold" style={{ color: C.text }}>
                    {g.points}
                  </span>
                  <span className="text-[12px] pl-0.5" style={{ color: C.text }}>
                    积分
                  </span>
                </div>
                <div className="text-[10px] pt-1" style={{ color: C.textSub }}>仅展示 · 暂不支持兑换</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
