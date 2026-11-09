import React from 'react';
import { useDidiGestures } from '../hooks/useDidiGestures';
import { useDidiStore } from '../state';
import { TopBar, Card, OrangeBtn, ToggleRow, C } from '../components/ui';

const HEAD_TYPES: { v: 'company' | 'org' | 'personal'; label: string }[] = [
  { v: 'company', label: '企业单位' },
  { v: 'org', label: '非企业单位' },
  { v: 'personal', label: '个人' },
];

/** 表单行 input(input 类 action 的打标方式:data-action + data-action-type="input") */
function FieldInput({
  label,
  field,
  placeholder,
  value,
  onChange,
  required = false,
  last = false,
}: {
  label: string;
  field: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  last?: boolean;
}) {
  return (
    <div className={`flex items-center px-4 py-3.5 ${last ? '' : 'border-b border-app-border'}`}>
      <span className="w-26 shrink-0 text-[14px] text-app-text">
        {label}
        {required && <span style={{ color: C.red }}>*</span>}
      </span>
      <input
        data-action="invoice.form.input"
        data-action-type="input"
        data-action-params={JSON.stringify({ field })}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 min-w-0 text-right bg-transparent border-none outline-none text-[14px] text-app-text placeholder:text-app-text-muted"
      />
    </div>
  );
}

/** 开发票·填写信息。证据:frames/recC_invoice_form.jpg */
export default function InvoiceFormPage() {
  const { bindTap, back } = useDidiGestures();
  const orders = useDidiStore((s) => s.orders);
  const invoiceSelected = useDidiStore((s) => s.invoiceSelected);
  const invoiceHeadType = useDidiStore((s) => s.invoiceHeadType);
  const invoiceFields = useDidiStore((s) => s.invoiceFields);
  const invoiceItinerary = useDidiStore((s) => s.invoiceItinerary);
  const setInvoiceHeadType = useDidiStore((s) => s.setInvoiceHeadType);
  const setInvoiceField = useDidiStore((s) => s.setInvoiceField);
  const clearInvoiceDraft = useDidiStore((s) => s.clearInvoiceDraft);
  const toggleInvoiceItinerary = useDidiStore((s) => s.toggleInvoiceItinerary);
  const submitInvoice = useDidiStore((s) => s.submitInvoice);
  const toast = useDidiStore((s) => s.toast);

  const sum = orders
    .filter((o) => invoiceSelected.includes(o.id))
    .reduce((acc, o) => acc + o.fare, 0);
  const format = invoiceFields.format ?? 'PDF';

  React.useEffect(() => () => clearInvoiceDraft(), [clearInvoiceDraft]);

  const handleSubmit = () => {
    if (invoiceSelected.length === 0) {
      toast('请先选择需要开票的行程');
      return;
    }
    if (invoiceHeadType === 'personal') {
      if (!invoiceFields.personalName?.trim()) {
        toast('请填写发票抬头');
        return;
      }
    } else {
      if (!invoiceFields.company?.trim()) {
        toast('请填写公司名称');
        return;
      }
      if (!invoiceFields.taxNo?.trim()) {
        toast('请填写公司税号');
        return;
      }
    }
    const email = invoiceFields.email?.trim() ?? '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast('请填写有效的电子邮箱');
      return;
    }
    submitInvoice();
    back();
  };

  return (
    <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground="dark">
      <TopBar title="填写信息" />
      <div className="flex-1 overflow-y-auto px-3 py-3" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 抬头信息 */}
        <Card>
          <div className="flex items-center px-4 py-3.5 border-b border-app-border">
            <span className="w-26 shrink-0 text-[14px] text-app-text">抬头类型</span>
            <div className="flex-1 flex items-center justify-end gap-3">
              {HEAD_TYPES.map((h) => {
                const active = invoiceHeadType === h.v;
                return (
                  <button
                    key={h.v}
                    {...bindTap(
                      { kind: 'action', id: 'invoice.form.headType' },
                      { params: { value: h.v }, onTrigger: () => setInvoiceHeadType(h.v) },
                    )}
                    className="flex items-center gap-1 bg-transparent border-none"
                  >
                    <span
                      className="inline-flex items-center justify-center rounded-full shrink-0"
                      style={{
                        width: 16,
                        height: 16,
                        border: active ? 'none' : '1.5px solid #C9CCD4',
                        background: active ? C.orange : 'transparent',
                      }}
                    >
                      {active && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                    <span className="text-[13px]" style={{ color: active ? '#1A1A1A' : '#666' }}>
                      {h.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {invoiceHeadType === 'personal' ? (
            <FieldInput
              label="发票抬头"
              field="personalName"
              placeholder="请填入个人姓名"
              value={invoiceFields.personalName ?? ''}
              onChange={(v) => setInvoiceField('personalName', v)}
              required
            />
          ) : (
            <>
              <FieldInput
                label="公司名称"
                field="company"
                placeholder="云江科技有限公司"
                value={invoiceFields.company ?? ''}
                onChange={(v) => setInvoiceField('company', v)}
                required
              />
              <FieldInput
                label="公司税号"
                field="taxNo"
                placeholder="请填写公司税号"
                value={invoiceFields.taxNo ?? ''}
                onChange={(v) => setInvoiceField('taxNo', v)}
                required
              />
            </>
          )}

          {/* 发票形式 */}
          <div className="flex items-center px-4 py-3.5 border-b border-app-border">
            <span className="w-26 shrink-0 text-[14px] text-app-text">发票形式</span>
            <div className="flex-1 flex items-center justify-end gap-2">
              {['PDF', 'XML', 'OFD'].map((v) => {
                const active = format === v;
                return (
                  <button
                    key={v}
                    data-action="invoice.form.input"
                    data-action-type="select"
                    data-action-params={JSON.stringify({ value: v })}
                    onClick={() => setInvoiceField('format', v)}
                    className="px-3 py-1 rounded-full text-[13px]"
                    style={{
                      background: active ? '#FFF4EC' : '#F5F6FA',
                      color: active ? C.orangeDeep : '#666',
                      border: active ? `1px solid ${C.orange}` : '1px solid transparent',
                    }}
                  >
                    {v}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 开票金额(只读) */}
          <div className="flex items-center px-4 py-3.5">
            <span className="w-26 shrink-0 text-[14px] text-app-text">开票金额</span>
            <span className="flex-1 text-right text-[16px] font-bold text-app-text">¥ {sum.toFixed(2)}</span>
          </div>
        </Card>

        {/* 接收方式 */}
        <div className="text-[14px] font-semibold text-app-text px-1 mt-4 mb-1.5">接收方式</div>
        <Card>
          <FieldInput
            label="电子邮箱"
            field="email"
            placeholder="请填写电子邮箱"
            value={invoiceFields.email ?? ''}
            onChange={(v) => setInvoiceField('email', v)}
            required
          />
          <ToggleRow
            label="发送行程单"
            on={invoiceItinerary}
            bind={bindTap(
              { kind: 'action', id: 'invoice.form.itinerary.toggle' },
              { onTrigger: () => toggleInvoiceItinerary() },
            )}
            last
          />
        </Card>

        {/* 出行人信息(可选) */}
        <div className="text-[14px] font-semibold text-app-text px-1 mt-4 mb-1.5">
          出行人信息 <span className="font-normal text-[12px] text-app-text-muted">(可选,抵扣进项税需填)</span>
        </div>
        <Card>
          <button
            onClick={() => toast('该功能暂未开放')}
            className="w-full flex items-center px-4 py-3.5 border-b border-app-border bg-transparent border-x-0 border-t-0 text-left"
          >
            <span className="w-26 shrink-0 text-[14px] text-app-text">证件类型</span>
            <span className="flex-1 text-right text-[14px] text-app-text">身份证</span>
            <span className="text-app-text-muted ml-1">›</span>
          </button>
          <FieldInput
            label="出行人姓名"
            field="travelerName"
            placeholder="填写证件姓名"
            value={invoiceFields.travelerName ?? ''}
            onChange={(v) => setInvoiceField('travelerName', v)}
          />
          <FieldInput
            label="出行人证件号码"
            field="travelerId"
            placeholder="填写证件号码"
            value={invoiceFields.travelerId ?? ''}
            onChange={(v) => setInvoiceField('travelerId', v)}
            last
          />
        </Card>
      </div>

      {/* 提交 */}
      <div className="shrink-0 bg-app-surface border-t border-app-border px-4 py-3">
        <OrangeBtn
          bind={bindTap(
            { kind: 'action', id: 'invoice.form.submit' },
            { onTrigger: handleSubmit },
          )}
        >
          提交
        </OrangeBtn>
      </div>
    </div>
  );
}
