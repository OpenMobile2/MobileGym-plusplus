import React from 'react';
import { useLocation } from 'react-router-dom';
import Img from '../components/Img';
import { ConfirmDialog } from '../components/Sheet';
import { IcBack, IcSearch, IcStore, IcChevronRight } from '../res/icons';
import { useCainiaoGestures } from '../hooks/useCainiaoGestures';
import { useCainiaoStore } from '../state';
import { useI18n } from '../i18n';

/** 取包裹页(spec pickup.main):驿站分组 + 大字取件码 + 一键开柜 + 已经取啦 */
export default function PickupPage() {
  const { bindTap, action, bindBack, back } = useCainiaoGestures();
  const { t } = useI18n();
  const { search } = useLocation();
  const sp = new URLSearchParams(search);
  const dialog = sp.get('dialog');
  const dialogPkgId = sp.get('packageId') ?? undefined;
  const showConfirm = dialog === 'confirmTaken';
  const showOpenWarn = dialog === 'openLocker';
  const showOpenOk = dialog === 'openLockerOk';

  const packages = useCainiaoStore((s) => s.packages);
  const confirmTaken = useCainiaoStore((s) => s.confirmTaken);
  const showToast = useCainiaoStore((s) => s.showToast);
  const wontfix = () => showToast(t('common.notOpen'));

  const pending = packages.filter((p) => p.status === '待取件');

  return (
    <div className="relative flex h-full flex-col bg-gradient-to-b from-(--app-c-header-from) to-(--app-c-wash-to)" data-status-bar-foreground="light">
      {/* 顶栏 */}
      <div className="mt-10 flex h-11 shrink-0 items-center px-1">
        <button {...bindBack()} className="cursor-pointer border-none bg-transparent p-2 text-white">
          <IcBack size={24} />
        </button>
        <div className="flex-1 text-center text-[17px] font-semibold text-white">
          {t('pickup.title')} · 共{pending.length}件
        </div>
        <button
          {...action('pickup.codes.wontfixToast', wontfix)}
          className="flex cursor-pointer items-center gap-1 border-none bg-transparent pr-3 text-[14px] text-white"
        >
          <IcSearch size={16} /> 查取件码
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        {pending.length === 0 && (
          <div className="mt-16 flex flex-col items-center">
            <Img src="/@app-assets/Cainiao/misc/mascot_bird.png" className="h-24 w-24 object-contain" />
            <div className="mt-3 text-[14px] text-(--app-c-text-secondary)">暂无待取包裹</div>
          </div>
        )}
        {pending.map((p) => (
          <div key={p.id} className="mt-2">
            {/* 驿站卡 */}
            <button
              {...action('pickup.station.wontfixToast', wontfix)}
              className="flex w-full cursor-pointer items-center rounded-t-2xl border-none bg-gradient-to-r from-(--app-c-brand-soft) to-(--app-c-card-bg) p-3 text-left"
            >
              <div className="min-w-0 flex-1">
                <div className="text-[16px] font-bold leading-6 text-(--app-c-text-primary)">递易快递柜 · {p.station}</div>
                <div className="mt-0.5 truncate text-[13px] text-(--app-c-text-secondary)">{p.station}</div>
                <div className="mt-1 text-[12px] text-(--app-c-text-muted)">如需再次开柜, 请联系站长处理</div>
              </div>
              <IcChevronRight size={16} className="shrink-0 text-(--app-c-text-muted)" />
              <span className="ml-1 flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-(--app-c-brand-soft) text-[#7C9FE8]">
                <IcStore size={30} />
              </span>
            </button>
            {/* 包裹条目 */}
            <div className="rounded-b-2xl bg-(--app-c-card-bg) p-3">
              <div className="text-[15px] font-semibold text-(--app-c-text-primary)">
                {p.stationCell ?? '柜'}待取 · 1件
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div
                  {...bindTap('pickup.package.open', { params: { packageId: p.id } })}
                  className="flex min-w-0 flex-1 cursor-pointer gap-3"
                >
                  <Img src={p.image} className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                  <div className="min-w-0">
                    <div className="text-[26px] font-extrabold leading-8 text-(--app-c-text-primary)">{p.pickupCode}</div>
                    <div className="mt-0.5 truncate text-[13px] text-(--app-c-text-primary)">{p.source} | {p.title}</div>
                    <div className="text-[12px] text-(--app-c-text-muted)">{p.company} | 已入站{p.daysInStation}天</div>
                  </div>
                </div>
                <button
                  {...bindTap('pickup.openLocker.open', { params: { packageId: p.id } })}
                  className="shrink-0 cursor-pointer rounded-full border border-(--app-c-brand) bg-(--app-c-card-bg) px-3 py-1.5 text-[13px] font-semibold text-(--app-c-brand)"
                >
                  一键开柜
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 底部操作 */}
      {pending.length > 0 && (
        <div className="flex shrink-0 gap-3 bg-(--app-c-card-bg) px-4 pb-4 pt-2.5">
          <button
            {...action('pickup.delegate.wontfixToast', wontfix)}
            className="h-11 flex-1 cursor-pointer rounded-full border border-(--app-c-border) bg-(--app-c-card-bg) text-[15px] text-(--app-c-text-primary)"
          >
            {t('home.delegate')}
          </button>
          <button
            {...bindTap('pickup.confirmTaken.open')}
            className="h-11 flex-1 cursor-pointer rounded-full border-none bg-(--app-c-brand) text-[15px] font-semibold text-white"
          >
            {t('pickup.taken')}
          </button>
        </div>
      )}

      {showConfirm && (
        <ConfirmDialog
          text="确认已取走该包裹?"
          subText="确认后包裹将标记为已签收"
          confirmLabel="确认"
          confirmBinding={action('pickup.confirmTaken.confirm', () => { confirmTaken(); back(); })}
        />
      )}

      {/* 超距离提示(补拍 added_2) */}
      {showOpenWarn && (
        <div className="absolute inset-0 z-40 flex items-center justify-center px-10">
          <div {...bindBack()} className="absolute inset-0 bg-black/45" />
          <div className="relative w-full rounded-2xl bg-(--app-c-card-bg) px-5 pb-5 pt-6 text-center">
            <div className="text-[17px] font-bold text-(--app-c-text-primary)">开柜提示</div>
            <div className="mt-3 text-[14px] font-semibold text-[#F5222D]">开柜后，柜门将自动打开</div>
            <div className="mt-2 text-[13px] leading-5 text-(--app-c-text-secondary)">
              您距离柜机较远，为保障快递安全，请确保到柜机后再取件
            </div>
            <div className="mt-5 flex gap-3">
              <button
                {...bindTap('pickup.openLocker.continue', {
                  params: { packageId: dialogPkgId ?? pending[0]?.id ?? '' },
                  nav: { mode: 'replace' },
                })}
                className="h-10 flex-1 cursor-pointer rounded-full border border-(--app-c-border) bg-(--app-c-card-bg) text-[15px] text-(--app-c-text-primary)"
              >
                继续开柜
              </button>
              <button
                {...bindBack()}
                className="h-10 flex-1 cursor-pointer rounded-full border-none bg-(--app-c-brand) text-[15px] font-semibold text-white"
              >
                暂不开柜
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 开柜成功(补拍 added_2) */}
      {showOpenOk && (
        <div className="absolute inset-0 z-40 flex items-center justify-center px-10">
          <div className="absolute inset-0 bg-black/45" />
          <div className="relative w-full rounded-2xl bg-(--app-c-card-bg) px-5 pb-5 pt-6 text-center">
            <div className="text-[17px] font-bold text-(--app-c-text-primary)">
              {pending.find((p) => p.id === dialogPkgId)?.stationCell ?? '柜格'}开柜
            </div>
            <div className="mt-3 text-[14px] leading-6 text-(--app-c-text-primary)">
              开柜成功
              <br />
              取件后请随手关闭柜门
            </div>
            <button
              {...action('pickup.openLocker.done', () => {
                confirmTaken(dialogPkgId);
                back();
              })}
              className="mt-5 h-10 w-full cursor-pointer rounded-full border-none bg-(--app-c-brand) text-[15px] font-semibold text-white"
            >
              我知道了
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
