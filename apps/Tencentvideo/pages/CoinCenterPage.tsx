// 金币中心页。节点 coin.center(spec 9 条交互)。
// 视觉证据:731(奶金渐变顶 + 余额行/提现 + 3 张横滑兑换卡 + 每日签到 7 格 + 玩游戏得金币 +
// 看视频得金币红包墙 + 浏览任务列表)。
// 签到与侧边抽屉共用 store(coin.signin.daily),两处状态同步。
import React from 'react';
import { useTencentvideoGestures } from '../hooks/useTencentvideoGestures';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import { useTencentvideoStore } from '../state';
import { TV_COLORS as C } from '../constants';
import { SignCalendar, nextSignIndex } from '../components/me';
import { Switch } from '../components/ui';
import type { BindProps } from '../components/ui';
import { IcCoin, IcNavBack, IcPlay } from '../res/icons';

/** 与侧边抽屉共用的「今天已签」页面态键 */
const SIGNED_KEY = 'coin.signin.done';

/** 顶部 3 张兑换卡(证据 731;种子未收录这组运营卡,文案照真机截图) */
const EXCHANGE_CARDS = [
  { title: '腾讯视频VIP', note: '最高可领月卡' },
  { title: '兑IP周边', note: '枭起青壤支架' },
  { title: '换虚拟', note: '仙逆 / 大话' },
];

export default function CoinCenterPage() {
  const { bindTap, bindBack } = useTencentvideoGestures();
  const s = useTencentvideoStrings();

  const coins = useTencentvideoStore((s) => s.coins);
  const wontfixToast = useTencentvideoStore((s) => s.wontfixToast);
  const ui = useTencentvideoStore((s) => s.ui);
  const toast = useTencentvideoStore((s) => s.toast);
  const setUi = useTencentvideoStore((s) => s.setUi);
  const coinSigninDaily = useTencentvideoStore((s) => s.coinSigninDaily);
  const coinSigninRemindToggle = useTencentvideoStore((s) => s.coinSigninRemindToggle);

  const signedToday = ui[SIGNED_KEY] === true || nextSignIndex(coins.signDays) < 0;

  const wontfix = (id: string): BindProps =>
    bindTap({ kind: 'action', id }, { onTrigger: () => toast(s.notOpen) });

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: C.chipGray }}
      data-status-bar-foreground="dark"
    >
      {/* 顶栏压在奶金渐变上(731):返回 / 金币中心 / 反馈 */}
      <div className="shrink-0" style={{ background: C.goldBtnFrom }}>
        <div className="flex items-center h-11 px-2">
          <button
            {...bindBack()}
            className="bg-transparent border-none p-1"
            style={{ color: C.text }}
            aria-label={s.back}
          >
            <IcNavBack size={22} />
          </button>
          <div className="flex-1 text-center text-[16px] font-semibold" style={{ color: C.text }}>
            金币中心
          </div>
          <button
            {...wontfix('coin.feedback.wontfix')}
            className="bg-transparent border-none px-1 text-[14px]"
            style={{ color: C.text }}
          >
            反馈
          </button>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto pb-6"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {/* 余额区 + 兑换卡整体压在奶金渐变上(731) */}
        <div style={{ background: `linear-gradient(180deg, ${C.goldBtnFrom}, ${C.chipGray})` }}>
        <div className="px-4 pt-1 pb-3">
          <div className="text-[13px]" style={{ color: C.goldBtnText }}>
            我的金币
          </div>
          <div className="flex items-end gap-2 pt-0.5">
            <span className="text-[34px] font-bold leading-[38px]" style={{ color: C.text }}>
              {coins.balance}
            </span>
            <span className="text-[14px] pb-1" style={{ color: C.text }}>
              金币 {coins.cashText}
            </span>
            <div className="flex-1" />
            <button
              {...wontfix('coin.withdraw.wontfix')}
              className="flex items-center gap-1 px-3 h-8 rounded-full border-none text-[13px]"
              style={{ background: C.pageBg, color: C.text }}
            >
              <span className="text-[11px]" style={{ color: C.textSub }}>
                {coins.withdrawChannels.join('/')}
              </span>
              提现
            </button>
          </div>
        </div>

        {/* 兑换横滑卡 */}
        <div
          className="flex gap-2 overflow-x-auto px-3 pb-3 scrollbar-none"
          data-scroll-container="exchangeCards"
          data-scroll-direction="horizontal"
        >
          {EXCHANGE_CARDS.map((card) => (
            <button
              key={card.title}
              {...wontfix('coin.banner.wontfix')}
              className="shrink-0 w-[152px] rounded-xl px-2.5 py-2 border-none text-left"
              style={{ background: C.rankChipBg }}
            >
              <div className="text-[14px] font-semibold truncate" style={{ color: C.memberLevel }}>
                {card.title}
              </div>
              <div className="text-[11px] truncate" style={{ color: C.rankChipText }}>
                {card.note}
              </div>
            </button>
          ))}
        </div>
        </div>

        {/* 每日签到 */}
        <div className="mx-3 mt-2 rounded-xl px-3 py-3" style={{ background: C.pageBg }}>
          <div className="flex items-center">
            <div className="flex-1 min-w-0">
              <div className="text-[16px] font-semibold" style={{ color: C.text }}>
                每日签到
              </div>
              <div className="text-[11px]" style={{ color: C.textSub }}>
                连签可获得更多奖励
              </div>
            </div>
            <span className="text-[12px] pr-2" style={{ color: C.textSub }}>
              签到提醒
            </span>
            {/* Switch 关态是半透明白轨,垫一层灰底才能在白卡上看清 */}
            <span className="inline-flex rounded-full" style={{ background: C.divider }}>
              <Switch
                on={coins.remindOn === true}
                size="sm"
                bind={bindTap({ kind: 'action', id: 'coin.signin.remind.toggle' }, {
                  onTrigger: () => coinSigninRemindToggle(),
                })}
              />
            </span>
          </div>
          <div className="pt-2.5">
            <SignCalendar
              days={coins.signDays}
              signed={signedToday}
              signBind={bindTap({ kind: 'action', id: 'coin.signin.daily' }, {
                onTrigger: () => {
                  coinSigninDaily();
                  setUi(SIGNED_KEY, true);
                },
              })}
            />
          </div>
        </div>

        {/* 玩游戏得金币 */}
        <div className="mx-3 mt-2 rounded-xl px-3 py-3" style={{ background: C.pageBg }}>
          <div className="flex items-center gap-1.5 pb-2">
            <span className="text-[16px] font-semibold" style={{ color: C.text }}>
              {coins.gameTask.label}
            </span>
            <span
              className="px-1.5 rounded-full text-[11px] leading-[16px]"
              style={{ background: C.rankChipBg, color: C.rankChipText }}
            >
              金币+{coins.gameTask.per}
            </span>
          </div>
          <div className="flex gap-2">
            {coins.drawerTasks.map((task) => (
              <button
                key={task}
                {...wontfix('coin.game.wontfix')}
                className="flex-1 min-w-0 rounded-xl px-2 pt-2 pb-5 border-none text-center"
                style={{ background: C.rankChipBg }}
              >
                <div className="text-[12px] font-semibold truncate" style={{ color: C.badgeOrange }}>
                  {task}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 看视频得金币:红包墙 */}
        <div className="mx-3 mt-2 rounded-xl px-3 py-3" style={{ background: C.pageBg }}>
          <div className="flex items-center gap-1.5 pb-2">
            <span className="text-[16px] font-semibold" style={{ color: C.text }}>
              {coins.videoRedPackets.label}
            </span>
            <span
              className="px-1.5 rounded-full text-[11px] leading-[16px]"
              style={{ background: C.rankChipBg, color: C.rankChipText }}
            >
              金币+{coins.videoRedPackets.per}
            </span>
            <div className="flex-1" />
            <button
              {...wontfix('coin.watch.wontfix')}
              className="px-3 h-7 rounded-full border-none text-[12px]"
              style={{ background: C.rankChipBg, color: C.rankChipText }}
            >
              看视频
            </button>
          </div>
          <div
            className="flex gap-1.5 overflow-x-auto scrollbar-none"
            data-scroll-container="redPackets"
            data-scroll-direction="horizontal"
          >
            {Array.from({ length: coins.videoRedPackets.count }, (_, i) => (
              <button
                key={`rp_${i + 1}`}
                {...wontfix('coin.watch.wontfix')}
                className="shrink-0 w-[42px] h-[52px] rounded-lg border-none flex flex-col items-center justify-center gap-0.5"
                style={{ background: C.unlockRed, color: '#FFFFFF' }}
              >
                <IcCoin size={13} />
                <span className="text-[13px] font-bold leading-none">
                  {coins.videoRedPackets.per}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 浏览详情或第三方应用得金币 */}
        <div className="mx-3 mt-2 rounded-xl px-3 py-2" style={{ background: C.pageBg }}>
          <div className="text-[16px] font-semibold py-1.5" style={{ color: C.text }}>
            浏览详情或第三方应用得金币
          </div>
          {[
            { key: 'ad', title: `${coins.adTask.label} (${coins.adTask.progress})`, per: coins.adTask.per, btn: '去观看' },
            { key: 'browse', title: coins.browseTask.label, per: coins.browseTask.per, btn: '去浏览' },
          ].map((row) => (
            <div key={row.key} className="flex items-center gap-2.5 py-2">
              <span
                className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: C.chipGray, color: C.goldBtnText }}
              >
                <IcPlay size={16} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] truncate" style={{ color: C.text }}>
                  {row.title}
                </div>
                <div className="text-[11px]" style={{ color: C.rankChipText }}>
                  金币+{row.per}
                </div>
              </div>
              <button
                {...wontfix('coin.browse.wontfix')}
                className="shrink-0 px-3 h-7 rounded-full border-none text-[12px]"
                style={{ background: C.rankChipBg, color: C.rankChipText }}
              >
                {row.btn}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
