import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { IcNavBack, IcChevronRight, IcClose, IcMapPin } from '../res/icons';
import { useSuningGestures } from '../hooks/useSuningGestures';
import { useSuningStore } from '../state';
import { useStrings } from '../i18n';
import { HOT_CITIES, regionOptionsAt, parseAddressText } from '../utils/order';
import type { AddressDraft } from '../types';

const BLANK: AddressDraft = {
  id: null,
  name: '',
  phone: '198****0000',
  province: '',
  city: '',
  district: '',
  street: '',
  detail: '',
  tag: '',
  customLabels: [],
  isDefault: false,
};

/**
 * 新增 / 编辑收货地址(spec address.edit,s310~s315)。
 * ?addressId= 空为新增;?sheet=region 四级地区选择器、?dialog=addLabel 添加标签弹窗均 URL 驱动。
 * 表单草稿放 addressDraft,入口 transition 先清草稿,本页再按 addressId 重建。
 */
export default function AddressEditPage() {
  const { bindTap, action, bindBack, back } = useSuningGestures();
  const S = useStrings();
  const [searchParams] = useSearchParams();
  const addressId = searchParams.get('addressId') ?? '';
  const sheetOpen = searchParams.get('sheet') === 'region';
  const dialogOpen = searchParams.get('dialog') === 'addLabel';

  const addresses = useSuningStore((s) => s.addresses);
  const draft = useSuningStore((s) => s.addressDraft);
  const fromCheckout = useSuningStore((s) => s._temp.addressEditFromCheckout);
  const pasteText = useSuningStore((s) => s._temp.addressPasteDraft);
  const setAddressDraft = useSuningStore((s) => s.setAddressDraft);
  const setTemp = useSuningStore((s) => s.setTemp);
  const showToast = useSuningStore((s) => s.showToast);
  const saveAddress = useSuningStore((s) => s.saveAddress);
  const setCheckoutAddress = useSuningStore((s) => s.setCheckoutAddress);

  /* 草稿由入口 transition 清空后在此重建;弹层/弹窗只改 search,本组件不卸载,草稿不会被冲掉 */
  useEffect(() => {
    if (draft) return;
    const a = addresses.find((x) => x.id === addressId);
    if (!a) {
      setAddressDraft({ ...BLANK });
      return;
    }
    const tag = a.tags.find((t) => t !== '默认') ?? '';
    const preset = (['家', '公司', '学校'] as string[]).includes(tag);
    setAddressDraft({
      id: a.id,
      name: a.name,
      phone: a.phone,
      province: a.province,
      city: a.city,
      district: a.district,
      street: a.street,
      detail: a.detail,
      tag,
      customLabels: tag && !preset ? [tag] : [],
      isDefault: a.isDefault,
    });
  }, [draft, addressId, addresses, setAddressDraft]);

  const form = draft ?? BLANK;
  const wontfix = () => showToast(S.toastNotOpen);
  /* 标签单选:再点一次取消选中 */
  const pickTag = (label: string) => setAddressDraft({ tag: form.tag === label ? '' : label });
  const regionText = form.province
    ? `${form.province}${form.city}${form.district}${form.street}`
    : S.addrRegionPlaceholder;

  const parsePaste = () => {
    const parsed = parseAddressText(pasteText);
    if (!parsed) {
      showToast(S.toastParseFailed);
      return;
    }
    const [province = '', city = '', district = '', street = ''] = parsed.region;
    setAddressDraft({
      name: parsed.name || form.name,
      phone: parsed.phone || form.phone,
      province,
      city,
      district,
      street,
      detail: parsed.detail || form.detail,
    });
    setTemp({ addressPasteDraft: '' });
    showToast(S.toastParseOk);
  };

  const save = () => {
    if (!form.name || !form.phone || !form.province || !form.detail) {
      showToast(S.toastAddressIncomplete);
      return;
    }
    const id = saveAddress({
      id: form.id ?? undefined,
      name: form.name,
      phone: form.phone,
      province: form.province,
      city: form.city,
      district: form.district,
      street: form.street,
      detail: form.detail,
      tags: form.tag ? [form.tag] : [],
      isDefault: form.isDefault,
    });
    // 自结算页地址选择器进入时「保存并使用」:保存项即本单选中地址
    if (fromCheckout) {
      setCheckoutAddress(id);
      setTemp({ addressEditFromCheckout: false });
    }
    showToast(S.toastAddressSaved);
    back();
  };

  return (
    <div className="relative flex h-full flex-col bg-[var(--app-bg)]">
      <div className="flex shrink-0 items-center gap-1 bg-[var(--app-surface)] px-2 pb-2 pt-10">
        <button {...bindBack()} className="cursor-pointer border-none bg-transparent p-1 text-[var(--app-text)]">
          <IcNavBack size={24} />
        </button>
        <span className="min-w-0 flex-1 text-center text-[16px] font-bold text-[var(--app-text)]">
          {form.id ? S.addressEditTitle : S.addressEditNewTitle}
        </span>
        <span className="w-7 shrink-0" />
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5 pt-2"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {/* 表单卡:收件人 / 手机号码 / 所在地区 / 详细地址 */}
        <div className="rounded-xl bg-[var(--app-surface)] px-3">
          <Field label={S.addrRecipient}>
            <input
              data-action="address.edit.recipient.input"
              data-action-type="input"
              value={form.name}
              onChange={(e) => setAddressDraft({ name: e.target.value })}
              placeholder={S.addrRecipientPlaceholder}
              data-keep-keyboard="true"
              className="w-full border-none bg-transparent text-[13px] text-[var(--app-text)] outline-none placeholder:text-[var(--app-c-text-muted)]"
            />
          </Field>
          <Field label={S.addrPhone}>
            <input
              data-action="address.edit.phone.input"
              data-action-type="input"
              value={form.phone}
              inputMode="tel"
              onChange={(e) => setAddressDraft({ phone: e.target.value })}
              placeholder={S.addrPhonePlaceholder}
              data-keep-keyboard="true"
              className="w-full border-none bg-transparent text-[13px] text-[var(--app-text)] outline-none placeholder:text-[var(--app-c-text-muted)]"
            />
          </Field>
          <div className="flex items-center border-b border-[var(--app-border)] py-3">
            <span className="w-20 shrink-0 text-[13px] text-[var(--app-text-muted)]">{S.addrRegion}</span>
            <button
              {...bindTap('address.edit.region.open', {
                beforeTrigger: () => setTemp({ addressRegion: [] }),
              })}
              className="flex min-w-0 flex-1 cursor-pointer items-center gap-0.5 border-none bg-transparent p-0 text-left"
            >
              <span className={`min-w-0 flex-1 truncate text-[13px] ${form.province ? 'text-[var(--app-text)]' : 'text-[var(--app-c-text-muted)]'}`}>
                {regionText}
              </span>
              <IcChevronRight size={13} className="shrink-0 text-[var(--app-c-text-muted)]" />
            </button>
          </div>
          <div className="flex items-start py-3">
            <span className="w-20 shrink-0 pt-0.5 text-[13px] text-[var(--app-text-muted)]">{S.addrDetail}</span>
            <textarea
              data-action="address.edit.detail.input"
              data-action-type="input"
              value={form.detail}
              rows={2}
              onChange={(e) => setAddressDraft({ detail: e.target.value })}
              placeholder={S.addrDetailPlaceholder}
              data-keep-keyboard="true"
              className="min-w-0 flex-1 resize-none border-none bg-transparent text-[13px] leading-5 text-[var(--app-text)] outline-none placeholder:text-[var(--app-c-text-muted)]"
            />
            {/* 定位:无地图 SDK(范围铁律),给 toast 不留死区 */}
            <button
              {...action('address.edit.wontfix.toast', wontfix)}
              className="flex shrink-0 cursor-pointer flex-col items-center border-none bg-transparent p-0 text-[10px] text-[var(--app-primary)]"
            >
              <IcMapPin size={15} />
              {S.addrLocate}
            </button>
          </div>
        </div>

        {/* 粘贴地址自动识别条(轻实现:正则拆填,不接外部能力) */}
        <div className="mt-2 rounded-xl bg-[var(--app-surface)] px-3 py-2.5">
          <div className="flex items-center">
            <span className="min-w-0 flex-1 text-[13px] font-bold text-[var(--app-text)]">{S.addrPasteTitle}</span>
            <button
              {...action('address.edit.pasteParse.run', parsePaste)}
              className="shrink-0 cursor-pointer rounded-full border-none bg-[#FFF3E8] px-3 py-1 text-[12px] text-[var(--app-primary)]"
            >
              {S.addrParseBtn}
            </button>
          </div>
          <textarea
            value={pasteText}
            rows={2}
            onChange={(e) => setTemp({ addressPasteDraft: e.target.value })}
            placeholder={S.addrPastePlaceholder}
            data-keep-keyboard="true"
            className="mt-1.5 w-full resize-none rounded-lg bg-[var(--app-c-chip-bg)] px-2 py-2 text-[12px] leading-4 text-[var(--app-text)] outline-none placeholder:text-[var(--app-c-text-muted)]"
          />
        </div>

        {/* 标签行 + 设置默认地址开关 */}
        <div className="mt-2 rounded-xl bg-[var(--app-surface)] px-3 py-2.5">
          <div className="flex items-start gap-2">
            <span className="w-16 shrink-0 pt-1 text-[13px] text-[var(--app-text-muted)]">{S.addrLabelRow}</span>
            <div className="flex min-w-0 flex-1 flex-wrap gap-2">
              {/* 预设标签三项单选;id 必须是字面量,故逐个展开而非表驱动 */}
              <button
                {...action('address.edit.select.home', () => pickTag(S.addrLabelHome))}
                className={tagClass(form.tag === S.addrLabelHome)}
              >
                {S.addrLabelHome}
              </button>
              <button
                {...action('address.edit.select.company', () => pickTag(S.addrLabelCompany))}
                className={tagClass(form.tag === S.addrLabelCompany)}
              >
                {S.addrLabelCompany}
              </button>
              <button
                {...action('address.edit.select.school', () => pickTag(S.addrLabelSchool))}
                className={tagClass(form.tag === S.addrLabelSchool)}
              >
                {S.addrLabelSchool}
              </button>
              {form.customLabels.map((label) => (
                <span key={label} className={`inline-flex items-center gap-1 ${tagClass(form.tag === label)}`}>
                  {/* 点文字=选中;点「编辑」才开弹窗(走查 0729) */}
                  <button
                    type="button"
                    {...action('address.edit.select.school', () => pickTag(label))}
                    className="cursor-pointer border-none bg-transparent p-0 text-inherit"
                  >
                    {label}
                  </button>
                  <button
                    type="button"
                    {...bindTap('address.edit.editLabel.open', {
                      beforeTrigger: () => setTemp({ addressLabelDraft: label }),
                    })}
                    className="cursor-pointer border-none bg-transparent p-0 text-[10px] text-[var(--app-c-text-muted)]"
                  >
                    {S.addrLabelEdit}
                  </button>
                </span>
              ))}
              <button
                {...bindTap('address.edit.addLabel.open', {
                  beforeTrigger: () => setTemp({ addressLabelDraft: '' }),
                })}
                className="cursor-pointer rounded-full border border-dashed border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1 text-[12px] text-[var(--app-text-muted)]"
              >
                {S.addrLabelCustom}
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center border-t border-[var(--app-border)] pt-3">
            <span className="min-w-0 flex-1 text-[13px] text-[var(--app-text)]">{S.addrSetDefault}</span>
            <button
              {...action('address.edit.defaultSwitch.toggle', () => setAddressDraft({ isDefault: !form.isDefault }))}
              className={`flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-none p-0.5 ${
                form.isDefault ? 'justify-end bg-[var(--app-primary)]' : 'justify-start bg-[#E5E5E5]'
              }`}
            >
              <span className="h-5 w-5 rounded-full bg-[var(--app-surface)]" />
            </button>
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2">
        <button
          {...action('address.edit.form.save', save)}
          className="w-full cursor-pointer rounded-full border-none bg-gradient-to-r from-[var(--app-primary)] to-[var(--app-primary-dark)] py-2.5 text-[15px] font-bold text-white"
        >
          {S.saveAndUse}
        </button>
      </div>

      {sheetOpen && <RegionSheet />}
      {dialogOpen && <AddLabelDialog />}
    </div>
  );
}

const tagClass = (on: boolean) =>
  `cursor-pointer rounded-full border px-3 py-1 text-[12px] ${
    on ? 'border-[var(--app-primary)] bg-[#FFF3E8] text-[var(--app-primary)]' : 'border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-muted)]'
  }`;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center border-b border-[var(--app-border)] py-3">
      <span className="w-20 shrink-0 text-[13px] text-[var(--app-text-muted)]">{label}</span>
      <span className="min-w-0 flex-1">{children}</span>
    </div>
  );
}

const LEVELS = ['province', 'city', 'district', 'street'] as const;

/**
 * ?sheet=region(s311~s313 + frame:r2@50.4):中国境内/中国香港 Tab + 面包屑级联 +
 * 第一级热门城市宫格,省→市→区县→街道逐级点选,选满四级关层回填。
 * 点选路径独立存在 _temp.addressRegion,中途关闭不脏写表单。
 */
function RegionSheet() {
  const { action, bindBack, back } = useSuningGestures();
  const S = useStrings();
  const path = useSuningStore((s) => s._temp.addressRegion) ?? [];
  const setTemp = useSuningStore((s) => s.setTemp);
  const setAddressDraft = useSuningStore((s) => s.setAddressDraft);
  const showToast = useSuningStore((s) => s.showToast);

  const depth = Math.min(path.length, 3);
  const level = LEVELS[depth];
  const options = regionOptionsAt(path);

  const fill = (full: string[]) => {
    setAddressDraft({ province: full[0], city: full[1], district: full[2], street: full[3] });
    back();
  };

  const pick = (v: string) => {
    if (depth < 3) {
      setTemp({ addressRegion: [...path.slice(0, depth), v] });
      return;
    }
    fill([path[0], path[1], path[2], v]);
  };

  /* 四级各自一个 actionId,绑定处必须写字面量,故按层级 switch 而非拼接 */
  const optionBinding = (opt: string) => {
    const opts = { params: { level, value: opt } };
    switch (level) {
      case 'province':
        return action('address.edit.select.province', () => pick(opt), opts);
      case 'city':
        return action('address.edit.select.city', () => pick(opt), opts);
      case 'district':
        return action('address.edit.select.district', () => pick(opt), opts);
      default:
        return action('address.edit.select.street', () => pick(opt), opts);
    }
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <div {...bindBack()} className="absolute inset-0 bg-black/50" />
      <div className="relative flex max-h-[72%] flex-col rounded-t-2xl bg-[var(--app-surface)]">
        <div className="shrink-0 px-4 pb-1 pt-3">
          <div className="flex items-center">
            <span className="min-w-0 flex-1 text-center text-[15px] font-bold text-[var(--app-text)]">
              {S.regionSheetTitle}
            </span>
            <button
              {...bindBack()}
              className="absolute right-3 cursor-pointer border-none bg-transparent p-1 text-[var(--app-c-text-muted)]"
            >
              <IcClose size={18} />
            </button>
          </div>

          <div className="mt-2 flex gap-4 border-b border-[var(--app-border)]">
            <span className="border-b-2 border-[var(--app-primary)] pb-1.5 text-[13px] font-bold text-[var(--app-primary)]">
              {S.regionTabMainland}
            </span>
            <button
              {...action('address.edit.wontfix.toast', () => showToast(S.toastNotOpen))}
              className="cursor-pointer border-none bg-transparent p-0 pb-1.5 text-[13px] text-[var(--app-text-muted)]"
            >
              {S.regionTabHk}
            </button>
          </div>

          {/* 面包屑:已选层级可点回跳(其后层级清空)+ 末尾橙色「请选择」 */}
          <div className="flex flex-wrap items-center gap-3 py-2">
            {path.map((seg, i) => (
              <button
                key={seg}
                {...action('address.edit.regionLevel.back', () => setTemp({ addressRegion: path.slice(0, i) }), {
                  params: { level: LEVELS[i] },
                })}
                className="cursor-pointer border-none bg-transparent p-0 text-[13px] text-[var(--app-text)]"
              >
                {seg}
              </button>
            ))}
            <span className="text-[13px] font-bold text-[var(--app-primary)]">{S.regionPleaseSelect}</span>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-6">
          {depth === 0 && (
            <div className="pb-2">
              <div className="py-1.5 text-[12px] text-[var(--app-c-text-muted)]">{S.regionHotCity}</div>
              <div className="grid grid-cols-4 gap-2">
                {HOT_CITIES.map((c) => (
                  <button
                    key={c.label}
                    {...action(
                      'address.edit.select.hotCity',
                      () => setTemp({ addressRegion: [c.province, c.city] }),
                      { params: { city: c.city } },
                    )}
                    className="cursor-pointer rounded-lg border-none bg-[var(--app-c-chip-bg)] py-1.5 text-[12px] text-[var(--app-text)]"
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {options.map((opt) => (
            <button
              key={opt}
              {...optionBinding(opt)}
              className="flex w-full cursor-pointer items-center gap-2 border-none border-b border-[var(--app-border)] bg-transparent py-3 text-left"
            >
              <span className="min-w-0 flex-1 text-[14px] text-[var(--app-text)]">{opt}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** ?dialog=addLabel(s314):≤5 字自定义标签,保存后加入标签行并选中 */
function AddLabelDialog() {
  const { action, bindBack, back } = useSuningGestures();
  const S = useStrings();
  const value = useSuningStore((s) => s._temp.addressLabelDraft);
  const draft = useSuningStore((s) => s.addressDraft);
  const setTemp = useSuningStore((s) => s.setTemp);
  const setAddressDraft = useSuningStore((s) => s.setAddressDraft);
  const showToast = useSuningStore((s) => s.showToast);

  const submit = () => {
    const label = value.trim();
    if (!label) {
      showToast(S.toastLabelEmpty);
      return;
    }
    if (label.length > 5) {
      showToast(S.toastLabelTooLong);
      return;
    }
    const pool = draft?.customLabels ?? [];
    setAddressDraft({ customLabels: pool.includes(label) ? pool : [...pool, label], tag: label });
    setTemp({ addressLabelDraft: '' });
    back();
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      <div {...bindBack()} className="absolute inset-0 bg-black/50" />
      <div className="relative w-[76%] rounded-2xl bg-[var(--app-surface)] px-4 pb-2 pt-5">
        <div className="text-center text-[15px] font-bold text-[var(--app-text)]">{S.addLabelTitle}</div>
        <input
          value={value}
          onChange={(e) => setTemp({ addressLabelDraft: e.target.value })}
          placeholder={S.addLabelPlaceholder}
          data-keep-keyboard="true"
          className="mt-3 w-full rounded-lg bg-[var(--app-c-chip-bg)] px-3 py-2 text-[13px] text-[var(--app-text)] outline-none placeholder:text-[var(--app-c-text-muted)]"
        />
        <div className="mt-4 flex border-t border-[var(--app-border)]">
          <button
            {...bindBack()}
            className="flex-1 cursor-pointer border-none bg-transparent py-3 text-[15px] text-[var(--app-text-muted)]"
          >
            {S.cancel}
          </button>
          <button
            {...action('address.edit.addLabel.save', submit)}
            className="flex-1 cursor-pointer border-l border-[var(--app-border)] bg-transparent py-3 text-[15px] font-bold text-[var(--app-primary)]"
          >
            {S.save}
          </button>
        </div>
      </div>
    </div>
  );
}
