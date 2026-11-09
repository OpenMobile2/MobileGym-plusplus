import React, { useState } from 'react';
import { useDarkMode } from '../../../os/hooks/useDarkMode';
import { useSearchParams } from 'react-router-dom';
import Img from '../components/Img';
import { IcBack, IcPhone, IcStore, IcChevronDown, IcChevronUp } from '../res/icons';
import { useCainiaoGestures } from '../hooks/useCainiaoGestures';
import { useCainiaoStore } from '../state';
import { fmtMdHm } from '../utils/appTime';
import { copyToClipboard } from '../utils/clipboard';
import { useI18n } from '../i18n';
import { sharePlainText } from '@/os/shareBridge';

/** 包裹详情(spec package.detail):pending=取件码;signed=完整轨迹;展开/收起 */
export default function PackageDetailPage() {
  const { isDark } = useDarkMode();
  const { action, bindBack, bindTap } = useCainiaoGestures();
  const { t } = useI18n();
  const [sp] = useSearchParams();
  const packageId = sp.get('packageId') ?? '';
  // 展开/收起为原地视觉状态(effect=state,非离散导航态),本地 state 即可
  const [expanded, setExpanded] = useState(false);

  const pkg = useCainiaoStore((s) => s.packages.find((p) => p.id === packageId) ?? s.packages[0]);
  const user = useCainiaoStore((s) => s.user);
  const showToast = useCainiaoStore((s) => s.showToast);
  const wontfix = () => showToast(t('common.notOpen'));
  const maskPhone = (p: string) => `${p.slice(0, 3)}****${p.slice(-4)}`;

  if (!pkg) return null;
  const pending = pkg.status === '待取件';
  const nodes = expanded ? pkg.timeline : pkg.timeline.slice(0, pending ? 1 : 3);

  return (
    <div className="flex h-full flex-col bg-(--app-c-page-bg)" data-status-bar-foreground={isDark ? 'light' : 'dark'}>
      {/* 顶栏:商品条(pt-12 让开状态栏,阶段⑥反馈#1/#2) */}
      <div className="flex items-center gap-2 bg-(--app-c-card-bg)/95 px-2 pb-2 pt-12">
        <button {...bindBack()} className="cursor-pointer border-none bg-transparent p-1 text-(--app-c-text-primary)">
          <IcBack size={24} />
        </button>
        <Img src={pkg.image} className="h-10 w-10 shrink-0 rounded-lg object-cover" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-semibold text-(--app-c-text-primary)">{pkg.title}</div>
          <button {...action('package.detail.misc.wontfixToast', wontfix)} className="cursor-pointer border-none bg-transparent p-0 text-[12px] text-(--app-c-text-secondary)">
            {pkg.source} 查看商品 ›
          </button>
        </div>
        <button {...action('package.detail.misc.wontfixToast', wontfix)} className="cursor-pointer rounded-full border-none bg-(--app-c-brand-soft) px-2 py-1 text-[11px] text-(--app-c-brand)">
          管家
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 地图占位 */}
        <div className="relative h-44 w-full overflow-hidden">
          <Img
            src={pending ? '/@app-assets/Cainiao/maps/map_station.png' : '/@app-assets/Cainiao/maps/map_route.png'}
            className="h-full w-full object-cover"
          />
          <div className="absolute left-3 top-3 rounded-xl bg-(--app-c-card-bg) px-3 py-2 shadow">
            <div className="text-[14px] font-bold text-(--app-c-text-primary)">
              {pending ? '当前在代收点' : `包裹${pkg.status}`}
            </div>
            {pending && <div className="text-[12px] text-(--app-c-text-secondary)">包裹已入站{(pkg.daysInStation ?? 1) * 21}小时</div>}
          </div>
        </div>

        <div className="-mt-3 rounded-t-2xl bg-(--app-c-card-bg) px-4 pt-3">
          {/* 快递公司 + 运单号 */}
          <div className="flex items-center">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D0021B] text-[9px] font-bold text-white">
              {pkg.company.slice(0, 2)}
            </span>
            <span className="ml-2 text-[15px] font-semibold text-(--app-c-text-primary)">{pkg.company} {pkg.trackingNo}</span>
            <button
              {...action('package.detail.copyNo', () => { copyToClipboard(pkg.trackingNo); showToast(t('common.copied')); })}
              className="ml-auto cursor-pointer border-none bg-transparent text-[13px] text-(--app-c-text-primary)"
            >
              {t('common.copy')}
            </button>
            <span className="mx-2 text-[#DDD]">|</span>
            <button
              {...action('package.detail.share.open', () => {
                const text = `菜鸟包裹 ${pkg.company} ${pkg.trackingNo} ${pkg.status}`;
                const launched = sharePlainText(text, { onResult: (r) => { if (r.resultCode === 'OK') showToast('分享成功'); } });
                if (!launched) wontfix();
              })}
              className="cursor-pointer border-none bg-transparent text-[13px] text-(--app-c-text-primary)"
            >
              分享
            </button>
          </div>
          <div className="mt-1.5">
            <span className="rounded bg-(--app-c-brand-soft) px-1.5 py-0.5 text-[11px] text-(--app-c-brand)">🛡 超时享</span>
            <span className="ml-1 rounded bg-(--app-c-chip-bg) px-1.5 py-0.5 text-[11px] text-(--app-c-text-muted)">服务已失效›</span>
          </div>

          {/* 状态 + 时间线 */}
          <div className="mt-4 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-(--app-c-brand) text-[13px] text-white">✓</span>
            <span className="text-[21px] font-extrabold text-(--app-c-brand)">{pkg.status}</span>
            <span className="rounded border border-[#B9E4CF] bg-(--app-c-chip-bg) px-1.5 py-0.5 text-[11px] text-[#00B578]">回收包装</span>
          </div>

          {/* 驿站卡 + 取件码(待取件) */}
          {pending && (
            <div className="mt-3 rounded-xl bg-(--app-c-chip-bg) p-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-(--app-c-brand) text-white"><IcStore size={20} /></span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-bold text-(--app-c-text-primary)">{pkg.station}</div>
                  <div className="truncate text-[12px] text-(--app-c-text-muted)">{pkg.station}-{pkg.stationCell}</div>
                </div>
                <button {...action('package.detail.misc.wontfixToast', wontfix)} className="flex cursor-pointer flex-col items-center border-none bg-transparent text-(--app-c-text-primary)">
                  <IcPhone size={17} />
                  <span className="text-[10px]">打电话</span>
                </button>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[34px] font-extrabold tracking-wide text-(--app-c-text-primary)">{pkg.pickupCode}</span>
                <span className="text-[13px] text-(--app-c-text-muted)">取件码</span>
                <button
                  {...bindTap('package.detail.openLocker')}
                  className="ml-auto cursor-pointer rounded-full border border-(--app-c-brand) bg-(--app-c-card-bg) px-3 py-1.5 text-[13px] font-semibold text-(--app-c-brand)"
                >
                  开柜取件
                </button>
              </div>
            </div>
          )}

          {/* 轨迹时间线 */}
          <div className="mt-3">
            {nodes.map((n, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${i === 0 ? 'bg-(--app-c-brand)' : 'bg-[#D9DEE7]'}`} />
                  {i < nodes.length - 1 && <span className="w-px flex-1 bg-[#EEF0F3]" />}
                </div>
                <div className="pb-4">
                  <div className="text-[12px] text-(--app-c-text-muted)">{fmtMdHm(n.ts)}</div>
                  <div className={`mt-0.5 text-[14px] leading-6 ${i === 0 ? 'font-semibold text-(--app-c-text-primary)' : 'text-(--app-c-text-secondary)'}`}>
                    <span className="font-semibold">{n.title}</span> | {n.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 收货地址 */}
          <div className="border-t border-(--app-c-divider) py-3">
            <div className="flex gap-2 text-[14px] leading-6 text-(--app-c-text-primary)">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[#00B578] text-[11px] text-white">收</span>
              <div>
                送至 {pkg.station ?? '就近菜鸟驿站代收点'}
                <div className="mt-0.5 text-[13px] text-(--app-c-text-secondary)">
                  {user.name.slice(0, 1)}* {maskPhone(user.phone)}{' '}
                  <button {...action('package.detail.misc.wontfixToast', wontfix)} className="cursor-pointer rounded border border-(--app-c-brand) bg-transparent px-1 text-[11px] text-(--app-c-brand)">
                    隐私小号
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 展开/收起 */}
          <button
            {...action('package.detail.timeline.toggle', () => setExpanded((v) => !v))}
            className="flex w-full cursor-pointer items-center justify-center gap-1 border-none bg-transparent pb-4 pt-1 text-[14px] text-(--app-c-text-secondary)"
          >
            {expanded ? '收起' : '展开'} {expanded ? <IcChevronUp size={15} /> : <IcChevronDown size={15} />}
          </button>
        </div>

        {/* 低价寄件横幅(纯装饰,decorOnly) */}
        <div className="mx-3 mt-3 mb-4 flex items-center justify-between rounded-xl bg-gradient-to-r from-[#FFE9E4] to-[#FFD5CC] px-4 py-3">
          <div>
            <span className="text-[17px] font-extrabold text-(--app-c-text-primary)">低价寄件 </span>
            <span className="text-[17px] font-extrabold text-[#F5222D]">寄件0元起</span>
            <div className="mt-0.5 text-[12px] text-(--app-c-text-muted)">全网低价</div>
          </div>
          <Img src="/@app-assets/Cainiao/misc/mascot_bird.png" className="h-12 w-12 object-contain" />
        </div>
      </div>
    </div>
  );
}
