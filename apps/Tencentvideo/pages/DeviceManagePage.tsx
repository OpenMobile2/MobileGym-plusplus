// 登录设备管理。节点 device.manage(spec 3 条交互)。
// 视觉证据 727(账号卡 + 账号情况卡 + 米金 SVIP 横幅 + 设备列表)/ 726(会员设备对比表 + SVIP家庭卡)。
// 设备配额口径直接复用 membership.benefitsCompare 的「累计登录使用/同时观看」两行 ——
// 与收银台权益对比表同一份种子,天然对齐(交活标准③)。
import React, { useMemo } from 'react';
import { useTencentvideoGestures } from '../hooks/useTencentvideoGestures';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import { useTencentvideoStore } from '../state';
import { TV_COLORS as C } from '../constants';
import { TopBar } from '../components/ui';
import { TvImg } from '../components/Img';
import { IcArrowRight, IcCheck, IcTv } from '../res/icons';

/** 对比表只取设备相关的两行(与收银台同源) */
const DEVICE_COMPARE_ITEMS = ['累计登录使用', '同时观看'] as const;
/** 「正在播放」判定:种子 status 里的本机即当前正在播放的设备(证据 727 首行「正在播放」) */
const PLAYING_STATUS = '本机';

export default function DeviceManagePage() {
  const { bindTap } = useTencentvideoGestures();
  const s = useTencentvideoStrings();

  const user = useTencentvideoStore((s) => s.user);
  const devices = useTencentvideoStore((s) => s.devices);
  const membership = useTencentvideoStore((s) => s.membership);
  const wontfixToast = useTencentvideoStore((s) => s.wontfixToast);
  const toast = useTencentvideoStore((s) => s.toast);

  // 行序照证据 726(先累计、后同时),不跟收银台表的排序走
  const compareRows = useMemo(
    () =>
      DEVICE_COMPARE_ITEMS.map((item) => membership.benefitsCompare.find((r) => r.item === item)).filter(
        (r): r is NonNullable<typeof r> => Boolean(r),
      ),
    [membership.benefitsCompare],
  );
  const playingCount = useMemo(
    () => devices.list.filter((d) => d.status === PLAYING_STATUS).length,
    [devices.list],
  );

  const wontfix = (id: string) =>
    bindTap({ kind: 'action', id }, { onTrigger: () => toast(s.notOpen) });

  return (
    <div className="flex flex-col h-full" style={{ background: C.chipGray }} data-status-bar-foreground="dark">
      <TopBar title={s.deviceManageTitle} transparent />

      <div
        className="flex-1 overflow-y-auto pb-6"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {/* 账号卡(证据 727) */}
        <div className="flex items-center gap-3 px-3 py-3" style={{ background: C.pageBg }}>
          <TvImg id={user.avatar} alt={user.nickname} className="w-12 h-12 rounded-full object-cover" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-[17px] font-bold" style={{ color: C.text }}>
                {user.nickname}
              </span>
              <span
                className="px-1 rounded text-[10px] leading-[15px] font-semibold"
                style={{ background: C.vipBadgeBg, color: C.vipBadgeText }}
              >
                {user.vipLevelLabel}
              </span>
            </div>
            <div className="text-[12px] truncate" style={{ color: C.textSub }}>
              腾讯视频VIP:{membership.expire}
            </div>
          </div>
        </div>

        {/* 账号情况(证据 727:白卡 + 绿色对勾 + SVIP 米金推广条) */}
        <div className="text-[13px] px-4 pt-3 pb-1.5" style={{ color: C.textSub }}>
          账号情况
        </div>
        <div className="mx-3 rounded-xl px-3 py-3" style={{ background: C.pageBg }}>
          <div className="flex items-center gap-1.5">
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: C.primary, color: '#FFFFFF' }}
            >
              <IcCheck size={13} />
            </span>
            <span className="text-[15px] font-semibold" style={{ color: C.text }}>
              {devices.accountStatus}
            </span>
          </div>
          <button
            {...bindTap('vip.cashier.open.fromDevice')}
            className="flex items-center gap-2 w-full mt-3 px-3 py-2.5 rounded-lg border-none text-left"
            style={{ background: C.rankChipBg }}
          >
            <span className="flex-1 min-w-0">
              <span className="block text-[13px] font-semibold" style={{ color: C.rankChipText }}>
                {devices.svipBanner}
              </span>
              <span className="block text-[11px]" style={{ color: C.rankChipText }}>
                {membership.familyCard.name} · {membership.familyCard.note}
              </span>
            </span>
            <span
              className="shrink-0 h-7 px-3 rounded-md text-[12px] font-semibold leading-[28px]"
              style={{ background: C.goldBtnTo, color: C.goldBtnText }}
            >
              立即开通
            </span>
          </button>
        </div>

        {/* 设备情况(证据 727/726) */}
        <div className="text-[13px] px-4 pt-4 pb-1.5" style={{ color: C.textSub }}>
          设备情况
        </div>
        <div className="mx-3 rounded-xl px-3 py-3" style={{ background: C.pageBg }}>
          <div className="flex items-center">
            <span className="flex-1 text-[16px] font-bold" style={{ color: C.text }}>
              主设备
            </span>
            <span className="text-[13px]" style={{ color: C.textSub }}>
              {devices.list[0]?.name}
            </span>
          </div>

          <div className="pt-3 text-[16px] font-bold" style={{ color: C.text }}>
            登录设备情况
          </div>
          <div className="text-[12px] pt-0.5" style={{ color: C.textSub }}>
            当前登录设备数 {devices.list.length},正在播放设备数 {playingCount}
          </div>

          {devices.list.map((d, i) => (
            <button
              key={`${d.name}-${d.date}`}
              {...wontfix('device.row.wontfix')}
              className="flex items-center gap-2.5 w-full pt-3 bg-transparent border-none text-left"
            >
              <span
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: C.chipGray, color: C.text }}
              >
                <IcTv size={18} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="flex items-center gap-1">
                  <span className="text-[15px] truncate" style={{ color: C.text }}>
                    {d.name}
                  </span>
                  {i === 0 && (
                    <span
                      className="shrink-0 px-1 rounded text-[10px] leading-[15px]"
                      style={{ background: C.primaryBg, color: C.primary }}
                    >
                      主设备
                    </span>
                  )}
                </span>
                <span className="block text-[12px]" style={{ color: C.textSub }}>
                  {d.city},{d.status},{d.date}
                </span>
              </span>
              <IcArrowRight size={16} color={C.textTertiary} />
            </button>
          ))}
        </div>

        {/* 会员设备对比(证据 726) */}
        <div className="text-[13px] px-4 pt-4 pb-1.5" style={{ color: C.textSub }}>
          会员设备对比
        </div>
        <div className="mx-3 rounded-xl px-3 py-3" style={{ background: C.pageBg }}>
          <div className="flex items-center pb-2">
            <span className="flex-1" />
            <span className="w-[30%] text-center text-[14px] font-semibold" style={{ color: C.text }}>
              腾讯视频VIP
            </span>
            <span
              className="w-[30%] text-center text-[14px] font-semibold"
              style={{ color: C.memberLevel }}
            >
              腾讯视频SVIP
            </span>
          </div>
          {compareRows.map((r) => (
            <div key={r.item} className="flex items-center py-2.5 border-t" style={{ borderColor: C.chipGray }}>
              <span className="flex-1 text-[13px]" style={{ color: C.textSub }}>
                {r.item}
              </span>
              <span className="w-[30%] text-center text-[13px]" style={{ color: C.text }}>
                {r.vip}
              </span>
              <span
                className="w-[30%] text-center text-[13px] font-semibold"
                style={{ color: C.memberLevel }}
              >
                {r.svip}
              </span>
            </div>
          ))}
          <div className="text-[11px] pt-2" style={{ color: C.textTertiary }}>
            当前:{membership.levelLabel} · {devices.quota[membership.status]}
          </div>
        </div>

        {/* SVIP家庭卡推广(证据 726 底部) */}
        <button
          {...bindTap('vip.cashier.open.fromDevice')}
          className="flex items-center w-[calc(100%-24px)] mx-3 mt-3 px-3 py-3 rounded-xl border-none text-left"
          style={{ background: C.rankChipBg }}
        >
          <span className="flex-1 min-w-0">
            <span className="block text-[15px] font-semibold" style={{ color: C.memberLevel }}>
              {membership.familyCard.name}
            </span>
            <span className="block text-[12px]" style={{ color: C.rankChipText }}>
              {membership.familyCard.deviceNote}
            </span>
          </span>
          <span className="flex items-center text-[12px]" style={{ color: C.rankChipText }}>
            详情
            <IcArrowRight size={13} />
          </span>
        </button>
      </div>
    </div>
  );
}
