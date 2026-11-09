import React from 'react';
import { useLocation } from 'react-router-dom';
import Img from '../components/Img';
import Sheet from '../components/Sheet';
import TopBar from '../components/TopBar';
import { IcChevronRight, IcChevronDown, IcTrash, IcPlus, IcMinus, IcCheckCircle, IcShield } from '../res/icons';
import { useCainiaoGestures } from '../hooks/useCainiaoGestures';
import { useCainiaoStore } from '../state';
import { estimateFee, insuranceFee, chargeWeight, baseFeeFor } from '../utils/pricing';
import { TIME_SLOTS, ITEM_TYPES, ITEM_REF_WEIGHT, HANDOVER_PLACES, HANDOVER_NOTES, HANDOVER_EXTRAS } from '../constants';
import { CAINIAO_CONFIG } from '../data';
import { useI18n } from '../i18n';
import type { Recipient } from '../types';

const TOP_TABS = ['订单', '寄件', '特惠寄', '发货', '网购退货'] as const;

/** 菜鸟裹裹寄件(spec ship.main):三种寄件方式 + 六个弹层 + 下单/修改 */
export default function ShipPage() {
  const { bindTap, action } = useCainiaoGestures();
  const { t } = useI18n();
  const { search } = useLocation();
  const sheet = new URLSearchParams(search).get('sheet');

  const draft = useCainiaoStore((s) => s.draft);
  const addresses = useCainiaoStore((s) => s.addresses);
  const user = useCainiaoStore((s) => s.user);
  const setTemp = useCainiaoStore((s) => s.setTemp);
  const patchDraft = useCainiaoStore((s) => s.patchDraft);
  const removeRecipient = useCainiaoStore((s) => s.removeRecipient);
  const submitOrder = useCainiaoStore((s) => s.submitOrder);
  const showToast = useCainiaoStore((s) => s.showToast);
  const wontfix = () => showToast(t('common.notOpen'));

  const sender = draft.senderId ? addresses.find((a) => a.id === draft.senderId) : undefined;
  const fee = estimateFee(draft, addresses);
  const modify = !!draft.modifyOrderId;
  const canSubmit = draft.recipients.length > 0 && draft.agreement && !!draft.senderId;

  const stations = CAINIAO_CONFIG.stations;
  const selectedLocker = CAINIAO_CONFIG.lockers.find((l) => l.id === draft.lockerId) ?? CAINIAO_CONFIG.lockers[0];

  return (
    <div className="relative flex h-full flex-col bg-(--app-c-page-bg)" data-status-bar-foreground="light">
      <div className="bg-gradient-to-b from-(--app-c-header-from) to-(--app-c-header-via) pb-2">
        <TopBar title={t('ship.title')} dark transparent />
        {/* 顶部 Tab:横排;寄件白下划线选中;其余暂未开放(阶段⑥ 0731-2) */}
        <div className="flex items-center gap-1 overflow-x-auto px-3 pb-1" data-scroll-container="shipTopTabs" data-scroll-direction="horizontal">
          {TOP_TABS.map((tab) => {
            if (tab === '订单') {
              return (
                <button key={tab} {...bindTap('ship.orders.open')} className="shrink-0 cursor-pointer whitespace-nowrap border-none bg-transparent px-3 py-1.5 text-[15px] text-white/90">
                  订单
                </button>
              );
            }
            if (tab === '寄件') {
              return (
                <button
                  key={tab}
                  {...action('ship.toptabs.select.tab', () => setTemp({ shipTopTab: '寄件' }), { params: { value: '寄件' } })}
                  className="relative shrink-0 cursor-pointer whitespace-nowrap border-none bg-transparent px-3 py-1.5 text-[15px] font-semibold text-white"
                >
                  寄件
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-(--app-c-card-bg)" />
                </button>
              );
            }
            return (
              <button
                key={tab}
                {...action('ship.toptabs.wontfixToast', wontfix, { params: { value: tab } })}
                className="relative shrink-0 cursor-pointer whitespace-nowrap border-none bg-transparent px-2.5 py-1.5 text-[15px] text-white/90"
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-2 pt-2" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 寄/收地址卡 */}
        <div className="rounded-2xl bg-(--app-c-card-bg) p-3">
          {/* 寄件人(默认无,点地址簿选择;阶段⑥反馈#16) */}
          <div className="flex items-start gap-2.5">
            <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-(--app-c-brand) text-[12px] text-white">寄</span>
            {sender ? (
              <div className="min-w-0 flex-1">
                <div className="text-[16px] font-bold text-(--app-c-text-primary)">{sender.name} {sender.phone}</div>
                <div className="mt-0.5 text-[13px] leading-5 text-(--app-c-text-secondary)">
                  {sender.province}{sender.city}{sender.district}{sender.detail}
                </div>
                <button
                  {...bindTap('ship.handover.open')}
                  className="mt-1.5 flex w-full cursor-pointer items-center justify-between rounded bg-(--app-c-brand-soft) border-none px-2 py-1.5 text-[13px] text-(--app-c-brand)"
                >
                  {draft.handover ? `${draft.handover.place} | ${draft.handover.note}` : '设置包裹交件方式'}
                  <IcChevronDown size={14} />
                </button>
              </div>
            ) : (
              <div
                {...bindTap('ship.addressbook.sender.open', { params: { mode: 'sender' } })}
                className="min-w-0 flex-1 cursor-pointer"
              >
                <div className="text-[16px] font-bold text-(--app-c-text-primary)">谁来寄件</div>
                <div className="mt-0.5 text-[13px] text-(--app-c-text-muted)">点击选择寄件人</div>
              </div>
            )}
            <button {...bindTap('ship.addressbook.sender.open', { params: { mode: 'sender' } })} className="shrink-0 cursor-pointer border-l border-(--app-c-border) bg-transparent pl-3 text-[14px] text-(--app-c-text-primary)">
              {t('ship.addressbook')}
            </button>
          </div>
          <div className="my-3 border-t border-(--app-c-divider)" />
          {/* 收件人(可多个) */}
          {draft.recipients.length === 0 ? (
            <div className="flex items-start gap-2.5">
              <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#00B578] text-[12px] text-white">收</span>
              <div
                {...bindTap('ship.addressbook.recipient.open', { params: { mode: 'recipient' } })}
                className="min-w-0 flex-1 cursor-pointer"
              >
                <div className="text-[16px] font-bold text-(--app-c-text-primary)">要寄到哪里</div>
                <div className="mt-0.5 text-[13px] text-(--app-c-text-muted)">支持智能识别文本、图片中的地址</div>
              </div>
              <button {...bindTap('ship.addressbook.recipient.open', { params: { mode: 'recipient' } })} className="shrink-0 cursor-pointer border-l border-(--app-c-border) bg-transparent pl-3 text-[14px] text-(--app-c-text-primary)">
                {t('ship.addressbook')}
              </button>
            </div>
          ) : (
            draft.recipients.map((r, idx) => {
              const addr = addresses.find((a) => a.id === r.addressId);
              return (
                <div key={r.id} className={`flex items-start gap-2.5 ${idx > 0 ? 'mt-3 border-t border-(--app-c-divider) pt-3' : ''}`}>
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#00B578] text-[12px] text-white">收</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[16px] font-bold text-(--app-c-text-primary)">{addr?.name} {addr?.phone}</div>
                    <div className="mt-0.5 text-[13px] leading-5 text-(--app-c-text-secondary)">
                      {addr?.province}{addr?.city}{addr?.district}{addr?.detail}
                    </div>
                    <button
                      {...bindTap('ship.item.open', {
                        beforeTrigger: () => setTemp({ editingRecipientId: r.id }),
                      })}
                      className="mt-1.5 flex w-full cursor-pointer items-center justify-between rounded border-none bg-(--app-c-chip-bg) px-2 py-1.5 text-[13px] text-(--app-c-text-primary)"
                    >
                      {r.itemType}, {r.weightKg}kg
                      <IcChevronDown size={14} />
                    </button>
                  </div>
                  <button
                    {...action('ship.recipient.remove', () => removeRecipient(r.id), { params: { recipientId: r.id } })}
                    className="shrink-0 cursor-pointer border-none bg-transparent p-1 text-(--app-c-text-muted)"
                  >
                    <IcTrash size={18} />
                  </button>
                </div>
              );
            })
          )}
          <button
            {...bindTap('ship.addressbook.multi.open', { params: { mode: 'multi' } })}
            className="mt-3 w-full cursor-pointer border-none bg-transparent text-center text-[14px] text-(--app-c-brand)"
          >
            + 寄给多个人 ({draft.recipients.length}/30)
          </button>
        </div>

        <div className="mt-2.5 rounded-2xl bg-(--app-c-card-bg) px-3">
          <label className="flex items-center border-b border-(--app-c-divider) py-3 text-[14px]">
            <span className="w-20 shrink-0 text-(--app-c-text-secondary)">商品名称</span>
            <input
              data-action="ship.itemName.input"
              data-action-type="input"
              value={draft.itemName}
              onChange={(e) => patchDraft({ itemName: e.target.value })}
              placeholder="请输入商品名称"
              className="min-w-0 flex-1 border-none bg-transparent text-right text-(--app-c-text-primary) outline-none placeholder:text-(--app-c-text-muted)"
            />
          </label>
          <label className="flex items-center py-3 text-[14px]">
            <span className="w-20 shrink-0 text-(--app-c-text-secondary)">备注</span>
            <input
              data-action="ship.remark.input"
              data-action-type="input"
              value={draft.remark}
              onChange={(e) => patchDraft({ remark: e.target.value })}
              placeholder="选填"
              className="min-w-0 flex-1 border-none bg-transparent text-right text-(--app-c-text-primary) outline-none placeholder:text-(--app-c-text-muted)"
            />
          </label>
        </div>

        {/* 寄件方式 */}
        <div className="mt-2.5 rounded-2xl bg-(--app-c-card-bg) p-3">
          <div className="flex items-center gap-2">
            <span className="mr-1 text-[15px] font-semibold text-(--app-c-text-primary)">寄件方式</span>
            {([
              ['pickup', t('ship.methodPickup'), 'ship.method.select.pickup'],
              ['locker', t('ship.methodLocker'), 'ship.method.select.locker'],
              ['station', t('ship.methodStation'), 'ship.method.select.station'],
            ] as const).map(([m, label]) => {
              const active = draft.method === m;
              const binding =
                m === 'pickup'
                  ? action('ship.method.select.pickup', () => patchDraft({ method: 'pickup', handover: null }))
                  : m === 'locker'
                    ? action('ship.method.select.locker', () => patchDraft({ method: 'locker', handover: null }))
                    : action('ship.method.select.station', () => patchDraft({ method: 'station', handover: null }));
              return (
                <button
                  key={m}
                  {...binding}
                  className={`cursor-pointer rounded-full px-3.5 py-1.5 text-[14px] ${active ? 'border-none bg-[#126BDF] font-semibold text-white' : 'border border-(--app-c-border) bg-(--app-c-card-bg) text-(--app-c-text-primary)'}`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {draft.method === 'pickup' && (
            <>
              {/* 档位 */}
              <div className="mt-3 flex gap-2">
                {([
                  ['standard', '标准寄', '2小时上门'],
                  ['premium', '尊享寄', '1小时上门'],
                  ['large', '寄大件', '当日取'],
                ] as const).map(([tier, name, sub]) => {
                  const active = draft.speedTier === tier;
                  return (
                    <button
                      key={tier}
                      {...action('ship.speed.select.tier', () => patchDraft({ speedTier: tier }), { params: { value: tier } })}
                      className={`flex-1 cursor-pointer rounded-xl px-2 py-2 text-center ${active ? 'border border-(--app-c-brand) bg-[#E5F1FF]' : 'border border-(--app-c-border) bg-(--app-c-card-bg)'}`}
                    >
                      <div className={`text-[15px] font-bold ${active ? 'text-(--app-c-brand)' : 'text-(--app-c-text-primary)'}`}>{name}</div>
                      <div className={`text-[11px] ${active ? 'text-(--app-c-brand)' : 'text-(--app-c-text-muted)'}`}>{sub}</div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-2.5 flex items-center justify-between rounded-lg border border-(--app-c-brand)/40 bg-(--app-c-brand-soft) px-3 py-2 text-[13px] text-(--app-c-brand)">
                最快明日上门, 超时即赔, 全程安全保障 <IcChevronRight size={14} />
              </div>
              <div className="mt-2 border-t border-(--app-c-divider) pt-2.5">
                <div className="text-[14px] text-(--app-c-text-secondary)">快递公司</div>
                <div className="mt-1.5 inline-block rounded-lg border border-(--app-c-brand) bg-(--app-c-brand-soft) px-4 py-2 text-center">
                  <div className="text-[14px] font-semibold text-(--app-c-text-primary)">菜鸟驿站</div>
                  <div className="text-[12px] text-[#F5222D]">¥7/单起</div>
                </div>
              </div>
              <button
                {...bindTap('ship.time.open')}
                className="mt-2 flex w-full cursor-pointer items-center border-t border-(--app-c-divider) bg-transparent pt-2.5 text-[14px]"
              >
                <span className="text-(--app-c-text-secondary)">上门时间</span>
                <span className="ml-auto font-semibold text-(--app-c-brand)">预约 {draft.slotDay} {draft.slot}</span>
                <IcChevronRight size={15} className="text-(--app-c-text-muted)" />
              </button>
            </>
          )}

          {draft.method === 'locker' && (
            <>
              <div className="mt-3 rounded-xl bg-(--app-c-brand-soft) p-3">
                <div className="flex items-center">
                  <span className="min-w-0 flex-1 truncate text-[15px] font-bold text-(--app-c-text-primary)">{selectedLocker.name}</span>
                  <button {...bindTap('ship.lockers.open')} className="flex shrink-0 cursor-pointer items-center border-none bg-transparent text-[13px] text-(--app-c-brand)">
                    查看更多 <IcChevronRight size={13} />
                  </button>
                </div>
                <div className="mt-1 text-[12px] text-(--app-c-text-secondary)">24小时营业 | 剩余格口: 大, 中, 小</div>
                <div className="mt-1 text-[12px]">
                  {selectedLocker.nearest && <span className="rounded bg-(--app-c-brand) px-1 py-0.5 text-[11px] text-white">距离最近</span>}
                  <span className="ml-1.5 text-(--app-c-text-primary)">{selectedLocker.distance}</span>
                  <span className="ml-2 text-(--app-c-text-muted)">任意有空余格口的柜机均可投递</span>
                </div>
              </div>
              <div className="mt-2 flex items-center border-t border-(--app-c-divider) pt-2.5 text-[14px]">
                <span className="text-(--app-c-text-secondary)">取件时间</span>
                <span className="ml-auto font-semibold text-(--app-c-text-primary)">17点后投递, 次日12点前取件</span>
              </div>
              <button
                {...bindTap('ship.locker.cell.open')}
                className="mt-2 flex w-full cursor-pointer items-center border-t border-(--app-c-divider) bg-transparent pt-2.5 text-[14px]"
              >
                <span className="text-(--app-c-text-secondary)">格口信息</span>
                <span className="ml-auto font-semibold text-(--app-c-text-primary)">{draft.lockerCell}</span>
                <IcChevronRight size={15} className="text-(--app-c-text-muted)" />
              </button>
            </>
          )}

          {draft.method === 'station' && (
            <>
              {stations.map((st) => {
                const active = draft.stationId === st.id;
                return (
                  <button
                    key={st.id}
                    {...action('ship.station.select.item', () => patchDraft({ stationId: st.id }), { params: { stationId: st.id } })}
                    className={`relative mt-3 block w-full cursor-pointer rounded-xl p-3 text-left ${active ? 'border border-(--app-c-brand) bg-(--app-c-brand-soft)' : 'border border-(--app-c-border) bg-(--app-c-card-bg)'}`}
                  >
                    {active && <IcCheckCircle size={18} className="absolute right-2 top-2 text-(--app-c-brand)" />}
                    <div className="flex items-center gap-1.5">
                      <span className={`rounded px-1 py-0.5 text-[10px] text-white ${st.official ? 'bg-(--app-c-brand)' : 'bg-[#00B578]'}`}>
                        {st.official ? '官方' : '中通'}
                      </span>
                      {st.distance === '525m' && <span className="rounded bg-(--app-c-brand-soft) px-1 py-0.5 text-[10px] text-(--app-c-brand)">距离最近</span>}
                      <span className="min-w-0 flex-1 truncate text-[15px] font-bold text-(--app-c-text-primary)">{st.name}</span>
                    </div>
                    <div className="mt-1 text-[12px] text-(--app-c-text-secondary)">
                      <span className="text-(--app-c-brand)">{st.distance}</span> | {st.addr}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-[12px] text-(--app-c-text-muted)">
                      🕐 {st.hours}
                      {st.tags.map((tg) => (
                        <span key={tg} className="rounded border border-(--app-c-brand)/40 px-1 text-[10px] text-(--app-c-brand)">{tg}</span>
                      ))}
                    </div>
                    <div className="mt-1 text-[14px] font-bold text-[#F5222D]">{st.price}</div>
                  </button>
                );
              })}
              <button {...action('ship.station.all.wontfixToast', wontfix)} className="mt-2 w-full cursor-pointer border-none bg-transparent py-1 text-center text-[13px] text-(--app-c-text-muted)">
                查看全部 ›
              </button>
              <div className="mt-1 flex items-center border-t border-(--app-c-divider) pt-2.5 text-[14px]">
                <span className="text-(--app-c-text-secondary)">增值服务</span>
                <button
                  {...action('ship.station.recyclebox.toggle', () => patchDraft({ recycleBox: !draft.recycleBox }))}
                  className={`ml-auto cursor-pointer rounded-full border px-3 py-1 text-[13px] ${draft.recycleBox ? 'border-[#00B578] bg-(--app-c-chip-bg) text-[#00B578]' : 'border-(--app-c-border) bg-(--app-c-card-bg) text-(--app-c-text-secondary)'}`}
                >
                  {draft.recycleBox ? '✓ ' : ''}愿意使用旧纸箱包装
                </button>
              </div>
            </>
          )}
        </div>

        {/* 运费/优惠/付款/保价 */}
        <div className="mt-2.5 rounded-2xl bg-(--app-c-card-bg) px-3">
          <button {...bindTap('ship.item.prohibited.open')} className="flex w-full cursor-pointer items-center border-none bg-transparent py-3 text-[14px]">
            <span className="text-(--app-c-text-secondary)">禁寄品查询</span>
            <span className="ml-auto text-[13px] text-(--app-c-brand)">什么不能寄?</span>
            <IcChevronRight size={15} className="ml-1 text-(--app-c-text-muted)" />
          </button>
          <button {...bindTap('ship.pricing.open')} className="flex w-full cursor-pointer items-center border-none bg-transparent py-3 text-[14px]">
            <span className="text-(--app-c-text-secondary)">运费报价</span>
            <span className="ml-auto text-(--app-c-text-primary)">
              当前 <span className="font-bold text-[#F5222D]">¥{fee ? fee.total : 7}/单起</span>, 再下1单享{' '}
              <span className="font-bold text-[#F5222D]">¥{fee ? Math.max(3.8, Math.round((fee.total - 0.6) * 10) / 10) : 6.1}/单起</span>
            </span>
            <IcChevronRight size={15} className="text-(--app-c-text-muted)" />
          </button>
          <button {...bindTap('ship.item.rules.open')} className="flex w-full cursor-pointer items-center border-t border-(--app-c-divider) bg-transparent py-3 text-[14px]">
            <span className="text-(--app-c-text-secondary)">计费规则</span>
            <span className="ml-auto text-[13px] text-(--app-c-text-muted)">重量与体积计费方式</span>
            <IcChevronRight size={15} className="ml-1 text-(--app-c-text-muted)" />
          </button>
          <button {...action('ship.coupon.wontfixToast', wontfix)} className="flex w-full cursor-pointer items-center border-t border-(--app-c-divider) bg-transparent py-3 text-[14px]">
            <span className="text-(--app-c-text-secondary)">优惠</span>
            <IcChevronRight size={15} className="ml-auto text-(--app-c-text-muted)" />
          </button>
          <button {...action('ship.payment.wontfixToast', wontfix)} className="flex w-full cursor-pointer items-center border-t border-(--app-c-divider) bg-transparent py-3 text-[14px]">
            <span className="text-(--app-c-text-secondary)">付款方式</span>
            <span className="ml-1 rounded bg-[#F5222D] px-1 text-[10px] text-white">新</span>
            <span className="ml-auto text-(--app-c-text-primary)">寄付现结</span>
            <IcChevronRight size={15} className="text-(--app-c-text-muted)" />
          </button>
          <div className="border-t border-(--app-c-divider) py-3">
            <div className="flex items-center text-[14px]">
              <IcShield size={16} className="text-(--app-c-brand)" />
              <span className="ml-1 font-semibold text-(--app-c-text-primary)">放心保</span>
              <span className="ml-1 text-[12px] text-(--app-c-text-muted)">| 细则</span>
              <span className="ml-auto text-[12px] text-(--app-c-text-secondary)">专人对接 · 最快48H理赔到账</span>
            </div>
            <div className="mt-2 flex gap-2">
              {([
                ['none', '无保价', '最高赔付10倍运费'],
                ['p500', '最高赔付500元', '¥1'],
                ['p1000', '最高赔付1000元', '¥2'],
              ] as const).map(([tier, name, sub]) => {
                const active = draft.insurance === tier;
                return (
                  <button
                    key={tier}
                    {...action('ship.insurance.select.tier', () => patchDraft({ insurance: tier }), { params: { value: tier } })}
                    className={`flex-1 cursor-pointer rounded-lg px-1 py-1.5 text-center ${active ? 'border border-(--app-c-brand) bg-[#E5F1FF]' : 'border border-(--app-c-border) bg-(--app-c-card-bg)'}`}
                  >
                    <div className={`text-[12px] font-semibold ${active ? 'text-(--app-c-brand)' : 'text-(--app-c-text-primary)'}`}>{name}</div>
                    <div className="text-[11px] text-(--app-c-text-muted)">{sub}</div>
                  </button>
                );
              })}
            </div>
            <button {...bindTap('ship.insurance.custom.open')} className="mt-2 flex w-full cursor-pointer items-center border-none bg-transparent text-[13px] text-(--app-c-text-secondary)">
              自定义物品价值{draft.insurance === 'custom' ? `(¥${draft.insuranceValue})` : ''} <span className="ml-auto text-(--app-c-brand)">去填写 ›</span>
            </button>
          </div>
        </div>

        {/* 协议 */}
        <div className="flex items-center px-1 py-3">
          <button
            {...action('ship.agreement.toggle', () => patchDraft({ agreement: !draft.agreement }))}
            className={`flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border ${draft.agreement ? 'border-(--app-c-brand) bg-(--app-c-brand) text-white' : 'border-[#BBB] bg-(--app-c-card-bg) text-transparent'}`}
          >
            ✓
          </button>
          <span className="ml-2 text-[12px] text-(--app-c-text-secondary)">我已阅读并同意《服务协议》《证照信息》</span>
        </div>
      </div>

      {/* 底部提交栏 */}
      <div className="flex shrink-0 items-center bg-(--app-c-card-bg) px-4 pb-4 pt-2.5">
        {fee ? (
          <div className="flex items-baseline gap-1">
            <span className="text-[13px] text-(--app-c-text-primary)">{t('ship.estimate')}</span>
            <span className="text-[14px] font-bold text-[#F5222D]">¥</span>
            <span className="text-[24px] font-extrabold text-[#F5222D]">{fee.total}</span>
            <button {...bindTap('ship.fee.open')} className="ml-1 cursor-pointer border-none bg-transparent text-[13px] text-(--app-c-text-secondary)">
              明细
            </button>
          </div>
        ) : (
          <span className="text-[13px] text-(--app-c-text-secondary)">{t('ship.fillFirst')}</span>
        )}
        {canSubmit ? (
          <button
            {...bindTap('ship.order.submit', {
              beforeTrigger: () => { submitOrder(); },
              nav: modify ? { popTo: '/ship/order/detail' } : undefined,
            })}
            className="ml-auto h-11 cursor-pointer rounded-full border-none bg-gradient-to-r from-[#1C7FFE] to-[#126BDF] px-8 text-[16px] font-bold text-white"
          >
            {modify ? t('ship.confirmModify') : t('ship.submit')}
          </button>
        ) : (
          <div className="ml-auto flex h-11 items-center rounded-full bg-[#B9CDF3] px-8 text-[16px] font-bold text-white">
            {modify ? t('ship.confirmModify') : t('ship.submit')}
          </div>
        )}
      </div>

      {sheet === 'item' && <ItemSheet />}
      {sheet === 'time' && <TimeSheet />}
      {sheet === 'handover' && <HandoverSheet />}
      {sheet === 'insuranceCustom' && <InsuranceCustomSheet />}
      {sheet === 'fee' && <FeeSheet />}
      {sheet === 'lockerCell' && <LockerCellSheet />}
    </div>
  );
}

/** 物品信息弹层(spec ship.item.sheet) */
function ItemSheet() {
  const { bindTap, action, back } = useCainiaoGestures();
  const draft = useCainiaoStore((s) => s.draft);
  const editingId = useCainiaoStore((s) => s._temp.editingRecipientId);
  const patchRecipientItem = useCainiaoStore((s) => s.patchRecipientItem);
  const showToast = useCainiaoStore((s) => s.showToast);
  const r: Recipient | undefined = draft.recipients.find((x) => x.id === editingId) ?? draft.recipients[0];
  const [typeExpanded, setTypeExpanded] = React.useState(!r?.itemType);
  if (!r) return null;

  return (
    <Sheet
      title="物品信息"
      titleExtra={
        <button {...bindTap('ship.item.prohibited.open')} className="ml-3 cursor-pointer border-none bg-transparent text-[13px] text-(--app-c-brand)">
          什么不能寄?
        </button>
      }
    >
      <div className="text-[14px] font-semibold text-(--app-c-text-primary)">
        物品类型 <span className="rounded bg-[#FFECEC] px-1 text-[10px] text-[#F5222D]">必填</span>
      </div>
      {r.itemType && !typeExpanded ? (
        <div className="mt-2">
          <span className="relative inline-block rounded-lg border border-(--app-c-brand) bg-[#E5F1FF] px-5 py-2 text-[14px] text-(--app-c-brand)">
            {r.itemType}
            <button
              {...action('ship.item.type.remove', () => { patchRecipientItem({ itemType: '' }); setTypeExpanded(true); })}
              className="absolute -right-2 -top-2 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border-none bg-[#666] text-[11px] text-white"
            >
              ✕
            </button>
          </span>
        </div>
      ) : (
        <>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {ITEM_TYPES.map((tp) => (
              <button
                key={tp}
                {...action('ship.item.select.type', () => {
                  patchRecipientItem({ itemType: tp, weightKg: ITEM_REF_WEIGHT[tp] ?? 1 });
                  setTypeExpanded(false);
                  showToast(`${tp} 参考重量: ${ITEM_REF_WEIGHT[tp] ?? 1}kg`);
                }, { params: { value: tp } })}
                className="cursor-pointer rounded-lg border border-(--app-c-border) bg-(--app-c-card-bg) py-2.5 text-[14px] text-(--app-c-text-primary)"
              >
                {tp}
              </button>
            ))}
          </div>
          <div className="mt-2 flex items-center rounded-lg bg-(--app-c-brand-soft) px-3 py-2">
            <input
              data-action="ship.item.input.customType"
              data-action-type="input"
              placeholder="请输入物品类型"
              onChange={(e) => patchRecipientItem({ itemType: e.target.value })}
              className="min-w-0 flex-1 border-none bg-transparent text-[13px] outline-none placeholder:text-(--app-c-text-muted)"
            />
            <button {...action('ship.item.camera.wontfixToast', () => showToast('该功能暂未开放'))} className="cursor-pointer border-none bg-transparent text-(--app-c-brand)">
              📷
            </button>
          </div>
        </>
      )}

      <div className="mt-4 flex items-center">
        <span className="text-[14px] font-semibold text-(--app-c-text-primary)">
          设置重量<span className="text-[12px] font-normal text-(--app-c-text-muted)">(kg)</span>{' '}
          <span className="rounded bg-[#FFECEC] px-1 text-[10px] text-[#F5222D]">必填</span>
        </span>
        <div className="ml-auto flex items-center overflow-hidden rounded-lg border border-(--app-c-border)">
          <button {...action('ship.item.weight.step', () => patchRecipientItem({ weightKg: Math.max(1, r.weightKg - 1) }))} className="cursor-pointer border-none bg-(--app-c-chip-bg) px-3 py-1.5 text-(--app-c-text-primary)">
            <IcMinus size={15} />
          </button>
          <input
            data-action="ship.item.input.weight"
            data-action-type="input"
            inputMode="numeric"
            value={r.weightKg}
            onChange={(e) => patchRecipientItem({ weightKg: Math.max(1, parseInt(e.target.value, 10) || 1) })}
            className="w-14 border-none bg-(--app-c-card-bg) text-center text-[15px] outline-none"
          />
          <button {...action('ship.item.weight.step', () => patchRecipientItem({ weightKg: r.weightKg + 1 }))} className="cursor-pointer border-none bg-(--app-c-chip-bg) px-3 py-1.5 text-(--app-c-text-primary)">
            <IcPlus size={15} />
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center">
        <span className="text-[14px] font-semibold text-(--app-c-text-primary)">设置体积</span>
        <button
          {...action('ship.item.volume.toggle', () => patchRecipientItem({ volumeOn: !r.volumeOn }))}
          className={`ml-auto h-6 w-11 cursor-pointer rounded-full border-none p-0.5 transition-colors ${r.volumeOn ? 'bg-(--app-c-brand)' : 'bg-[#D9DEE7]'}`}
        >
          <span className={`block h-5 w-5 rounded-full bg-(--app-c-card-bg) transition-transform ${r.volumeOn ? 'translate-x-5' : ''}`} />
        </button>
      </div>
      {r.volumeOn && (
        <div className="mt-2 flex items-center gap-2 rounded-lg bg-(--app-c-chip-bg) p-2.5">
          {(['l', 'w', 'h'] as const).map((k, i) => (
            <React.Fragment key={k}>
              {i > 0 && <span className="text-(--app-c-text-muted)">×</span>}
              <div className="flex flex-1 items-center rounded bg-(--app-c-card-bg) px-2 py-1.5">
                <input
                  data-action="ship.item.input.dims"
                  data-action-type="input"
                  inputMode="numeric"
                  placeholder={k === 'l' ? '长' : k === 'w' ? '宽' : '高'}
                  value={r.dims[k]}
                  onChange={(e) => patchRecipientItem({ dims: { ...r.dims, [k]: e.target.value.replace(/[^\d.]/g, '') } })}
                  className="w-full min-w-0 border-none bg-transparent text-[13px] outline-none placeholder:text-(--app-c-text-muted)"
                />
                <span className="text-[11px] text-(--app-c-text-muted)">cm</span>
              </div>
            </React.Fragment>
          ))}
        </div>
      )}

      <div className="mt-4 text-[13px] text-(--app-c-text-secondary)">重量/体积计费规则:</div>
      <div className="mt-2 flex gap-2 rounded-lg bg-(--app-c-chip-bg) p-3 text-center">
        {[['又小又轻', '按重量计费'], ['又大又轻', '按体积计费'], ['又大又重', '重量体积取高计费']].map(([a, b]) => (
          <div key={a} className="flex-1">
            <div className="text-[13px] font-semibold text-(--app-c-text-primary)">{a}</div>
            <div className="text-[11px] text-(--app-c-text-muted)">{b}</div>
          </div>
        ))}
      </div>
      <div className="mt-2 text-[11px] leading-4 text-(--app-c-text-muted)">
        重要提示: 1.因体积大/不规则包裹占用更多空间资源, 重量、体积取较高值计费。
        2.若按体积计费: 体积重量=长×宽×高(cm)÷8000。 3.若按重量计费: 运费=首重+续重。详见{' '}
        <button {...bindTap('ship.item.rules.open')} className="cursor-pointer border-none bg-transparent p-0 text-[11px] text-(--app-c-brand)">
          计费规则
        </button>
      </div>

      <button
        {...action('ship.item.confirm', () => { if (!r.itemType) patchRecipientItem({ itemType: '日用品' }); back(); })}
        className="mt-4 h-12 w-full cursor-pointer rounded-full border-none bg-(--app-c-brand) text-[16px] font-bold text-white"
      >
        确定
      </button>
    </Sheet>
  );
}

/** 选择上门时间弹层(spec ship.time.sheet):点时段立即回填关闭(Q12) */
function TimeSheet() {
  const { action, back } = useCainiaoGestures();
  const draft = useCainiaoStore((s) => s.draft);
  const patchDraft = useCainiaoStore((s) => s.patchDraft);
  const days = ['今天', '明天', '后天'] as const;

  return (
    <Sheet title="选择上门时间">
      <div className="text-[13px] text-(--app-c-brand)">准时上门 · 超时赔</div>
      <div className="mt-2 rounded-lg bg-(--app-c-brand-soft) px-3 py-2 text-[12px] leading-5 text-(--app-c-text-primary)">
        快递员将在预约时间内上门, <span className="text-(--app-c-brand)">请提前准备好包裹哦</span>, 如果您不方便接电话,
        可在下单时<span className="text-(--app-c-brand)">设置交件方式</span>, 或下单成功后在订单详情设置。
      </div>
      <div className="mt-3 flex" style={{ minHeight: 260 }}>
        <div className="w-24 shrink-0 bg-(--app-c-chip-bg)">
          {days.map((d) => {
            const disabled = d === '今天'; // 今天时段已过(s136:今天灰)
            const active = draft.slotDay === d;
            return (
              <button
                key={d}
                {...action('ship.time.select.day', () => { if (!disabled) patchDraft({ slotDay: d }); }, { params: { value: d } })}
                className={`block w-full border-none py-3.5 text-center text-[15px] ${
                  disabled ? 'cursor-default bg-(--app-c-chip-bg) text-(--app-c-text-muted)' : active ? 'cursor-pointer bg-(--app-c-card-bg) font-semibold text-(--app-c-brand)' : 'cursor-pointer bg-(--app-c-chip-bg) text-(--app-c-text-primary)'
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>
        <div className="min-w-0 flex-1 pl-3">
          {TIME_SLOTS.map((slot) => {
            const active = draft.slot === slot;
            return (
              <button
                key={slot}
                {...action('ship.time.select.slot', () => { patchDraft({ slot }); back(); }, { params: { value: slot } })}
                className="flex w-full cursor-pointer items-center border-b border-(--app-c-divider) bg-transparent py-3.5 text-[16px]"
              >
                <span className={active ? 'font-semibold text-(--app-c-brand)' : 'text-(--app-c-text-primary)'}>{slot}</span>
                {active && <IcCheckCircle size={18} className="ml-auto text-(--app-c-brand)" />}
              </button>
            );
          })}
        </div>
      </div>
    </Sheet>
  );
}

/** 交件方式弹层(spec ship.handover.sheet) */
function HandoverSheet() {
  const { action, back } = useCainiaoGestures();
  const draft = useCainiaoStore((s) => s.draft);
  const patchDraft = useCainiaoStore((s) => s.patchDraft);
  const [place, setPlace] = React.useState(draft.handover?.place ?? '当面交件');
  const [note, setNote] = React.useState(draft.handover?.note ?? '需要打电话');
  const [extras, setExtras] = React.useState<string[]>(draft.handover?.extras ?? []);

  const chip = (label: string, on: boolean, binding: object) => (
    <button
      key={label}
      {...binding}
      className={`cursor-pointer rounded-lg border px-3.5 py-2 text-[14px] ${on ? 'border-(--app-c-brand) bg-[#E5F1FF] font-semibold text-(--app-c-brand)' : 'border-(--app-c-border) bg-(--app-c-card-bg) text-(--app-c-text-primary)'}`}
    >
      {label}
    </button>
  );

  return (
    <Sheet title="交件方式">
      <div className="text-[14px] font-semibold text-(--app-c-text-primary)">
        包裹放置地点 <span className="rounded bg-[#FFECEC] px-1 text-[10px] text-[#F5222D]">必填</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {HANDOVER_PLACES.map((p) => chip(p, place === p, action('ship.handover.select.place', () => setPlace(p), { params: { value: p } })))}
      </div>
      <div className="mt-4 text-[14px] font-semibold text-(--app-c-text-primary)">
        上门备注 <span className="rounded bg-[#FFECEC] px-1 text-[10px] text-[#F5222D]">必填</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {HANDOVER_NOTES.map((n) => chip(n, note === n, action('ship.handover.select.note', () => setNote(n), { params: { value: n } })))}
      </div>
      <div className="mt-4 text-[14px] font-semibold text-(--app-c-text-primary)">其他备注</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {HANDOVER_EXTRAS.map((x) =>
          chip(x, extras.includes(x), action('ship.handover.select.extra', () => setExtras((cur) => (cur.includes(x) ? cur.filter((v) => v !== x) : [...cur, x])), { params: { value: x } })),
        )}
      </div>
      <button
        {...action('ship.handover.save', () => { patchDraft({ handover: { place, note, extras } }); back(); })}
        className="mt-5 h-12 w-full cursor-pointer rounded-full border-none bg-(--app-c-brand) text-[16px] font-bold text-white"
      >
        保存
      </button>
    </Sheet>
  );
}

/** 自定义物品价值弹层(qa:Q10) */
function InsuranceCustomSheet() {
  const { action, back } = useCainiaoGestures();
  const patchDraft = useCainiaoStore((s) => s.patchDraft);
  const [value, setValue] = React.useState('');
  const fee = Math.max(1, Math.round((parseFloat(value) || 0) * 0.01));

  return (
    <Sheet title="自定义物品价值">
      <div className="flex items-center rounded-lg bg-(--app-c-chip-bg) px-3 py-2.5">
        <span className="text-[15px] text-(--app-c-text-primary)">物品价值</span>
        <input
          data-action="ship.insurance.custom.input"
          data-action-type="input"
          inputMode="numeric"
          value={value}
          onChange={(e) => setValue(e.target.value.replace(/[^\d]/g, ''))}
          placeholder="请输入物品价值"
          className="ml-3 min-w-0 flex-1 border-none bg-transparent text-right text-[15px] outline-none placeholder:text-(--app-c-text-muted)"
        />
        <span className="ml-1 text-[14px] text-(--app-c-text-secondary)">元</span>
      </div>
      <div className="mt-2 text-[12px] text-(--app-c-text-muted)">保费按物品价值 1% 计收, 最低 ¥1{value ? `; 当前保费 ¥${fee}` : ''}</div>
      <button
        {...action('ship.insurance.custom.confirm', () => {
          patchDraft({ insurance: 'custom', insuranceValue: parseFloat(value) || 0 });
          back();
        })}
        className="mt-5 h-12 w-full cursor-pointer rounded-full border-none bg-(--app-c-brand) text-[16px] font-bold text-white"
      >
        确定
      </button>
    </Sheet>
  );
}

/** 费用明细浮层(qa:Q11) */
function FeeSheet() {
  const draft = useCainiaoStore((s) => s.draft);
  const addresses = useCainiaoStore((s) => s.addresses);
  const fee = estimateFee(draft, addresses);

  return (
    <Sheet title="费用明细">
      {fee ? (
        <div className="text-[14px]">
          {draft.recipients.map((r) => {
            const addr = addresses.find((a) => a.id === r.addressId);
            return (
              <div key={r.id} className="flex items-center justify-between border-b border-(--app-c-divider) py-2.5">
                <span className="text-(--app-c-text-secondary)">基础运费(寄{addr?.city ?? ''} · 计费{chargeWeight(r)}kg)</span>
                <span className="text-(--app-c-text-primary)">¥{baseFeeFor(addr?.province ?? '', chargeWeight(r))}</span>
              </div>
            );
          })}
          {fee.methodExtra > 0 && (
            <div className="flex items-center justify-between border-b border-(--app-c-divider) py-2.5">
              <span className="text-(--app-c-text-secondary)">寄件方式附加</span>
              <span className="text-(--app-c-text-primary)">¥{fee.methodExtra}</span>
            </div>
          )}
          {fee.insurance > 0 && (
            <div className="flex items-center justify-between border-b border-(--app-c-divider) py-2.5">
              <span className="text-(--app-c-text-secondary)">保价费</span>
              <span className="text-(--app-c-text-primary)">¥{insuranceFee(draft)}</span>
            </div>
          )}
          <div className="flex items-center justify-between py-3">
            <span className="font-semibold text-(--app-c-text-primary)">合计(预估)</span>
            <span className="text-[18px] font-extrabold text-[#F5222D]">¥{fee.total}</span>
          </div>
        </div>
      ) : (
        <div className="py-6 text-center text-[13px] text-(--app-c-text-muted)">填写收寄地址后查看明细</div>
      )}
    </Sheet>
  );
}

/** 格口信息弹层(a179;阶段④二轮:卡可点选回填) */
function LockerCellSheet() {
  const { bindTap, action } = useCainiaoGestures();
  const draft = useCainiaoStore((s) => s.draft);
  const patchDraft = useCainiaoStore((s) => s.patchDraft);
  const cells = [
    { name: '小格口', weight: '参考重量1kg', dims: '34cm × 45cm × 8cm', desc: '文件、书籍、手机等' },
    { name: '中格口', weight: '参考重量3kg', dims: '34cm × 45cm × 19cm', desc: '衣服、背包、鞋子等' },
    { name: '大格口', weight: '参考重量5kg', dims: '34cm × 45cm × 29cm', desc: '厚外套、棉被等' },
  ] as const;

  return (
    <Sheet
      title="格口信息"
      titleExtra={
        <button {...bindTap('ship.locker.cell.prohibited.open')} className="ml-3 cursor-pointer border-none bg-transparent text-[13px] text-(--app-c-brand)">
          什么不能寄?
        </button>
      }
    >
      <div className="text-[12px] text-(--app-c-text-muted)">示例仅做参考, 您可到柜选择格口</div>
      {cells.map((c) => {
        const active = draft.lockerCell === c.name;
        return (
          <button
            key={c.name}
            {...action('ship.locker.cell.select.size', () => patchDraft({ lockerCell: c.name }), { params: { value: c.name } })}
            className={`mt-3 flex w-full cursor-pointer items-center gap-3 rounded-xl p-3.5 text-left ${active ? 'border border-(--app-c-brand) bg-(--app-c-brand-soft)' : 'border border-(--app-c-border) bg-(--app-c-card-bg)'}`}
          >
            <div className="flex h-16 w-24 shrink-0 flex-col items-center justify-center rounded bg-gradient-to-br from-(--app-c-header-to) to-[#1677FF] text-white">
              <span className="text-[11px] font-semibold">{c.weight}</span>
              <span className="mt-0.5 text-[9px]">{c.dims}</span>
            </div>
            <div>
              <div className={`text-[17px] font-bold ${active ? 'text-(--app-c-brand)' : 'text-(--app-c-text-primary)'}`}>{c.name}</div>
              <div className="mt-0.5 text-[13px] text-(--app-c-text-secondary)">{c.desc}</div>
            </div>
            {active && <IcCheckCircle size={18} className="ml-auto shrink-0 text-(--app-c-brand)" />}
          </button>
        );
      })}
    </Sheet>
  );
}
