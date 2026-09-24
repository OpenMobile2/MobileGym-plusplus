// 开屏页。节点 splash.screen(spec:3 条交互)。
// 视觉证据:833(整屏一张互动广告图;左上「▶ 腾讯视频」字标;右上「互动广告」+ 深色「跳过」胶囊;
// 底部居中「翻转手机 / 跳转详情页或第三方应用」)。iOS 本地网络权限系统弹窗按 spec note 不复刻。
// 倒计时结束自动进首页 = transition home.feed.open.splashAuto,用 go() 触发(非用户手势)。
import React, { useEffect, useState } from 'react';
import * as TimeService from '@/os/TimeService';
import { useTencentvideoGestures } from '../hooks/useTencentvideoGestures';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import { useTencentvideoStore } from '../state';
import { TvImg } from '../components/Img';
import { IcPlay } from '../res/icons';

/** 开屏倒计时秒数(真机胶囊里是「跳过 5」量级,种子未给,取通用 5s) */
const COUNTDOWN_SEC = 5;

export default function SplashScreenPage() {
  const { bindTap, go } = useTencentvideoGestures();
  const s = useTencentvideoStrings();
  const wontfixToast = useTencentvideoStore((s) => s.wontfixToast);
  const toast = useTencentvideoStore((s) => s.toast);

  const [left, setLeft] = useState(COUNTDOWN_SEC);

  // 秒表随 TimeService 倍速联动(与 usePlaybackTicker 同一套口径,禁用真实 Date)
  useEffect(() => {
    const timer = window.setInterval(() => {
      setLeft((v) => Math.max(0, v - 1 * TimeService.getSpeed()));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (left > 0) return;
    go('home.feed.open.splashAuto');
  }, [left, go]);

  return (
    <div
      {...bindTap({ kind: 'action', id: 'splash.ad.wontfix' }, {
        onTrigger: () => toast(s.notOpen),
      })}
      className="relative h-full w-full overflow-hidden"
      style={{ background: '#0A0A0A' }}
      data-status-bar-foreground="light"
    >
      <TvImg id="banner_shop.png" alt={s.splashAdAlt} className="absolute inset-0 w-full h-full object-cover" />

      {/* 左上字标 */}
      <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5">
        <span
          className="flex items-center justify-center w-7 h-7 rounded-md text-white"
          style={{ background: 'rgba(255,255,255,0.22)' }}
        >
          <IcPlay size={16} />
        </span>
        <span className="text-[19px] font-bold text-white tracking-wide">{s.appName}</span>
      </div>

      {/* 右上「互动广告」+ 跳过胶囊(倒计时) */}
      <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
        <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.78)' }}>
          互动广告
        </span>
        <button
          {...bindTap('home.feed.open.fromSplash', { stopPropagation: true })}
          className="px-3 h-7 rounded-md border-none text-[14px] text-white"
          style={{ background: 'rgba(0,0,0,0.52)' }}
        >
          跳过{left > 0 ? ` ${Math.ceil(left)}` : ''}
        </button>
      </div>

      {/* 底部互动提示 */}
      <div className="absolute inset-x-0 bottom-8 z-10 text-center">
        <div className="text-[17px] font-semibold text-white">{s.splashFlip}</div>
        <div className="text-[13px] mt-1" style={{ color: 'rgba(255,255,255,0.82)' }}>
          跳转详情页或第三方应用
        </div>
      </div>
    </div>
  );
}
