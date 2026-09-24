import React from 'react';
import { useDarkMode } from '../../../os/hooks/useDarkMode';
import TopBar from '../components/TopBar';
import { IcNav } from '../res/icons';
import { useCainiaoGestures } from '../hooks/useCainiaoGestures';
import { useCainiaoStore } from '../state';
import { CAINIAO_CONFIG } from '../data';
import { useI18n } from '../i18n';

/** 柜机查询(spec ship.lockers):点柜机卡选中并回填寄件页(阶段⑥反馈#17) */
export default function LockersPage() {
  const { isDark } = useDarkMode();
  const { action, back } = useCainiaoGestures();
  const { t } = useI18n();
  const draft = useCainiaoStore((s) => s.draft);
  const patchDraft = useCainiaoStore((s) => s.patchDraft);
  const showToast = useCainiaoStore((s) => s.showToast);
  const wontfix = () => showToast(t('common.notOpen'));

  return (
    <div className="flex h-full flex-col bg-(--app-c-page-bg)" data-status-bar-foreground={isDark ? 'light' : 'dark'}>
      <TopBar title="柜机查询" />
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="mt-2 text-[12px] leading-5 text-(--app-c-text-muted)">
          · 柜机列表仅做展示使用, 下单后可前往同城任意柜机<br />
          · 本列表展示距离您的寄件地址附近部分柜机<br />
          · 在柜机上输入开柜码进行投递, 勿跨城投递
        </div>
        {CAINIAO_CONFIG.lockers.map((lk) => {
          const active = draft.lockerId === lk.id;
          return (
            <button
              key={lk.id}
              {...action('ship.lockers.select.item', () => { patchDraft({ lockerId: lk.id, method: 'locker' }); back(); }, { params: { lockerId: lk.id } })}
              className={`mt-3 flex w-full cursor-pointer items-center rounded-2xl border bg-(--app-c-card-bg) p-3.5 text-left ${active ? 'border-(--app-c-brand)' : 'border-transparent'}`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="min-w-0 text-[16px] font-bold leading-6 text-(--app-c-text-primary)">{lk.name}</span>
                  {lk.nearest && <span className="shrink-0 rounded bg-(--app-c-brand) px-1.5 py-0.5 text-[10px] text-white">距离…</span>}
                  {active && <span className="shrink-0 rounded bg-[#E5F1FF] px-1.5 py-0.5 text-[10px] text-(--app-c-brand)">已选</span>}
                </div>
                <div className="mt-1 text-[13px] text-(--app-c-text-secondary)">{lk.addr}</div>
                <div className="mt-1 text-[12px] text-(--app-c-text-muted)">24小时营业</div>
                <div className="text-[12px] text-(--app-c-text-muted)">剩余格口: 大, 中, 小</div>
              </div>
              <div className="ml-2 shrink-0 text-center">
                <span
                  {...action('ship.lockers.nav.wontfixToast', wontfix, { stopPropagation: true })}
                  className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-(--app-c-brand)/40 bg-(--app-c-brand-soft) text-(--app-c-brand)"
                >
                  <IcNav size={18} />
                </span>
                <div className="mt-0.5 text-[12px] text-(--app-c-brand)">导航</div>
                <div className="mt-1 text-[13px] text-(--app-c-text-primary)">{lk.distance}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
