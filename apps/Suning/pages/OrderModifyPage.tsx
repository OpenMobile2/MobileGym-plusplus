import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { IcNavBack, IcMore, IcChevronRight, IcClose, IcCheck } from '../res/icons';
import { useSuningGestures } from '../hooks/useSuningGestures';
import { useSuningStore } from '../state';
import { useStrings } from '../i18n';
import { regionOptionsAt, orderAddressOf } from '../utils/order';
import type { OrderAddress } from '../types';

const EMPTY_ADDR: OrderAddress = {
  name: '', phone: '', province: '', city: '', district: '', street: '', detail: '',
};

/**
 * 修改订单 - 改收货地址(spec order.modify,s330)。
 * ?orderId= 定位订单(spec v1.6.0 路由改写);?sheet=region 四级地区选择器 URL 驱动。
 * 表单草稿放 _temp.orderModifyDraft,提交写回订单 address 快照(不动地址簿)。
 */
export default function OrderModifyPage() {
  const { bindTap, action, bindBack, back } = useSuningGestures();
  const S = useStrings();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId') ?? '';
  const sheetOpen = searchParams.get('sheet') === 'region';

  const orders = useSuningStore((s) => s.orders);
  const addresses = useSuningStore((s) => s.addresses);
  const draft = useSuningStore((s) => s._temp.orderModifyDraft);
  const draftId = useSuningStore((s) => s._temp.orderModifyDraftId);
  const setTemp = useSuningStore((s) => s.setTemp);
  const showToast = useSuningStore((s) => s.showToast);
  const modifyOrderAddress = useSuningStore((s) => s.modifyOrderAddress);

  const order = orders.find((o) => o.id === orderId) ?? null;
  const wontfix = () => showToast(S.toastNotOpen);

  /* 首次进本单时用当前地址初始化草稿;从地址簿选完返回时草稿已填,不能再被覆盖 */
  useEffect(() => {
    if (!order || draftId === order.id) return;
    setTemp({
      orderModifyDraft: orderAddressOf(order, addresses) ?? { ...EMPTY_ADDR },
      orderModifyDraftId: order.id,
    });
  }, [order, addresses, draftId, setTemp]);

  if (!order) {
    return (
      <div className="flex h-full flex-col bg-[var(--app-bg)]">
        <TopBar onMore={wontfix} title={S.modifyOrderTitle} />
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden" data-scroll-container="main" data-scroll-direction="vertical">
          <div className="py-24 text-center text-[13px] text-[var(--app-c-text-muted)]">{S.orderNotFound}</div>
        </div>
      </div>
    );
  }

  const form = draft ?? EMPTY_ADDR;
  const regionText = form.province
    ? `${form.province} ${form.city} ${form.district} ${form.street}`
    : S.receiverCityPlaceholder;
  const patch = (p: Partial<OrderAddress>) => setTemp({ orderModifyDraft: { ...form, ...p } });
  const complete = Boolean(form.name && form.phone && form.province && form.detail);

  const submit = () => {
    if (!complete) {
      showToast(S.toastModifyIncomplete);
      return;
    }
    modifyOrderAddress(order.id, form);
    showToast(S.toastModifySubmitted);
    back();
  };

  return (
    <div className="relative flex h-full flex-col bg-[var(--app-bg)]">
      <TopBar onMore={wontfix} title={S.modifyOrderTitle} />

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5 pt-2" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="mb-2 rounded-lg bg-[#FFF3E8] px-3 py-2 text-[11px] leading-4 text-[var(--app-primary)]">
          {S.modifyOrderTip}
        </div>

        <div className="rounded-xl bg-[var(--app-surface)] px-3 py-2.5">
          <div className="flex items-center pb-1">
            <span className="min-w-0 flex-1 text-[14px] font-bold text-[var(--app-text)]">{S.receiverInfo}</span>
            <button
              {...bindTap('order.modify.addressPicker.open', {
                params: { mode: 'picker' },
                beforeTrigger: () => setTemp({ addressPickTarget: 'orderModify' }),
              })}
              className="flex shrink-0 cursor-pointer items-center border-none bg-transparent p-0 text-[12px] text-[var(--app-text-muted)]"
            >
              {S.pickFromAddressBook}
              <IcChevronRight size={12} />
            </button>
          </div>

          <Field label={S.receiverName}>
            <input
              data-action="order.modify.field.edit"
              data-action-type="input"
              value={form.name}
              onChange={(e) => patch({ name: e.target.value })}
              placeholder={S.receiverNamePlaceholder}
              data-keep-keyboard="true"
              className="w-full border-none bg-transparent text-right text-[13px] text-[var(--app-text)] outline-none placeholder:text-[var(--app-c-text-muted)]"
            />
          </Field>
          <Field label={S.receiverPhone}>
            <input
              data-action="order.modify.field.edit"
              data-action-type="input"
              value={form.phone}
              inputMode="tel"
              onChange={(e) => patch({ phone: e.target.value })}
              placeholder={S.receiverPhonePlaceholder}
              data-keep-keyboard="true"
              className="w-full border-none bg-transparent text-right text-[13px] text-[var(--app-text)] outline-none placeholder:text-[var(--app-c-text-muted)]"
            />
          </Field>
          <div className="flex items-center border-b border-[var(--app-border)] py-3">
            <span className="w-20 shrink-0 text-[13px] text-[var(--app-text-muted)]">{S.receiverCity}</span>
            <button
              {...bindTap('order.modify.region.open', {
                beforeTrigger: () => setTemp({ orderModifyRegion: [] }),
              })}
              className="flex min-w-0 flex-1 cursor-pointer items-center justify-end gap-0.5 border-none bg-transparent p-0"
            >
              <span className={`truncate text-[13px] ${form.province ? 'text-[var(--app-text)]' : 'text-[var(--app-c-text-muted)]'}`}>
                {regionText}
              </span>
              <IcChevronRight size={13} className="shrink-0 text-[var(--app-c-text-muted)]" />
            </button>
          </div>
          <Field label={S.receiverDetail} last>
            <textarea
              data-action="order.modify.field.edit"
              data-action-type="input"
              value={form.detail}
              rows={2}
              onChange={(e) => patch({ detail: e.target.value })}
              placeholder={S.receiverDetailPlaceholder}
              data-keep-keyboard="true"
              className="w-full resize-none border-none bg-transparent text-right text-[13px] leading-5 text-[var(--app-text)] outline-none placeholder:text-[var(--app-c-text-muted)]"
            />
          </Field>
        </div>
      </div>

      <div className="shrink-0 border-t border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2">
        <button
          {...action('order.modify.form.submit', submit)}
          className="w-full cursor-pointer rounded-full border-none bg-gradient-to-r from-[var(--app-primary)] to-[var(--app-primary-dark)] py-2.5 text-[15px] font-bold text-white"
        >
          {S.submitApply}
        </button>
      </div>

      {sheetOpen && <RegionSheet value={form} onPick={patch} />}
    </div>
  );
}

function TopBar({ title, onMore }: { title: string; onMore: () => void }) {
  const { action, bindBack } = useSuningGestures();
  return (
    <div className="flex shrink-0 items-center gap-1 bg-[var(--app-surface)] px-2 pb-2 pt-10">
      <button {...bindBack()} className="cursor-pointer border-none bg-transparent p-1 text-[var(--app-text)]">
        <IcNavBack size={24} />
      </button>
      <span className="min-w-0 flex-1 text-center text-[16px] font-bold text-[var(--app-text)]">{title}</span>
      <button
        {...action('order.modify.wontfix.toast', onMore)}
        className="cursor-pointer border-none bg-transparent p-1 text-[var(--app-text)]"
      >
        <IcMore size={19} />
      </button>
    </div>
  );
}

function Field({ label, children, last }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div className={`flex items-start py-3 ${last ? '' : 'border-b border-[var(--app-border)]'}`}>
      <span className="w-20 shrink-0 pt-0.5 text-[13px] text-[var(--app-text-muted)]">{label}</span>
      <span className="min-w-0 flex-1">{children}</span>
    </div>
  );
}

const LEVELS = ['province', 'city', 'district', 'street'] as const;

/** ?sheet=region:省→市→区→街道逐级点选,选到街道自动关闭回填 */
function RegionSheet({ value, onPick }: { value: OrderAddress; onPick: (p: Partial<OrderAddress>) => void }) {
  const { action, bindBack, back } = useSuningGestures();
  const S = useStrings();
  /* 弹层内的点选路径独立于已填地址:每次打开都从省开始,选满四级才回填 */
  const path = useSuningStore((s) => s._temp.orderModifyRegion) ?? [];
  const setTemp = useSuningStore((s) => s.setTemp);

  const depth = Math.min(path.length, 3);
  const level = LEVELS[depth];
  const options = regionOptionsAt(path);
  const selected = [value.province, value.city, value.district, value.street][depth];

  const pick = (v: string) => {
    if (depth < 3) {
      setTemp({ orderModifyRegion: [...path.slice(0, depth), v] });
      return;
    }
    onPick({ province: path[0], city: path[1], district: path[2], street: v });
    back();
  };

  const crumbs = path.filter(Boolean);

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <div {...bindBack()} className="absolute inset-0 bg-black/50" />
      <div className="relative max-h-[70%] overflow-y-auto overflow-x-hidden rounded-t-2xl bg-[var(--app-surface)]">
        <div className="sticky top-0 bg-[var(--app-surface)] px-4 pb-2 pt-3">
          <div className="flex items-center">
            <span className="min-w-0 flex-1 text-center text-[15px] font-bold text-[var(--app-text)]">{S.regionSheetTitle}</span>
            <button {...bindBack()} className="absolute right-3 cursor-pointer border-none bg-transparent p-1 text-[var(--app-c-text-muted)]">
              <IcClose size={18} />
            </button>
          </div>
          {crumbs.length > 0 && (
            <div className="truncate pt-1 text-[12px] text-[var(--app-primary)]">{crumbs.join(' / ')}</div>
          )}
        </div>
        <div className="px-4 pb-6">
          {options.map((opt) => (
            <button
              key={opt}
              {...action('order.modify.region.pick', () => pick(opt), { params: { level, value: opt } })}
              className="flex w-full cursor-pointer items-center gap-2 border-none border-b border-[var(--app-border)] bg-transparent py-3 text-left"
            >
              <span className={`min-w-0 flex-1 text-[14px] ${selected === opt ? 'text-[var(--app-primary)]' : 'text-[var(--app-text)]'}`}>
                {opt}
              </span>
              {selected === opt && <IcCheck size={16} className="shrink-0 text-[var(--app-primary)]" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
