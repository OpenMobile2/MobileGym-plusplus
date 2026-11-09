import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useKapiStore } from '../state';
import { useKapiGestures } from '../hooks/useKapiGestures';
import { SheetShell } from './SheetShell';
import { CategoryGrid } from './CategoryGrid';
import { Keypad } from './Keypad';
import { Avatar, CategoryIcon } from './ui';
import { toast } from './toast';
import { money, dateKey } from './format';
import * as TimeService from '@/os/TimeService';
import {
  RECORD_MODES, RECORD_TYPES, CATEGORY_EDIT_SECTIONS, DISCOUNT_TYPES, GENDER_OPTIONS, PAYEE_SUGGESTIONS,
} from '../constants';
import {
  IcCalendar, IcLedger, IcCard, IcCash, IcCheck, IcSwap, IcImage, IcCamera, IcVoice, IcPlus,
  IcNavBack, IcArrowRight,
} from '../res/icons';
import { useStrings } from '../hooks/useStrings';
import { useLocale } from '@/os/locale';

function useClose() {
  const { back } = useKapiGestures();
  return () => back();
}

/** Sheet calendar heading, formatted per locale (slash form for en, CJK form for zh). */
function useMonthYearHeading(year: number, month0: number): string {
  const locale = useLocale();
  return locale === 'en' ? `${month0 + 1}/${year}` : `${year}年${month0 + 1}月`;
}

function billIdFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/bill\/([^/]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

/* ============================= 记账输入弹层 ============================= */
function RecordSheet() {
  const close = useClose();
  const { bindTap, bindAction } = useKapiGestures();
  const s = useStrings();
  const draft = useKapiStore((st) => st._draft);
  const ledgers = useKapiStore((st) => st.ledgers);
  const draftReset = useKapiStore((st) => st.draftReset);
  const draftPatch = useKapiStore((st) => st.draftPatch);
  const draftAmountKey = useKapiStore((st) => st.draftAmountKey);
  const draftCommit = useKapiStore((st) => st.draftCommit);
  const setEditContext = useKapiStore((st) => st.setEditContext);
  const setCategoryTarget = useKapiStore((st) => st.setCategoryTarget);
  const [mode, setMode] = useState<'manual' | 'ai'>('manual');
  const [aiText, setAiText] = useState('');
  const ledgerName = ledgers.find((l) => l.id === draft.ledgerId)?.name ?? s.defaultLedgerName;

  useEffect(() => {
    setEditContext('draft');
    setCategoryTarget('record');
  }, [setEditContext, setCategoryTarget]);

  const cap = 'flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#E3E6EE] text-[13px] text-[#5A6172] bg-app-surface cursor-pointer whitespace-nowrap shrink-0';

  return (
    <SheetShell close={close} variant="bottom" closeIcon>
      {/* 模式 Tab */}
      <div className="flex items-center gap-6 px-4 pb-2">
        {RECORD_MODES.map((m) => (
          <button
            key={m.id}
            {...bindAction('record.mode.select.tab', () => setMode(m.id), { value: m.id })}
            className={`text-[17px] border-none bg-transparent cursor-pointer ${
              mode === m.id ? 'text-app-text font-semibold' : 'text-app-text-muted'
            }`}
          >
            {s[m.labelKey]}
          </button>
        ))}
      </div>

      {mode === 'manual' ? (
        <>
          {/* 收支类型子 Tab */}
          <div className="flex items-center gap-5 px-4 py-1">
            {RECORD_TYPES.map((t) => (
              <button
                key={t.id}
                {...bindAction('record.type.select.tab', () => draftReset(t.id), { value: t.id })}
                className={`text-[14px] border-none bg-transparent cursor-pointer ${
                  draft.type === t.id ? 'text-[#4B6EF5] font-semibold' : 'text-app-text-muted'
                }`}
              >
                {s[t.labelKey]}
              </button>
            ))}
          </div>

          {draft.type === 'transfer' ? (
            <div className="flex items-center justify-center gap-3 py-4">
              <button {...bindTap('record.transferAccount.open')} className={cap}>
                <IcCard size={16} /> {s.payFromAccountLabel}
              </button>
              <IcSwap size={18} className="text-[#4B6EF5]" />
              <button {...bindTap('record.transferAccount.open')} className={cap}>
                <IcCard size={16} /> {s.payToAccountLabel}
              </button>
            </div>
          ) : (
            <div className="flex gap-4 px-4 py-3 overflow-x-auto" data-scroll-container="record-cat" data-scroll-direction="horizontal">
              <button {...bindTap('record.category.open')} className="flex flex-col items-center gap-1 shrink-0 bg-transparent border-none cursor-pointer">
                <CategoryIcon icon={draft.icon} color={draft.color} selected />
                <span className="text-[12px] text-[#4B6EF5]">{draft.categoryName}</span>
              </button>
              <button {...bindTap('record.category.open')} className="flex flex-col items-center justify-center gap-1 shrink-0 bg-transparent border-none cursor-pointer text-app-text-muted">
                <span className="w-12 h-12 rounded-full bg-[#F4F6FA] flex items-center justify-center text-[20px]">⋯</span>
                <span className="text-[12px]">{s.moreCategoriesLabel}</span>
              </button>
            </div>
          )}

          {/* 属性胶囊 */}
          <div className="flex gap-2 px-4 py-2 overflow-x-auto" data-scroll-container="record-caps" data-scroll-direction="horizontal">
            <button {...bindTap('record.date.open')} className={cap}><IcCalendar size={15} /> {dateKey(draft.date).slice(5)}</button>
            <button {...bindTap('record.ledger.open')} className={cap}><IcLedger size={15} /> {ledgerName}</button>
            <button {...bindTap('record.account.open')} className={cap}><IcCard size={15} /> {draft.accountId ? s.accountSelectedLabel : s.noAccountLabel}</button>
            <button {...bindTap('record.discount.open')} className={cap}>{s.discountCapPrefix} {draft.discount ? `¥${money(draft.discount.amount)}` : s.noneLabel}</button>
          </div>

          {/* 金额 + 备注 */}
          <div className="px-4 py-3">
            <div className="text-[28px] font-bold text-[#4B6EF5]">¥ {draft.amountExpr || '0.00'}</div>
            <div className="flex items-center gap-2 mt-2">
              <input
                data-action="record.note.input.value"
                data-action-type="input"
                value={draft.note}
                onChange={(e) => draftPatch({ note: e.target.value })}
                placeholder={s.noteInputPlaceholder}
                className="flex-1 bg-transparent border-none outline-none text-[14px] text-app-text placeholder:text-app-text-muted"
              />
              <button {...bindAction('record.attach.noop', () => toast(s.featureNotAvailable))} className="bg-transparent border-none cursor-pointer"><IcImage size={20} className="text-app-text-muted" /></button>
              <button {...bindAction('record.attach.noop', () => toast(s.featureNotAvailable))} className="bg-transparent border-none cursor-pointer"><IcCamera size={20} className="text-app-text-muted" /></button>
            </div>
          </div>

          <Keypad
            inputActionId="record.amount.input.value"
            onInput={draftAmountKey}
            primaryActionId="record.submit.confirm.done"
            onPrimary={() => {
              const id = draftCommit();
              if (!id) { toast(s.enterAmountToast); return; }
              toast(s.billRecordedToast);
              draftReset();
              close();
            }}
            secondaryLabel={s.recordAgainBtn}
            secondaryActionId="record.submit.confirm.again"
            onSecondary={() => {
              const id = draftCommit();
              if (!id) { toast(s.enterAmountToast); return; }
              toast(s.billRecordedToast);
              draftPatch({ amountExpr: '', note: '' });
            }}
          />
        </>
      ) : (
        <div className="p-4">
          <div className="bg-[#F4F6FA] rounded-xl p-3 min-h-[120px]">
            <textarea
              data-action="record.note.input.value"
              data-action-type="input"
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
              placeholder={s.aiRecordPlaceholder}
              className="w-full h-24 bg-transparent border-none outline-none resize-none text-[15px] text-app-text placeholder:text-app-text-muted"
            />
            <div className="flex items-center gap-3 mt-2">
              <button {...bindAction('record.attach.noop', () => toast(s.featureNotAvailable))} className="bg-transparent border-none cursor-pointer"><IcImage size={20} className="text-app-text-muted" /></button>
              <button {...bindAction('record.attach.noop', () => toast(s.featureNotAvailable))} className="bg-transparent border-none cursor-pointer"><IcCamera size={20} className="text-app-text-muted" /></button>
              <span className="flex-1" />
              <button
                {...bindAction('record.ai.submit.send', () => {
                  const m = aiText.match(/(\d+(?:\.\d+)?)/);
                  if (!m) { toast(s.amountNotRecognizedToast); return; }
                  useKapiStore.getState().addBill({
                    type: 'expense', categoryId: draft.categoryId, categoryName: draft.categoryName,
                    icon: draft.icon, color: draft.color, amount: parseFloat(m[1]), note: aiText,
                    date: TimeService.now(), ledgerId: draft.ledgerId, accountId: null,
                    payee: '', tags: [], discount: null, refund: null,
                    reimburse: false, excludeFlow: false, excludeBudget: false,
                  });
                  toast(s.billRecordedToast); setAiText(''); close();
                })}
                className="px-4 py-2 rounded-full bg-[#4B6EF5] text-white text-[14px] border-none cursor-pointer"
              >
                {s.aiRecognizeBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </SheetShell>
  );
}

/* ============================= 语音记账 ============================= */
function VoiceSheet() {
  const close = useClose();
  const { bindActionLong } = useKapiGestures();
  const s = useStrings();
  const draft = useKapiStore((st) => st._draft);
  return (
    <SheetShell close={close} variant="bottom" closeIcon>
      <div className="flex flex-col items-center justify-between min-h-[360px] py-10 px-6">
        <p className="text-[14px] text-app-text-muted text-center">{s.voiceHintText}</p>
        <button
          {...bindActionLong('voice.record.input.speech', () => {
            useKapiStore.getState().addBill({
              type: 'expense', categoryId: draft.categoryId, categoryName: draft.categoryName,
              icon: draft.icon, color: draft.color, amount: 18, note: s.voiceRecordNote,
              date: TimeService.now(), ledgerId: draft.ledgerId, accountId: null,
              payee: '', tags: [], discount: null, refund: null,
              reimburse: false, excludeFlow: false, excludeBudget: false,
            });
            toast(s.billRecordedToast);
            close();
          })}
          className="w-full py-4 rounded-full bg-[#4B6EF5] text-white text-[16px] border-none cursor-pointer flex items-center justify-center gap-2 select-none"
        >
          <IcVoice size={20} /> {s.pressHoldToTalkBtn}
        </button>
      </div>
    </SheetShell>
  );
}

/* ============================= 分类选择(全屏) ============================= */
function CategorySheet() {
  const close = useClose();
  const s = useStrings();
  return (
    <SheetShell close={close} variant="full" title={s.defaultCategorySheetTitle} closeIcon>
      <CategoryGrid onPicked={close} />
    </SheetShell>
  );
}

/* ============================= 分类方案管理 ============================= */
function CategoryEditSheet() {
  const close = useClose();
  const { bindTap, bindAction } = useKapiGestures();
  const s = useStrings();
  const expense = useKapiStore((st) => st.categories.expense);
  const rules = useKapiStore((st) => st.rules);
  const [section, setSection] = useState<'edit' | 'payeeRule' | 'contentRule'>('edit');
  const ruleKind = section === 'payeeRule' ? 'payee' : 'content';
  return (
    <SheetShell close={close} variant="full" title={s.categorySchemeManageTitle} closeIcon>
      <div className="flex justify-center gap-6 py-2 border-b border-app-border">
        {CATEGORY_EDIT_SECTIONS.map((sec) => (
          <button
            key={sec.id}
            {...bindAction('categoryEdit.tab.select.section', () => setSection(sec.id), { value: sec.id })}
            className={`text-[14px] pb-1 border-none bg-transparent cursor-pointer ${
              section === sec.id ? 'text-[#4B6EF5] font-semibold border-b-2 border-[#4B6EF5]' : 'text-app-text-muted'
            }`}
          >
            {s[sec.labelKey]}
          </button>
        ))}
      </div>
      {section === 'edit' ? (
        <div className="grid grid-cols-4 gap-y-4 p-4">
          {expense.map((c) => (
            <div key={c.id} className="flex flex-col items-center gap-1">
              <CategoryIcon icon={c.icon} color={c.color} />
              <span className="text-[12px] text-[#5A6172]">{c.name}</span>
            </div>
          ))}
          <button {...bindAction('categoryEdit.addCategory.noop', () => toast(s.featureNotAvailable))} className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer text-app-text-muted">
            <span className="w-12 h-12 rounded-full border border-dashed border-[#C5CAD4] flex items-center justify-center"><IcPlus size={20} /></span>
            <span className="text-[12px]">{s.addLabel}</span>
          </button>
        </div>
      ) : (
        <div className="p-4">
          {rules.filter((r) => r.kind === ruleKind).map((r) => (
            <div key={r.id} className="flex items-center justify-between py-3 border-b border-app-border">
              <span className="text-[15px] text-app-text">{r.keyword}</span>
              <span className="text-[13px] text-app-text-muted">→ {r.categoryName}</span>
            </div>
          ))}
          <button {...bindTap('categoryEdit.addRule.open')} className="mt-4 w-full py-3 rounded-xl border border-dashed border-[#C5CAD4] text-[#4B6EF5] text-[14px] bg-transparent cursor-pointer">
            + {s.addRuleTitle}
          </button>
        </div>
      )}
    </SheetShell>
  );
}

/* ============================= 添加识别规则 ============================= */
function AddRuleSheet() {
  const close = useClose();
  const { bindTap, bindAction } = useKapiGestures();
  const s = useStrings();
  const setCategoryTarget = useKapiStore((st) => st.setCategoryTarget);
  const pickedId = useKapiStore((st) => st._pickedCategoryId);
  const cats = useKapiStore((st) => st.categories.expense);
  const addRule = useKapiStore((st) => st.addRule);
  const [keyword, setKeyword] = useState('');
  const picked = cats.find((c) => c.id === pickedId);
  useEffect(() => { setCategoryTarget('rule'); }, [setCategoryTarget]);
  return (
    <SheetShell close={close} variant="bottom" title={s.addRuleTitle} closeIcon>
      <div className="p-4 flex flex-col gap-3">
        <input
          data-action="addRule.trigger.input.value"
          data-action-type="input"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder={s.ruleKeywordPlaceholder}
          className="w-full px-3 py-3 rounded-xl bg-[#F4F6FA] border-none outline-none text-[15px]"
        />
        <button {...bindTap('addRule.category.open')} className="flex items-center justify-between px-3 py-3 rounded-xl bg-[#F4F6FA] border-none cursor-pointer">
          <span className="text-[15px] text-app-text">{s.targetCategoryLabel}</span>
          <span className="text-[14px] text-app-text-muted">{picked ? picked.name : s.selectPlaceholder}</span>
        </button>
        <button
          {...bindAction('addRule.submit.confirm.save', () => {
            if (!keyword.trim() || !picked) { toast(s.fillKeywordAndCategoryToast); return; }
            addRule('content', keyword.trim(), picked.id, picked.name);
            toast(s.ruleSavedToast); close();
          })}
          className="mt-2 w-full py-3 rounded-xl bg-[#4B6EF5] text-white text-[16px] border-none cursor-pointer"
        >
          {s.confirmBtn}
        </button>
      </div>
    </SheetShell>
  );
}

/* ============================= 交易方选择 ============================= */
function PayeeSheet() {
  const close = useClose();
  const { bindAction } = useKapiGestures();
  const s = useStrings();
  const [q, setQ] = useState('');
  const results = PAYEE_SUGGESTIONS.filter((name) => name.includes(q));
  return (
    <SheetShell close={close} variant="bottom" title={s.payeeLabel} closeIcon>
      <div className="p-4">
        <input
          data-action="payee.search.input.value"
          data-action-type="input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={s.searchPayeePlaceholder}
          className="w-full px-3 py-3 rounded-xl bg-[#F4F6FA] border-none outline-none text-[15px]"
        />
        <div className="mt-2">
          {(q ? results : PAYEE_SUGGESTIONS).map((name) => (
            <button
              key={name}
              {...bindAction('payee.pick.confirm.select', () => { toast(`${s.payeeSelectedPrefix}${name}`); close(); }, { value: name })}
              className="w-full text-left py-3 border-b border-app-border text-[15px] text-app-text bg-transparent border-x-0 border-t-0 cursor-pointer"
            >
              {name}
            </button>
          ))}
        </div>
      </div>
    </SheetShell>
  );
}

/* ============================= 优惠金额 ============================= */
function DiscountSheet() {
  const close = useClose();
  const { bindAction } = useKapiGestures();
  const s = useStrings();
  const applyAttr = useKapiStore((st) => st.applyAttr);
  const [type, setType] = useState(DISCOUNT_TYPES[0].id as string);
  const [expr, setExpr] = useState('');
  return (
    <SheetShell close={close} variant="bottom" title={s.discountAmountLabel} closeIcon>
      <div className="flex flex-wrap gap-2 p-4">
        {DISCOUNT_TYPES.map((t) => (
          <button
            key={t.id}
            {...bindAction('discount.type.select.tag', () => setType(t.id), { value: t.id })}
            className={`px-3 py-1.5 rounded-full text-[13px] border cursor-pointer ${
              type === t.id ? 'border-[#4B6EF5] text-[#4B6EF5] bg-[#EAF0FE]' : 'border-[#E3E6EE] text-app-text-muted bg-app-surface'
            }`}
          >
            {s[t.labelKey]}
          </button>
        ))}
      </div>
      <div className="px-4 text-[24px] font-bold text-[#4B6EF5]">¥ {expr || '0.00'}</div>
      <Keypad
        inputActionId="discount.amount.input.value"
        onInput={(k) => setExpr((e) => (k === 'del' ? e.slice(0, -1) : k === '+' || k === '-' ? e : e + k))}
        primaryActionId="discount.amount.input.value"
        onPrimary={() => {
          const amt = parseFloat(expr) || 0;
          applyAttr({ discount: amt > 0 ? { type, amount: amt } : null });
          close();
        }}
      />
    </SheetShell>
  );
}

/* ============================= 退款详情 ============================= */
function RefundSheet({ billId }: { billId: string | null }) {
  const close = useClose();
  const { bindTap, bindAction } = useKapiGestures();
  const s = useStrings();
  const updateBill = useKapiStore((st) => st.updateBill);
  const [amt, setAmt] = useState('');
  return (
    <SheetShell close={close} variant="bottom" title={s.refundDetailTitle} closeIcon>
      <div className="p-4 flex flex-col gap-3">
        <input
          inputMode="decimal"
          value={amt}
          onChange={(e) => setAmt(e.target.value)}
          placeholder={s.refundAmountPlaceholder}
          className="w-full px-3 py-3 rounded-xl bg-[#F4F6FA] border-none outline-none text-[15px]"
        />
        <button {...bindTap('refund.account.open', { params: { id: billId ?? '' } })} className="flex items-center justify-between px-3 py-3 rounded-xl bg-[#F4F6FA] border-none cursor-pointer">
          <span className="text-[15px]">{s.refundAccountLabel}</span><span className="text-app-text-muted">›</span>
        </button>
        <button {...bindTap('refund.date.open', { params: { id: billId ?? '' } })} className="flex items-center justify-between px-3 py-3 rounded-xl bg-[#F4F6FA] border-none cursor-pointer">
          <span className="text-[15px]">{s.refundTimeLabel}</span><span className="text-app-text-muted">›</span>
        </button>
        <button
          {...bindAction('refund.submit.confirm.save', () => {
            const v = parseFloat(amt) || 0;
            if (billId && v > 0) updateBill(billId, { refund: { amount: v, accountId: null, date: TimeService.now() } });
            toast(s.refundRecordedToast); close();
          })}
          className="mt-2 w-full py-3 rounded-xl bg-[#4B6EF5] text-white text-[16px] border-none cursor-pointer"
        >
          {s.confirmBtn}
        </button>
      </div>
    </SheetShell>
  );
}

/* ============================= 选择所属账本(回填) ============================= */
function LedgerPickSheet() {
  const close = useClose();
  const { bindAction } = useKapiGestures();
  const s = useStrings();
  const ledgers = useKapiStore((st) => st.ledgers);
  const applyAttr = useKapiStore((st) => st.applyAttr);
  return (
    <SheetShell close={close} variant="bottom" title={s.selectLedgerTitle} closeIcon>
      <div className="p-4 flex flex-col gap-2">
        {ledgers.map((l) => (
          <button
            key={l.id}
            {...bindAction('ledgerPick.item.select.ledger', () => { applyAttr({ ledgerId: l.id }); close(); }, { ledgerId: l.id })}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#F4F6FA] border-none cursor-pointer text-left"
          >
            <span className="text-[22px]">{l.cover}</span>
            <span className="text-[15px] text-app-text">{l.name}</span>
          </button>
        ))}
      </div>
    </SheetShell>
  );
}

/* ============================= 选择日期 ============================= */
function DatePickSheet() {
  const close = useClose();
  const { bindAction } = useKapiGestures();
  const s = useStrings();
  const draft = useKapiStore((st) => st._draft);
  const editContext = useKapiStore((st) => st._editContext);
  const activeBillId = useKapiStore((st) => st._activeBillId);
  const bills = useKapiStore((st) => st.bills);
  const applyAttr = useKapiStore((st) => st.applyAttr);
  const baseTs = editContext === 'bill' ? bills.find((b) => b.id === activeBillId)?.date ?? draft.date : draft.date;
  const [sel, setSel] = useState(baseTs);
  const [viewTs, setViewTs] = useState(baseTs);
  const base = TimeService.fromTimestamp(viewTs);
  const year = base.getFullYear();
  const month = base.getMonth();
  const firstDay = TimeService.fromLocalParts(year, month, 1).getDay();
  const daysInMonth = TimeService.fromLocalParts(year, month + 1, 0).getDate();
  const selKey = dateKey(sel);
  const heading = useMonthYearHeading(year, month);
  const shiftMonth = (d: number) => setViewTs(TimeService.fromLocalParts(year, month + d, 1, 12, 0).getTime());
  return (
    <SheetShell close={close} variant="bottom" title={s.selectDateTitle} closeIcon>
      <div className="p-4">
        <div className="flex items-center justify-center gap-6 mb-2">
          <button {...bindAction('datePick.month.select.shift', () => shiftMonth(-1), { value: 'prev' })} className="bg-transparent border-none cursor-pointer p-1" aria-label={s.prevMonthAria}><IcNavBack size={18} className="text-app-text-muted" /></button>
          <span className="text-[15px] font-semibold">{heading}</span>
          <button {...bindAction('datePick.month.select.shift', () => shiftMonth(1), { value: 'next' })} className="bg-transparent border-none cursor-pointer p-1" aria-label={s.nextMonthAria}><IcArrowRight size={18} className="text-app-text-muted" /></button>
        </div>
        <div className="grid grid-cols-7 text-center text-[12px] text-app-text-muted mb-1">
          {[s.weekdaySun, s.weekdayMon, s.weekdayTue, s.weekdayWed, s.weekdayThu, s.weekdayFri, s.weekdaySat].map((w, i) => <span key={i}>{w}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {Array.from({ length: firstDay }).map((_, i) => <span key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const ts = TimeService.fromLocalParts(year, month, day, 12, 0).getTime();
            const k = dateKey(ts);
            const on = k === selKey;
            return (
              <button
                key={day}
                {...bindAction('datePick.value.input.datetime', () => setSel(ts), { value: k })}
                className={`h-9 mx-auto w-9 rounded-full text-[14px] border-none cursor-pointer ${on ? 'bg-[#4B6EF5] text-white' : 'bg-transparent text-app-text'}`}
              >
                {day}
              </button>
            );
          })}
        </div>
        <button
          {...bindAction('datePick.submit.confirm.done', () => { applyAttr({ date: sel }); close(); })}
          className="mt-4 w-full py-3 rounded-xl bg-[#4B6EF5] text-white text-[16px] border-none cursor-pointer"
        >
          {s.okBtn}
        </button>
      </div>
    </SheetShell>
  );
}

/* ============================= 选择账户 ============================= */
function AccountPickSheet() {
  const close = useClose();
  const { bindTap, bindAction } = useKapiGestures();
  const s = useStrings();
  const accounts = useKapiStore((st) => st.accounts);
  const applyAttr = useKapiStore((st) => st.applyAttr);
  return (
    <SheetShell close={close} variant="bottom" title={s.selectAccountTitle} closeIcon>
      <div className="p-4 flex flex-col gap-2">
        <button
          {...bindAction('accountPick.none.select.option', () => { applyAttr({ accountId: null }); close(); }, { value: 'none' })}
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#F4F6FA] border-none cursor-pointer text-left"
        >
          <IcCash size={20} className="text-app-text-muted" />
          <span className="text-[15px]">{s.noAccountAssociatedLabel}</span>
        </button>
        {accounts.map((a) => (
          <button
            key={a.id}
            {...bindAction('accountPick.none.select.option', () => { applyAttr({ accountId: a.id }); close(); }, { value: a.id })}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#F4F6FA] border-none cursor-pointer text-left"
          >
            <IcCard size={20} className="text-[#4B6EF5]" />
            <span className="text-[15px]">{a.name}</span>
          </button>
        ))}
        <button {...bindTap('accountPick.addAccount.open')} className="flex items-center gap-2 px-4 py-3 text-[#4B6EF5] text-[15px] bg-transparent border-none cursor-pointer">
          <IcPlus size={18} /> {s.addAccountBtn}
        </button>
      </div>
    </SheetShell>
  );
}

/* ============================= 添加分类预算 ============================= */
function BudgetAddCatSheet() {
  const close = useClose();
  const { bindTap, bindAction } = useKapiGestures();
  const s = useStrings();
  const setCategoryTarget = useKapiStore((st) => st.setCategoryTarget);
  const pickedId = useKapiStore((st) => st._pickedCategoryId);
  const cats = useKapiStore((st) => st.categories.expense);
  const addCategoryBudget = useKapiStore((st) => st.addCategoryBudget);
  const [amt, setAmt] = useState('');
  const picked = cats.find((c) => c.id === pickedId);
  useEffect(() => { setCategoryTarget('budget'); }, [setCategoryTarget]);
  return (
    <SheetShell close={close} variant="bottom" title={s.addCategoryBudgetBtn} closeIcon>
      <div className="p-4 flex flex-col gap-3">
        <button {...bindTap('budgetAdd.category.open')} className="flex items-center justify-between px-3 py-3 rounded-xl bg-[#F4F6FA] border-none cursor-pointer">
          <span className="text-[15px]">{s.selectCategoryLabel}</span>
          <span className="text-[14px] text-app-text-muted">{picked ? picked.name : s.selectPlaceholder}</span>
        </button>
        <input
          data-action="budgetAdd.amount.input.value"
          data-action-type="input"
          inputMode="decimal"
          value={amt}
          onChange={(e) => setAmt(e.target.value)}
          placeholder={s.budgetAmountPlaceholder}
          className="w-full px-3 py-3 rounded-xl bg-[#F4F6FA] border-none outline-none text-[15px]"
        />
        <button
          {...bindAction('budgetAdd.amount.input.value', () => {
            const v = parseFloat(amt) || 0;
            if (!picked || v <= 0) { toast(s.selectCategoryAndAmountToast); return; }
            addCategoryBudget(picked.id, v); toast(s.categoryBudgetSetToast); close();
          }, { value: amt })}
          className="mt-2 w-full py-3 rounded-xl bg-[#4B6EF5] text-white text-[16px] border-none cursor-pointer"
        >
          {s.confirmBtn}
        </button>
      </div>
    </SheetShell>
  );
}

/* ============================= 编辑日预算 ============================= */
function EditDaySheet() {
  const close = useClose();
  const { bindAction } = useKapiGestures();
  const s = useStrings();
  const setDailyBudget = useKapiStore((st) => st.setDailyBudget);
  const [amt, setAmt] = useState('');
  return (
    <SheetShell close={close} variant="bottom" title={s.editDayBudgetTitle} closeIcon>
      <div className="p-4 flex flex-col gap-3">
        <input
          data-action="editDay.amount.input.value"
          data-action-type="input"
          inputMode="decimal"
          value={amt}
          onChange={(e) => setAmt(e.target.value)}
          placeholder={s.todayBudgetAmountPlaceholder}
          className="w-full px-3 py-3 rounded-xl bg-[#F4F6FA] border-none outline-none text-[15px]"
        />
        <button
          {...bindAction('editDay.amount.input.value', () => {
            const v = parseFloat(amt) || 0;
            if (v <= 0) { toast(s.enterAmountToast); return; }
            setDailyBudget(dateKey(TimeService.now()), v); toast(s.dailyBudgetUpdatedToast); close();
          }, { value: amt })}
          className="w-full py-3 rounded-xl bg-[#4B6EF5] text-white text-[16px] border-none cursor-pointer"
        >
          {s.confirmBtn}
        </button>
      </div>
    </SheetShell>
  );
}

/* ============================= 账本切换 ============================= */
function LedgerSwitchSheet() {
  const close = useClose();
  const { bindTap, bindAction } = useKapiGestures();
  const s = useStrings();
  const ledgers = useKapiStore((st) => st.ledgers);
  const currentId = useKapiStore((st) => st.currentLedgerId);
  const setCurrentLedger = useKapiStore((st) => st.setCurrentLedger);
  return (
    <SheetShell close={close} variant="bottom" title={s.ledgerManageTitle} closeIcon>
      <div className="p-4 flex flex-col gap-2">
        {ledgers.map((l) => (
          <button
            key={l.id}
            {...bindAction('ledger.item.select.ledger', () => { setCurrentLedger(l.id); toast(`${s.switchedToLedgerPrefix}${l.name}`); close(); }, { ledgerId: l.id })}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#F4F6FA] border-none cursor-pointer text-left"
          >
            <span className="text-[22px]">{l.cover}</span>
            <span className="flex-1 text-[15px] text-app-text">{l.name}</span>
            {l.id === currentId && <IcCheck size={18} className="text-[#4B6EF5]" />}
          </button>
        ))}
        <button {...bindTap('ledger.create.open')} className="flex items-center gap-2 px-4 py-3 text-[#4B6EF5] text-[15px] bg-transparent border-none cursor-pointer">
          <IcPlus size={18} /> {s.addLedgerBtn}
        </button>
      </div>
    </SheetShell>
  );
}

/* ============================= 新建账本 ============================= */
function LedgerCreateSheet() {
  const close = useClose();
  const { bindAction } = useKapiGestures();
  const s = useStrings();
  const addLedger = useKapiStore((st) => st.addLedger);
  const [type, setType] = useState<'personal' | 'shared'>('personal');
  const [name, setName] = useState('');
  return (
    <SheetShell close={close} variant="bottom" title={s.newLedgerTitle} closeIcon>
      <div className="p-4 flex flex-col gap-3">
        <div className="flex bg-[#F0F2F8] rounded-full p-1 self-center">
          {(['personal', 'shared'] as const).map((t) => (
            <button
              key={t}
              {...bindAction('ledgerCreate.type.select.tab', () => setType(t), { value: t })}
              className={`px-6 py-1.5 rounded-full text-[14px] border-none cursor-pointer ${type === t ? 'bg-app-surface text-[#4B6EF5] font-semibold' : 'bg-transparent text-app-text-muted'}`}
            >
              {t === 'personal' ? s.personalLedgerLabel : s.sharedLedgerLabel}
            </button>
          ))}
        </div>
        <input
          data-action="ledgerCreate.field.input.value"
          data-action-type="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={s.ledgerNamePlaceholder}
          className="w-full px-3 py-3 rounded-xl bg-[#F4F6FA] border-none outline-none text-[15px]"
        />
        {type === 'shared' && (
          <button {...bindAction('ledgerCreate.member.noop', () => toast(s.featureNotAvailable))} className="px-3 py-3 rounded-xl bg-[#F4F6FA] text-left text-[15px] text-app-text-muted border-none cursor-pointer">
            {s.addLedgerMemberLabel}
          </button>
        )}
        <button
          {...bindAction('ledgerCreate.submit.confirm.create', () => {
            if (!name.trim()) { toast(s.enterLedgerNameToast); return; }
            addLedger({ name: name.trim(), type, cover: type === 'shared' ? '👥' : '📓', includeInTotal: true });
            toast(s.ledgerCreatedToast); close();
          })}
          className="mt-2 w-full py-3 rounded-xl bg-[#4B6EF5] text-white text-[16px] border-none cursor-pointer"
        >
          {s.confirmBtn}
        </button>
      </div>
    </SheetShell>
  );
}

/* ============================= 侧拉抽屉 ============================= */
function DrawerFunc({ bind, label }: { bind: React.HTMLAttributes<HTMLElement>; label: string }) {
  return (
    <button {...bind} className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer">
      <span className="w-10 h-10 rounded-full bg-[#F4F6FA] flex items-center justify-center text-[#4B6EF5] text-[18px]">▦</span>
      <span className="text-[12px] text-[#5A6172]">{label}</span>
    </button>
  );
}

function DrawerSheet() {
  const close = useClose();
  const { bindTap } = useKapiGestures();
  const s = useStrings();
  const user = useKapiStore((st) => st.user);
  const now = TimeService.fromTimestamp(TimeService.now());
  const currentMonthHeading = useMonthYearHeading(now.getFullYear(), now.getMonth());
  return (
    <SheetShell close={close} variant="left">
      <div className="flex flex-col h-full overflow-y-auto pt-12 px-4 pb-6 gap-4" data-scroll-container="drawer" data-scroll-direction="vertical">
        <button {...bindTap('drawer.profile.open')} className="flex items-center gap-3 bg-transparent border-none cursor-pointer">
          <Avatar src={user.avatar} size={48} />
          <span className="text-[17px] font-semibold text-app-text">{user.nick}</span>
          <span className="text-app-text-muted">›</span>
        </button>

        <div {...bindTap('drawer.checkin.open')} className="bg-app-surface rounded-2xl p-4 cursor-pointer">
          <div className="text-[13px] text-app-text-muted mb-2">{currentMonthHeading}</div>
          <div className="flex gap-1 mb-3">
            {Array.from({ length: 14 }).map((_, i) => (
              <span key={i} className="w-4 h-4 rounded-[3px]" style={{ background: i < 8 ? '#4B6EF5' : '#E3E6EE' }} />
            ))}
          </div>
          <div className="flex justify-around text-center">
            <div><div className="text-[18px] font-bold text-app-text">{user.recordDays}</div><div className="text-[12px] text-app-text-muted">{s.recordDaysLabel}</div></div>
            <div><div className="text-[18px] font-bold text-app-text">{user.totalRecords}</div><div className="text-[12px] text-app-text-muted">{s.totalRecordsLabel}</div></div>
            <div><div className="text-[18px] font-bold text-app-text">{user.streakDays}</div><div className="text-[12px] text-app-text-muted">{s.streakDaysLabel}</div></div>
          </div>
        </div>

        <div className="bg-app-surface rounded-2xl p-2">
          <div className="text-[14px] font-semibold text-app-text px-2 py-2">{s.moreFunctionsLabel}</div>
          <div className="grid grid-cols-3 gap-y-4 py-2">
            <DrawerFunc bind={bindTap('drawer.stats.open')} label={s.chartStatsLabel} />
            <DrawerFunc bind={bindTap('drawer.asset.open')} label={s.assetManageLabel} />
            <DrawerFunc bind={bindTap('drawer.ledger.open')} label={s.ledgerManageTitle} />
            <DrawerFunc bind={bindTap('drawer.budget.open')} label={s.budgetManageTitle} />
            <DrawerFunc bind={bindTap('drawer.category.open')} label={s.categoryManageLabel} />
          </div>
        </div>

        <button {...bindTap('drawer.settings.open')} className="bg-app-surface rounded-2xl px-4 py-3 flex items-center text-[15px] text-app-text border-none cursor-pointer">
          {s.settingsTitle} <span className="flex-1" /> <span className="text-app-text-muted">›</span>
        </button>
      </div>
    </SheetShell>
  );
}

/* ============================= 修改实付金额(gate4:F3) ============================= */
function AmountEditSheet() {
  const close = useClose();
  const s = useStrings();
  const activeBillId = useKapiStore((st) => st._activeBillId);
  const bills = useKapiStore((st) => st.bills);
  const updateBill = useKapiStore((st) => st.updateBill);
  const bill = bills.find((b) => b.id === activeBillId);
  const [expr, setExpr] = useState(bill ? String(bill.amount) : '');
  return (
    <SheetShell close={close} variant="bottom" title={s.editPaidAmountTitle} closeIcon>
      <div className="px-4 pt-2 pb-1 text-[28px] font-bold text-[#4B6EF5]">¥ {expr || '0.00'}</div>
      <Keypad
        inputActionId="amountEdit.amount.input.value"
        onInput={(k) => setExpr((e) => (k === 'del' ? e.slice(0, -1) : k === '+' || k === '-' ? e : e + k))}
        primaryActionId="amountEdit.submit.confirm.done"
        onPrimary={() => {
          const amt = parseFloat(expr) || 0;
          if (amt <= 0) { toast(s.enterAmountToast); return; }
          if (activeBillId) updateBill(activeBillId, { amount: Math.round(amt * 100) / 100 });
          toast(s.amountUpdatedToast);
          close();
        }}
      />
    </SheetShell>
  );
}

/* ============================= 统计自定义区间(gate4:F5) ============================= */
function StatsRangeSheet() {
  const close = useClose();
  const { bindAction } = useKapiGestures();
  const s = useStrings();
  const existing = useKapiStore((st) => st._statsRange);
  const setStatsRange = useKapiStore((st) => st.setStatsRange);
  const [view, setView] = useState(TimeService.now());
  const [start, setStart] = useState<number | null>(existing?.start ?? null);
  const [end, setEnd] = useState<number | null>(existing?.end ?? null);

  const vd = TimeService.fromTimestamp(view);
  const year = vd.getFullYear();
  const month = vd.getMonth();
  const firstDay = TimeService.fromLocalParts(year, month, 1).getDay();
  const daysInMonth = TimeService.fromLocalParts(year, month + 1, 0).getDate();
  const heading = useMonthYearHeading(year, month);

  const pick = (ts: number) => {
    if (start === null || end !== null) { setStart(ts); setEnd(null); }
    else if (ts < start) { setStart(ts); }
    else { setEnd(ts); }
  };
  const shiftMonth = (delta: number) => setView(TimeService.fromLocalParts(year, month + delta, 1).getTime());

  return (
    <SheetShell close={close} variant="bottom" title={s.selectStatsRangeTitle} closeIcon>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => shiftMonth(-1)} className="bg-transparent border-none cursor-pointer p-1" aria-label={s.prevMonthAria}><IcNavBack size={18} className="text-app-text-muted" /></button>
          <span className="text-[15px] font-semibold">{heading}</span>
          <button onClick={() => shiftMonth(1)} className="bg-transparent border-none cursor-pointer p-1" aria-label={s.nextMonthAria}><IcArrowRight size={18} className="text-app-text-muted" /></button>
        </div>
        <div className="text-center text-[12px] text-app-text-muted mb-2">
          {start ? `${dateKey(start).slice(5)}` : s.rangeStartPlaceholder} ~ {end ? `${dateKey(end).slice(5)}` : s.rangeEndPlaceholder}
        </div>
        <div className="grid grid-cols-7 text-center text-[12px] text-app-text-muted mb-1">
          {[s.weekdaySun, s.weekdayMon, s.weekdayTue, s.weekdayWed, s.weekdayThu, s.weekdayFri, s.weekdaySat].map((w, i) => <span key={i}>{w}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {Array.from({ length: firstDay }).map((_, i) => <span key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const ts = TimeService.fromLocalParts(year, month, day, 12, 0).getTime();
            const isEnd = start !== null && end !== null && ts >= start && ts <= end;
            const isEdge = ts === start || ts === end;
            return (
              <button
                key={day}
                {...bindAction('statsRange.value.input.datetime', () => pick(ts), { value: dateKey(ts) })}
                className={`h-9 mx-auto w-9 rounded-full text-[14px] border-none cursor-pointer ${isEdge ? 'bg-[#4B6EF5] text-white' : isEnd ? 'bg-[#EAF0FE] text-[#4B6EF5]' : 'bg-transparent text-app-text'}`}
              >
                {day}
              </button>
            );
          })}
        </div>
        <button
          {...bindAction('statsRange.submit.confirm.done', () => {
            if (start === null) { toast(s.enterStartDateToast); return; }
            setStatsRange({ start, end: end ?? start });
            toast(s.rangeUpdatedToast);
            close();
          })}
          className="mt-4 w-full py-3 rounded-xl bg-[#4B6EF5] text-white text-[16px] border-none cursor-pointer"
        >
          {s.okBtn}
        </button>
      </div>
    </SheetShell>
  );
}

/* ============================= 选择性别(gate4:F6) ============================= */
function GenderPickSheet() {
  const close = useClose();
  const { bindAction } = useKapiGestures();
  const s = useStrings();
  const updateProfile = useKapiStore((st) => st.updateProfile);
  const cur = useKapiStore((st) => st.user.gender);
  return (
    <SheetShell close={close} variant="bottom" title={s.selectGenderTitle} closeIcon>
      <div className="p-4 flex flex-col gap-2 pb-6">
        {GENDER_OPTIONS.map((g) => (
          <button
            key={g.id}
            {...bindAction('profile.gender.select.option', () => { updateProfile('gender', g.id); toast(`${s.genderSetPrefix}${s[g.labelKey]}`); close(); }, { value: g.id })}
            className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#F4F6FA] border-none cursor-pointer text-[15px] text-app-text"
          >
            {s[g.labelKey]}
            {cur === g.id && <IcCheck size={18} className="text-[#4B6EF5]" />}
          </button>
        ))}
      </div>
    </SheetShell>
  );
}

/* ============================= Host ============================= */
export function SheetHost() {
  const location = useLocation();
  const sheet = new URLSearchParams(location.search).get('sheet');
  const billId = billIdFromPath(location.pathname);
  if (!sheet) return null;
  switch (sheet) {
    case 'drawer': return <DrawerSheet />;
    case 'record': return <RecordSheet />;
    case 'voice': return <VoiceSheet />;
    case 'category': return <CategorySheet />;
    case 'categoryEdit': return <CategoryEditSheet />;
    case 'addRule': return <AddRuleSheet />;
    case 'payee': return <PayeeSheet />;
    case 'discount': return <DiscountSheet />;
    case 'refund': return <RefundSheet billId={billId} />;
    case 'amountEdit': return <AmountEditSheet />;
    case 'statsRange': return <StatsRangeSheet />;
    case 'genderPick': return <GenderPickSheet />;
    case 'ledgerPick': return <LedgerPickSheet />;
    case 'datePick': return <DatePickSheet />;
    case 'accountPick': return <AccountPickSheet />;
    case 'budgetAddCat': return <BudgetAddCatSheet />;
    case 'editDay': return <EditDaySheet />;
    case 'ledgerSwitch': return <LedgerSwitchSheet />;
    case 'ledgerCreate': return <LedgerCreateSheet />;
    default: return null;
  }
}
