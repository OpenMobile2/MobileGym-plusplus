// 个人中心侧边抽屉。节点 me.drawer(spec 8 条交互,overlay 形态)。
// 视觉证据:723(抽屉顶部:金币中心卡 = 签到日历 + 4 条金币任务 + 查看更多)、
// 722(继续下滚:爱玩游戏/官方好物折叠组 + 更多服务6宫格 + 福利中心 + 免流量看视频)。
// 形态:左侧约 86% 宽的白卡列 + 右侧压暗遮罩;点遮罩 = 关闭(平台合同:一律 bindBack)。
import React from 'react';
import { useTencentvideoGestures } from '../hooks/useTencentvideoGestures';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import { useTencentvideoStore } from '../state';
import { TV_COLORS as C } from '../constants';
import { CoinTaskRow, SignCalendar, nextSignIndex } from '../components/me';
import type { BindProps } from '../components/ui';
import {
  IcArrowDown, IcArrowUp, IcCoin, IcEgg, IcGift, IcMagic, IcPalette, IcPlay, IcPoster,
  IcShirt, IcSparkle, IcUnlock,
} from '../res/icons';

/** 「今天已签」的页面态:签到日历本身只记录 7 天签没签,是否「今天刚签过」属页面开关态 → ui。 */
const SIGNED_KEY = 'coin.signin.done';
/** 折叠组展开态(spec:展开内容未拍,mock 占位空态) */
const GROUP_KEYS = ['me.drawer.group.aiwan', 'me.drawer.group.goods'] as const;

/** 折叠组标题(证据 722:「爱玩游戏」「官方好物」;种子无对应键) */
const GROUPS = [
  { key: GROUP_KEYS[0], title: '爱玩游戏' },
  { key: GROUP_KEYS[1], title: '官方好物' },
];
/** 金币任务按钮文案(证据 722:去抽奖 / 拆盲盒 / 去抽奖) */
const TASK_BTNS = ['去抽奖', '拆盲盒', '去抽奖'];
/** 抽奖任务行图标(证据 722 三行图标各不相同:转盘 / 盲盒 / 年卡) */
const TASK_ICONS = [IcSparkle, IcGift, IcMagic];
/** 更多服务 6 宫格图标(证据 722 逐格取形:装扮/书/票/盒/卡/漫) */
const SERVICE_ICONS = [IcShirt, IcPoster, IcGift, IcEgg, IcPalette, IcMagic];
/** 福利中心 2 项 / 免流量看视频 4 项(证据 722;种子只给了分组标题,条目文案照真机) */
const WELFARE_ITEMS = ['爱玩游戏', '爱玩小游戏'];
const WELFARE_ICONS = [IcSparkle, IcEgg];
const FREEFLOW_ITEMS = ['领VIP会员', '积分兑VIP', '领20G流量', '宽带送SVIP'];
const FREEFLOW_ICONS = [IcGift, IcCoin, IcUnlock, IcPlay];

/**
 * 更多服务 / 福利中心 / 免流量看视频三块共用的四列宫格(证据 722:
 * 无圆底、黑色线性图标 + 12px 灰字,标题左对齐 15px 半粗)。
 */
function ServiceGrid({
  title,
  items,
  icons,
  bindOf,
}: {
  title: string;
  items: string[];
  icons: React.ComponentType<{ size?: number }>[];
  bindOf: (item: string) => BindProps;
}) {
  return (
    <div className="mx-3 mt-2 rounded-xl px-3 py-3" style={{ background: C.pageBg }}>
      <div className="text-[15px] font-semibold pb-2" style={{ color: C.text }}>
        {title}
      </div>
      <div className="grid grid-cols-4 gap-y-3">
        {items.map((item, i) => {
          const Icon = icons[i % icons.length] ?? IcGift;
          return (
            <button
              key={item}
              {...bindOf(item)}
              className="flex flex-col items-center gap-1 bg-transparent border-none p-0"
              style={{ color: C.text }}
            >
              <Icon size={22} />
              <span className="text-[12px] leading-tight" style={{ color: C.textSub }}>
                {item}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function MeDrawerPage() {
  const { bindTap, bindBack } = useTencentvideoGestures();
  const s = useTencentvideoStrings();

  const coins = useTencentvideoStore((s) => s.coins);
  const drawer = useTencentvideoStore((s) => s.drawer);
  const ui = useTencentvideoStore((s) => s.ui);
  const wontfixToast = useTencentvideoStore((s) => s.wontfixToast);
  const toast = useTencentvideoStore((s) => s.toast);
  const setUi = useTencentvideoStore((s) => s.setUi);
  const coinSigninDaily = useTencentvideoStore((s) => s.coinSigninDaily);

  const signedToday = ui[SIGNED_KEY] === true || nextSignIndex(coins.signDays) < 0;

  const wontfix = (id: string): BindProps =>
    bindTap({ kind: 'action', id }, { onTrigger: () => toast(s.notOpen) });

  const signBind = bindTap({ kind: 'action', id: 'coin.signin.daily' }, {
    onTrigger: () => {
      coinSigninDaily();
      setUi(SIGNED_KEY, true);
    },
  });

  return (
    <div className="flex h-full" style={{ background: 'rgba(0,0,0,0.35)' }}>
      {/* 抽屉主体 */}
      <div
        className="w-[86%] h-full overflow-y-auto pb-6"
        style={{ background: C.chipGray }}
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {/* 金币中心卡(723) */}
        <div className="mx-3 mt-3 rounded-xl px-3 py-3" style={{ background: C.pageBg }}>
          <div className="flex items-center gap-2 pb-2.5">
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                background: `linear-gradient(180deg, ${C.goldBtnFrom}, ${C.goldBtnTo})`,
                color: C.goldBtnText,
              }}
            >
              <IcCoin size={18} />
            </span>
            <span className="flex-1 text-[16px] font-semibold" style={{ color: C.text }}>
              金币中心
            </span>
            <IcArrowUp size={16} style={{ color: C.textTertiary }} />
          </div>

          <SignCalendar days={coins.signDays} signBind={signBind} signed={signedToday} compact />

          <div className="pt-1">
            <CoinTaskRow
              icon={<IcPlay size={17} />}
              title={`${coins.adTask.label} (${coins.adTask.progress})`}
              sub={`金币+${coins.adTask.per}`}
              btn="去观看"
              bind={wontfix('coin.task.ad.wontfix')}
            />
            {coins.drawerTasks.map((task, i) => {
              const TaskIcon = TASK_ICONS[i] ?? IcGift;
              return (
              <CoinTaskRow
                key={task}
                icon={<TaskIcon size={17} />}
                title={task}
                sub={`金币+${coins.gameTask.per}`}
                btn={TASK_BTNS[i] ?? TASK_BTNS[0]}
                bind={wontfix('coin.task.wontfix')}
              />
              );
            })}
            <button
              {...wontfix('coin.task.wontfix')}
              className="w-full pt-1.5 bg-transparent border-none text-[13px]"
              style={{ color: C.textSub }}
            >
              查看更多
            </button>
          </div>
        </div>

        {/* 折叠组:爱玩游戏 / 官方好物(722) */}
        {GROUPS.map((g) => {
          const open = ui[g.key] === true;
          return (
            <div key={g.key} className="mx-3 mt-2 rounded-xl px-3" style={{ background: C.pageBg }}>
              <button
                {...bindTap({ kind: 'action', id: 'me.drawer.group.toggle' }, {
                  params: { group: g.title },
                  onTrigger: () => setUi(g.key, !open),
                })}
                className="flex items-center gap-2 w-full h-14 bg-transparent border-none p-0"
              >
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: C.chipGray, color: C.goldBtnText }}
                >
                  <IcSparkle size={17} />
                </span>
                <span className="flex-1 text-left text-[15px] font-semibold" style={{ color: C.text }}>
                  {g.title}
                </span>
                {open ? (
                  <IcArrowUp size={16} style={{ color: C.textTertiary }} />
                ) : (
                  <IcArrowDown size={16} style={{ color: C.textTertiary }} />
                )}
              </button>
              {open && (
                <div className="pb-3 text-center text-[12px]" style={{ color: C.textTertiary }}>
                  内容准备中
                </div>
              )}
            </div>
          );
        })}

        {/* 更多服务 / 福利中心 / 免流量看视频三块同版式(722:无圆底,黑色线性图标 + 灰字) */}
        <ServiceGrid
          title={s.meDrawerMore}
          items={drawer.moreServices}
          icons={SERVICE_ICONS}
          bindOf={() => wontfix('me.drawer.services.wontfix')}
        />
        <ServiceGrid
          title={drawer.welfareCenter}
          items={WELFARE_ITEMS}
          icons={WELFARE_ICONS}
          bindOf={() => wontfix('me.drawer.welfare.wontfix')}
        />
        <ServiceGrid
          title={drawer.freeData}
          items={FREEFLOW_ITEMS}
          icons={FREEFLOW_ICONS}
          bindOf={() => wontfix('me.drawer.freeflow.wontfix')}
        />
      </div>

      {/* 抽屉外遮罩:点击关闭 */}
      <button
        {...bindBack()}
        className="flex-1 h-full bg-transparent border-none p-0"
        aria-label="关闭抽屉"
      />
    </div>
  );
}
