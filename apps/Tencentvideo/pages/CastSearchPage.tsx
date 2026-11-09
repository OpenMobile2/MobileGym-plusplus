// 投屏搜索页。节点 cast.search(spec v1.0.0,9 条交互)。
// 视觉证据:467997@6(纯黑底:顶栏「投屏搜索中…」+ 刷新 icon;3 条检查步骤;
// 「普通投屏」区(本地加速模式开关 + 镜像屏幕/AirPlay 设备卡);「远程投屏」区(管理设备 +
// 绑定设备);「暂未发现同网下的官方投屏设备」+ 2 条排查 tips;官方推荐「极光TV」卡 + 教程按钮;
// 底部 帮助与反馈›/投屏功能隐私声明)、833(iOS「本地网络权限」系统弹窗,对应第 3 条步骤)。
//
// 本页为深色页,顶栏前景要 light —— DARK_ROUTES 在共享的 TencentvideoApp.tsx 里登记,
// 本轮不改共享文件,已在交付报告里申报 '/cast/search' 需要加入。
import React, { useEffect, useState } from 'react';
import { useTencentvideoGestures } from '../hooks/useTencentvideoGestures';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import { useTencentvideoStore } from '../state';
import { TV_COLORS as C } from '../constants';
import { Switch, TopBar } from '../components/ui';
import { IcArrowRight, IcLoop, IcPip, IcPlay, IcTv } from '../res/icons';

/** 「搜索中 loading 数秒」的时长(spec cast.search.refresh:重新进入搜索中 loading 数秒) */
const SCAN_MS = 2600;

export default function CastSearchPage() {
  const { bindTap } = useTencentvideoGestures();
  const s = useTencentvideoStrings();

  const castPage = useTencentvideoStore((st) => st.player.castPage);
  const cast = useTencentvideoStore((st) => st.cast);

  const toast = useTencentvideoStore((st) => st.toast);
  const castSearchStart = useTencentvideoStore((st) => st.castSearchStart);
  const castConnect = useTencentvideoStore((st) => st.castConnect);
  const castLocalBoostToggle = useTencentvideoStore((st) => st.castLocalBoostToggle);

  // scanNonce 变一次 = 重新扫一轮(进页 + 每次点刷新);扫描期间转圈、扫完才露「暂未发现」区
  const [scanNonce, setScanNonce] = useState(0);
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    castSearchStart();
    setScanning(true);
    const timer = window.setTimeout(() => setScanning(false), SCAN_MS);
    return () => window.clearTimeout(timer);
  }, [scanNonce, castSearchStart]);

  const wontfix = (id: string) => bindTap({ kind: 'action', id }, { onTrigger: () => toast(s.notOpen) });

  // 种子里「远程投屏·绑定设备」「极光TV·大屏更清晰」是「标题·副文案」两段式
  const [remoteTitle, remoteButton] = castPage.remoteCast.split('·');
  const [tvAppName, tvAppNote] = castPage.tvApp.split('·');

  const sectionTitle = (title: string, right: React.ReactNode) => (
    <div className="flex items-center justify-between px-4 pt-5 pb-2">
      <span className="text-[13px]" style={{ color: C.darkTextSub }}>{title}</span>
      {right}
    </div>
  );

  return (
    <div className="flex flex-col h-full" style={{ background: C.darkBg }} data-status-bar-foreground="light">
      <TopBar
        dark
        title={cast.status === 'connected' ? (cast.device ?? '') : s.castSearching}
        right={
          <button
            {...bindTap({ kind: 'action', id: 'cast.search.refresh' }, {
              onTrigger: () => setScanNonce((n) => n + 1),
            })}
            className={`bg-transparent border-none p-1 ${scanning ? 'animate-spin' : ''}`}
            style={{ color: C.darkText }}
            aria-label={s.castRefresh}
          >
            <IcLoop size={20} />
          </button>
        }
      />

      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {/* 3 条检查步骤(证据 467997@6,居中排版) */}
        <div className="px-6 pt-4 text-center text-[13px] leading-[24px]" style={{ color: C.darkTextSub }}>
          <div>{s.castCheck1}</div>
          <div>{s.castCheck2}</div>
          <div>
            {s.castCheck3}
            <button
              {...wontfix('cast.search.permission.wontfix')}
              className="inline-flex items-center bg-transparent border-none p-0 ml-1 text-[13px]"
              style={{ color: C.primary }}
            >
              {s.castLocalNetwork}<IcArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* 普通投屏 */}
        {sectionTitle(
          castPage.modes[0],
          <div className="flex items-center gap-2">
            <span className="text-[12px]" style={{ color: C.darkTextSub }}>{castPage.modes[1]}</span>
            <Switch
              on={cast.localBoost}
              size="sm"
              bind={bindTap({ kind: 'action', id: 'cast.search.localboost.toggle' }, {
                onTrigger: castLocalBoostToggle,
              })}
            />
          </div>,
        )}
        <div className="mx-4 rounded-xl overflow-hidden" style={{ background: C.darkCard }}>
          <button
            {...wontfix('cast.search.mirror.wontfix')}
            className="w-full flex items-center gap-3 px-4 py-3 bg-transparent border-none text-left"
            style={{ color: C.darkText }}
          >
            <IcPip size={20} />
            <span className="flex-1">
              <span className="block text-[14px]">{s.castMirror}</span>
              <span className="block text-[11px] mt-0.5" style={{ color: C.darkTextSub }}>{s.castMirrorDanmaku}</span>
            </span>
          </button>
          <button
            {...bindTap('cast.control.open.airplay', {
              // 点卡即建立投屏连接(mock 简化真机的 iOS AirPlay 选择面板,
              // 默认输出 = 种子里的 phoneSpeaker,对应 467997@19 面板里被勾选的那一项)
              beforeTrigger: () => castConnect(castPage.phoneSpeaker),
            })}
            className="w-full flex items-center gap-3 px-4 py-3 bg-transparent border-none text-left"
            style={{ color: C.darkText }}
          >
            <IcTv size={20} />
            <span className="flex-1 text-[14px]">AirPlay</span>
          </button>
        </div>

        {/* 远程投屏 */}
        {sectionTitle(
          s.castRemote,
          <button
            {...wontfix('cast.search.deviceManage.wontfix')}
            className="flex items-center bg-transparent border-none p-0 text-[12px]"
            style={{ color: C.darkTextSub }}
          >
            {s.castManageDevices}<IcArrowRight size={13} />
          </button>,
        )}
        <div className="mx-4 rounded-xl flex items-center gap-3 px-4 py-3" style={{ background: C.darkCard }}>
          <span className="flex-1 min-w-0">
            <span className="block text-[14px]" style={{ color: C.darkText }}>{remoteTitle}</span>
            <span className="block text-[11px] mt-0.5" style={{ color: C.darkTextSub }}>
              {s.castRemoteHint}
            </span>
          </span>
          <button
            {...wontfix('cast.search.deviceManage.wontfix')}
            className="shrink-0 rounded-full border-none px-3 h-7 text-[12px]"
            style={{ background: 'rgba(255,255,255,0.12)', color: C.darkText }}
          >
            {remoteButton}
          </button>
        </div>

        {/* 未发现设备提示(扫描结束后才露出,证据 467997@6) */}
        {!scanning && (
          <div className="px-4 pt-5">
            <div className="text-[14px] font-semibold" style={{ color: C.darkText }}>
              {s.castNoDevice}
            </div>
            <div className="pt-1.5 text-[12px] leading-[20px]" style={{ color: C.darkTextSub }}>
              <div>{s.castNoDeviceTip1.replace('{name}', tvAppName)}</div>
              <div>{s.castNoDeviceTip2}</div>
            </div>
          </div>
        )}

        {/* 官方推荐「极光TV」 */}
        <div className="mx-4 mt-3 rounded-xl flex items-center gap-3 px-3 py-3" style={{ background: C.darkCard }}>
          <span
            className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-white"
            style={{ background: C.primary }}
            aria-hidden
          >
            <IcPlay size={18} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[14px] font-semibold" style={{ color: C.darkText }}>
              {s.castOfficialRec.replace('{name}', tvAppName)}
            </span>
            <span className="block text-[11px] mt-0.5" style={{ color: C.darkTextSub }}>
              {tvAppNote} · {s.castOfficialFeatures}
            </span>
          </span>
          <button
            {...wontfix('cast.search.tutorial.wontfix')}
            className="shrink-0 rounded-full border-none px-3 h-7 text-[12px] font-semibold"
            style={{ background: C.primary, color: '#FFFFFF' }}
          >
            {s.castTutorial}
          </button>
        </div>

        {/* 底部帮助 / 隐私声明 */}
        <div className="pt-6 pb-4 text-center text-[12px] leading-[22px]" style={{ color: C.darkTextSub }}>
          <button
            {...wontfix('cast.search.help.wontfix')}
            className="inline-flex items-center bg-transparent border-none p-0 text-[12px]"
            style={{ color: C.darkTextSub }}
          >
            {s.castHelp}<IcArrowRight size={13} />
          </button>
          <div>
            {s.castPrivacyNote}
            <button
              {...wontfix('cast.search.help.wontfix')}
              className="inline-flex items-center bg-transparent border-none p-0 ml-1 text-[12px]"
              style={{ color: C.darkTextSub }}
            >
              {s.castPrivacyPolicy}<IcArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
