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
  RECORD_MODES, RECORD_TYPES, CATEGORY_EDIT_SECTIONS, DISCOUNT_TYPES,
} from '../constants';
import {
  IcCalendar, IcLedger, IcCard, IcCash, IcCheck, IcSwap, IcImage, IcCamera, IcVoice, IcPlus,
  IcNavBack, IcArrowRight,
} from '../res/icons';

function useClose() {
  const { back } = useKapiGestures();
  return () => back();
}

function billIdFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/bill\/([^/]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

/* ============================= 记账输入弹层 ============================= */
function RecordSheet() {
  const close = useClose();
  const { bindTap, bindAction } = useKapiGestures();
  const draft = useKapiStore((s) => s._draft);
  const ledgers = useKapiStore((s) => s.ledgers);
  const draftReset = useKapiStore((s) => s.draftReset);
  const draftPatch = useKapiStore((s) => s.draftPatch);
  const draftAmountKey = useKapiStore((s) => s.draftAmountKey);
  const draftCommit = useKapiStore((s) => s.draftCommit);
  const setEditContext = useKapiStore((s) => s.setEditContext);
  const setCategoryTarget = useKapiStore((s) => s.setCategoryTarget);
  const [mode, setMode] = useState<'manual' | 'ai'>('manual');
  const [aiText, setAiText] = useState('');
  const ledgerName = ledgers.find((l) => l.id === draft.ledgerId)?.name ?? '总账本';

  useEffect(() => {
    setEditContext('draft');
    setCategoryTarget('record');
  }, [setEditContext, setCategoryTarget]);

  const cap = 'flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#E3E6EE] text-[13px] text-[#5A6172] bg-white cursor-pointer whitespace-nowrap shrink-0';

  return (
    <SheetShell close={close} variant="bottom" closeIcon>
      {/* 模式 Tab */}
      <div className="flex items-center gap-6 px-4 pb-2">
        {RECORD_MODES.map((m) => (
          <button
            key={m.id}
            {...bindAction('record.mode.select.tab', () => setMode(m.id), { value: m.id })}
            className={`text-[17px] border-none bg-transparent cursor-pointer ${
              mode === m.id ? 'text-[#1A1D26] font-semibold' : 'text-[#B3B9C6]'
            }`}
          >
            {m.label}
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
                  draft.type === t.id ? 'text-[#4B6EF5] font-semibold' : 'text-[#8A92A6]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {draft.type === 'transfer' ? (
            <div className="flex items-center justify-center gap-3 py-4">
              <button {...bindTap('record.transferAccount.open')} className={cap}>
                <IcCard size={16} /> 扣款账户
              </button>
              <IcSwap size={18} className="text-[#4B6EF5]" />
              <button {...bindTap('record.transferAccount.open')} className={cap}>
                <IcCard size={16} /> 入款账户
              </button>
            </div>
          ) : (
            <div className="flex gap-4 px-4 py-3 overflow-x-auto" data-scroll-container="record-cat" data-scroll-direction="horizontal">
              <button {...bindTap('record.category.open')} className="flex flex-col items-center gap-1 shrink-0 bg-transparent border-none cursor-pointer">
                <CategoryIcon icon={draft.icon} color={draft.color} selected />
                <span className="text-[12px] text-[#4B6EF5]">{draft.categoryName}</span>
              </button>
              <button {...bindTap('record.category.open')} className="flex flex-col items-center justify-center gap-1 shrink-0 bg-transparent border-none cursor-pointer text-[#8A92A6]">
                <span className="w-12 h-12 rounded-full bg-[#F4F6FA] flex items-center justify-center text-[20px]">⋯</span>
                <span className="text-[12px]">更多分类</span>
              </button>
            </div>
          )}

          {/* 属性胶囊 */}
          <div className="flex gap-2 px-4 py-2 overflow-x-auto" data-scroll-container="record-caps" data-scroll-direction="horizontal">
            <button {...bindTap('record.date.open')} className={cap}><IcCalendar size={15} /> {dateKey(draft.date).slice(5)}</button>
            <button {...bindTap('record.ledger.open')} className={cap}><IcLedger size={15} /> {ledgerName}</button>
            <button {...bindTap('record.account.open')} className={cap}><IcCard size={15} /> {draft.accountId ? '已选账户' : '无账户'}</button>
            <button {...bindTap('record.discount.open')} className={cap}>优惠 {draft.discount ? `¥${money(draft.discount.amount)}` : '无'}</button>
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
                placeholder="点击填写备注信息"
                className="flex-1 bg-transparent border-none outline-none text-[14px] text-[#1A1D26] placeholder:text-[#B3B9C6]"
              />
              <button {...bindAction('record.attach.noop', () => toast('该功能暂未开放'))} className="bg-transparent border-none cursor-pointer"><IcImage size={20} className="text-[#B3B9C6]" /></button>
              <button {...bindAction('record.attach.noop', () => toast('该功能暂未开放'))} className="bg-transparent border-none cursor-pointer"><IcCamera size={20} className="text-[#B3B9C6]" /></button>
            </div>
          </div>

          <Keypad
            inputActionId="record.amount.input.value"
            onInput={draftAmountKey}
            primaryLabel="完成"
            primaryActionId="record.submit.confirm.done"
            onPrimary={() => {
              const id = draftCommit();
              if (!id) { toast('请输入金额'); return; }
              toast('已记一笔');
              draftReset();
              close();
            }}
            secondaryLabel="再记"
            secondaryActionId="record.submit.confirm.again"
            onSecondary={() => {
              const id = draftCommit();
              if (!id) { toast('请输入金额'); return; }
              toast('已记一笔');
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
              placeholder="用一句话记录,例如「午饭黄焖鸡 25」"
              className="w-full h-24 bg-transparent border-none outline-none resize-none text-[15px] text-[#1A1D26] placeholder:text-[#B3B9C6]"
            />
            <div className="flex items-center gap-3 mt-2">
              <button {...bindAction('record.attach.noop', () => toast('该功能暂未开放'))} className="bg-transparent border-none cursor-pointer"><IcImage size={20} className="text-[#B3B9C6]" /></button>
              <button {...bindAction('record.attach.noop', () => toast('该功能暂未开放'))} className="bg-transparent border-none cursor-pointer"><IcCamera size={20} className="text-[#B3B9C6]" /></button>
              <span className="flex-1" />
              <button
                {...bindAction('record.ai.submit.send', () => {
                  const m = aiText.match(/(\d+(?:\.\d+)?)/);
                  if (!m) { toast('没识别到金额,换种说法试试'); return; }
                  useKapiStore.getState().addBill({
                    type: 'expense', categoryId: draft.categoryId, categoryName: draft.categoryName,
                    icon: draft.icon, color: draft.color, amount: parseFloat(m[1]), note: aiText,
                    date: TimeService.now(), ledgerId: draft.ledgerId, accountId: null,
                    payee: '', tags: [], discount: null, refund: null,
                    reimburse: false, excludeFlow: false, excludeBudget: false,
                  });
                  toast('已记一笔'); setAiText(''); close();
                })}
                className="px-4 py-2 rounded-full bg-[#4B6EF5] text-white text-[14px] border-none cursor-pointer"
              >
                识别记账
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
  const draft = useKapiStore((s) => s._draft);
  return (
    <SheetShell close={close} variant="bottom" closeIcon>
      <div className="flex flex-col items-center justify-between min-h-[360px] py-10 px-6">
        <p className="text-[14px] text-[#B3B9C6] text-center">用一句话,记录账单、心情或待办</p>
        <button
          {...bindActionLong('voice.record.input.speech', () => {
            useKapiStore.getState().addBill({
              type: 'expense', categoryId: draft.categoryId, categoryName: draft.categoryName,
              icon: draft.icon, color: draft.color, amount: 18, note: '语音记账(mock)',
              date: TimeService.now(), ledgerId: draft.ledgerId, accountId: null,
              payee: '', tags: [], discount: null, refund: null,
              reimburse: false, excludeFlow: false, excludeBudget: false,
            });
            toast('已记一笔');
            close();
          })}
          className="w-full py-4 rounded-full bg-[#4B6EF5] text-white text-[16px] border-none cursor-pointer flex items-center justify-center gap-2 select-none"
        >
          <IcVoice size={20} /> 按住 说话
        </button>
      </div>
    </SheetShell>
  );
}

/* ============================= 分类选择(全屏) ============================= */
function CategorySheet() {
  const close = useClose();
  return (
    <SheetShell close={close} variant="full" title="默认分类" closeIcon>
      <CategoryGrid onPicked={close} />
    </SheetShell>
  );
}

/* ============================= 分类方案管理 ============================= */
function CategoryEditSheet() {
  const close = useClose();
  const { bindTap, bindAction } = useKapiGestures();
  const expense = useKapiStore((s) => s.categories.expense);
  const rules = useKapiStore((s) => s.rules);
  const [section, setSection] = useState<'edit' | 'payeeRule' | 'contentRule'>('edit');
  const ruleKind = section === 'payeeRule' ? 'payee' : 'content';
  return (
    <SheetShell close={close} variant="full" title="分类方案管理" closeIcon>
      <div className="flex justify-center gap-6 py-2 border-b border-[#EDEFF4]">
        {CATEGORY_EDIT_SECTIONS.map((s) => (
          <button
            key={s.id}
            {...bindAction('categoryEdit.tab.select.section', () => setSection(s.id), { value: s.id })}
            className={`text-[14px] pb-1 border-none bg-transparent cursor-pointer ${
              section === s.id ? 'text-[#4B6EF5] font-semibold border-b-2 border-[#4B6EF5]' : 'text-[#8A92A6]'
            }`}
          >
            {s.label}
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
          <button {...bindAction('categoryEdit.addCategory.noop', () => toast('该功能暂未开放'))} className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer text-[#8A92A6]">
            <span className="w-12 h-12 rounded-full border border-dashed border-[#C5CAD4] flex items-center justify-center"><IcPlus size={20} /></span>
            <span className="text-[12px]">添加</span>
          </button>
        </div>
      ) : (
        <div className="p-4">
          {rules.filter((r) => r.kind === ruleKind).map((r) => (
            <div key={r.id} className="flex items-center justify-between py-3 border-b border-[#EDEFF4]">
              <span className="text-[15px] text-[#1A1D26]">{r.keyword}</span>
              <span className="text-[13px] text-[#8A92A6]">→ {r.categoryName}</span>
            </div>
          ))}
          <button {...bindTap('categoryEdit.addRule.open')} className="mt-4 w-full py-3 rounded-xl border border-dashed border-[#C5CAD4] text-[#4B6EF5] text-[14px] bg-transparent cursor-pointer">
            + 添加识别规则
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
  const setCategoryTarget = useKapiStore((s) => s.setCategoryTarget);
  const pickedId = useKapiStore((s) => s._pickedCategoryId);
  const cats = useKapiStore((s) => s.categories.expense);
  const addRule = useKapiStore((s) => s.addRule);
  const [keyword, setKeyword] = useState('');
  const picked = cats.find((c) => c.id === pickedId);
  useEffect(() => { setCategoryTarget('rule'); }, [setCategoryTarget]);
  return (
    <SheetShell close={close} variant="bottom" title="添加识别规则" closeIcon>
      <div className="p-4 flex flex-col gap-3">
        <input
          data-action="addRule.trigger.input.value"
          data-action-type="input"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="交易方/关键词,例如 肯德基"
          className="w-full px-3 py-3 rounded-xl bg-[#F4F6FA] border-none outline-none text-[15px]"
        />
        <button {...bindTap('addRule.category.open')} className="flex items-center justify-between px-3 py-3 rounded-xl bg-[#F4F6FA] border-none cursor-pointer">
          <span className="text-[15px] text-[#1A1D26]">目标分类</span>
          <span className="text-[14px] text-[#8A92A6]">{picked ? picked.name : '请选择 ›'}</span>
        </button>
        <button
          {...bindAction('addRule.submit.confirm.save', () => {
            if (!keyword.trim() || !picked) { toast('请填写关键词并选择分类'); return; }
            addRule('content', keyword.trim(), picked.id, picked.name);
            toast('规则已保存'); close();
          })}
          className="mt-2 w-full py-3 rounded-xl bg-[#4B6EF5] text-white text-[16px] border-none cursor-pointer"
        >
          确认
        </button>
      </div>
    </SheetShell>
  );
}

/* ============================= 交易方选择 ============================= */
function PayeeSheet() {
  const close = useClose();
  const { bindAction } = useKapiGestures();
  const [q, setQ] = useState('');
  const SUGGEST = ['老乡鸡', '喜茶', '盒马', '滴滴出行', '海底捞'];
  const results = SUGGEST.filter((s) => s.includes(q));
  return (
    <SheetShell close={close} variant="bottom" title="交易方" closeIcon>
      <div className="p-4">
        <input
          data-action="payee.search.input.value"
          data-action-type="input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索交易方"
          className="w-full px-3 py-3 rounded-xl bg-[#F4F6FA] border-none outline-none text-[15px]"
        />
        <div className="mt-2">
          {(q ? results : SUGGEST).map((s) => (
            <button
              key={s}
              {...bindAction('payee.pick.confirm.select', () => { toast(`已选择 ${s}`); close(); }, { value: s })}
              className="w-full text-left py-3 border-b border-[#EDEFF4] text-[15px] text-[#1A1D26] bg-transparent border-x-0 border-t-0 cursor-pointer"
            >
              {s}
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
  const applyAttr = useKapiStore((s) => s.applyAttr);
  const [type, setType] = useState(DISCOUNT_TYPES[0] as string);
  const [expr, setExpr] = useState('');
  return (
    <SheetShell close={close} variant="bottom" title="优惠金额" closeIcon>
      <div className="flex flex-wrap gap-2 p-4">
        {DISCOUNT_TYPES.map((t) => (
          <button
            key={t}
            {...bindAction('discount.type.select.tag', () => setType(t), { value: t })}
            className={`px-3 py-1.5 rounded-full text-[13px] border cursor-pointer ${
              type === t ? 'border-[#4B6EF5] text-[#4B6EF5] bg-[#EAF0FE]' : 'border-[#E3E6EE] text-[#8A92A6] bg-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="px-4 text-[24px] font-bold text-[#4B6EF5]">¥ {expr || '0.00'}</div>
      <Keypad
        inputActionId="discount.amount.input.value"
        onInput={(k) => setExpr((e) => (k === 'del' ? e.slice(0, -1) : k === '+' || k === '-' ? e : e + k))}
        primaryLabel="完成"
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
  const updateBill = useKapiStore((s) => s.updateBill);
  const [amt, setAmt] = useState('');
  return (
    <SheetShell close={close} variant="bottom" title="退款详情" closeIcon>
      <div className="p-4 flex flex-col gap-3">
        <input
          inputMode="decimal"
          value={amt}
          onChange={(e) => setAmt(e.target.value)}
          placeholder="退款金额"
          className="w-full px-3 py-3 rounded-xl bg-[#F4F6FA] border-none outline-none text-[15px]"
        />
        <button {...bindTap('refund.account.open', { params: { id: billId ?? '' } })} className="flex items-center justify-between px-3 py-3 rounded-xl bg-[#F4F6FA] border-none cursor-pointer">
          <span className="text-[15px]">退款账户</span><span className="text-[#8A92A6]">›</span>
        </button>
        <button {...bindTap('refund.date.open', { params: { id: billId ?? '' } })} className="flex items-center justify-between px-3 py-3 rounded-xl bg-[#F4F6FA] border-none cursor-pointer">
          <span className="text-[15px]">退款时间</span><span className="text-[#8A92A6]">›</span>
        </button>
        <button
          {...bindAction('refund.submit.confirm.save', () => {
            const v = parseFloat(amt) || 0;
            if (billId && v > 0) updateBill(billId, { refund: { amount: v, accountId: null, date: TimeService.now() } });
            toast('退款已记录'); close();
          })}
          className="mt-2 w-full py-3 rounded-xl bg-[#4B6EF5] text-white text-[16px] border-none cursor-pointer"
        >
          确认
        </button>
      </div>
    </SheetShell>
  );
}

/* ============================= 选择所属账本(回填) ============================= */
function LedgerPickSheet() {
  const close = useClose();
  const { bindAction } = useKapiGestures();
  const ledgers = useKapiStore((s) => s.ledgers);
  const applyAttr = useKapiStore((s) => s.applyAttr);
  return (
    <SheetShell close={close} variant="bottom" title="选择账本" closeIcon>
      <div className="p-4 flex flex-col gap-2">
        {ledgers.map((l) => (
          <button
            key={l.id}
            {...bindAction('ledgerPick.item.select.ledger', () => { applyAttr({ ledgerId: l.id }); close(); }, { ledgerId: l.id })}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#F4F6FA] border-none cursor-pointer text-left"
          >
            <span className="text-[22px]">{l.cover}</span>
            <span className="text-[15px] text-[#1A1D26]">{l.name}</span>
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
  const draft = useKapiStore((s) => s._draft);
  const editContext = useKapiStore((s) => s._editContext);
  const activeBillId = useKapiStore((s) => s._activeBillId);
  const bills = useKapiStore((s) => s.bills);
  const applyAttr = useKapiStore((s) => s.applyAttr);
  const baseTs = editContext === 'bill' ? bills.find((b) => b.id === activeBillId)?.date ?? draft.date : draft.date;
  const [sel, setSel] = useState(baseTs);
  const base = TimeService.fromTimestamp(sel);
  const year = base.getFullYear();
  const month = base.getMonth();
  const firstDay = TimeService.fromLocalParts(year, month, 1).getDay();
  const daysInMonth = TimeService.fromLocalParts(year, month + 1, 0).getDate();
  const selKey = dateKey(sel);
  return (
    <SheetShell close={close} variant="bottom" title="选择日期" closeIcon>
      <div className="p-4">
        <div className="text-center text-[15px] font-semibold mb-2">{year}年{month + 1}月</div>
        <div className="grid grid-cols-7 text-center text-[12px] text-[#B3B9C6] mb-1">
          {['日', '一', '二', '三', '四', '五', '六'].map((w) => <span key={w}>{w}</span>)}
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
                className={`h-9 mx-auto w-9 rounded-full text-[14px] border-none cursor-pointer ${on ? 'bg-[#4B6EF5] text-white' : 'bg-transparent text-[#1A1D26]'}`}
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
          确定
        </button>
      </div>
    </SheetShell>
  );
}

/* ============================= 选择账户 ============================= */
function AccountPickSheet() {
  const close = useClose();
  const { bindTap, bindAction } = useKapiGestures();
  const accounts = useKapiStore((s) => s.accounts);
  const applyAttr = useKapiStore((s) => s.applyAttr);
  return (
    <SheetShell close={close} variant="bottom" title="选择账户" closeIcon>
      <div className="p-4 flex flex-col gap-2">
        <button
          {...bindAction('accountPick.none.select.option', () => { applyAttr({ accountId: null }); close(); }, { value: 'none' })}
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#F4F6FA] border-none cursor-pointer text-left"
        >
          <IcCash size={20} className="text-[#8A92A6]" />
          <span className="text-[15px]">不关联已有账户(仅计入账单)</span>
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
          <IcPlus size={18} /> 添加账户
        </button>
      </div>
    </SheetShell>
  );
}

/* ============================= 添加分类预算 ============================= */
function BudgetAddCatSheet() {
  const close = useClose();
  const { bindTap, bindAction } = useKapiGestures();
  const setCategoryTarget = useKapiStore((s) => s.setCategoryTarget);
  const pickedId = useKapiStore((s) => s._pickedCategoryId);
  const cats = useKapiStore((s) => s.categories.expense);
  const addCategoryBudget = useKapiStore((s) => s.addCategoryBudget);
  const [amt, setAmt] = useState('');
  const picked = cats.find((c) => c.id === pickedId);
  useEffect(() => { setCategoryTarget('budget'); }, [setCategoryTarget]);
  return (
    <SheetShell close={close} variant="bottom" title="添加分类预算" closeIcon>
      <div className="p-4 flex flex-col gap-3">
        <button {...bindTap('budgetAdd.category.open')} className="flex items-center justify-between px-3 py-3 rounded-xl bg-[#F4F6FA] border-none cursor-pointer">
          <span className="text-[15px]">选择分类</span>
          <span className="text-[14px] text-[#8A92A6]">{picked ? picked.name : '请选择 ›'}</span>
        </button>
        <input
          data-action="budgetAdd.amount.input.value"
          data-action-type="input"
          inputMode="decimal"
          value={amt}
          onChange={(e) => setAmt(e.target.value)}
          placeholder="预算金额"
          className="w-full px-3 py-3 rounded-xl bg-[#F4F6FA] border-none outline-none text-[15px]"
        />
        <button
          {...bindAction('budgetAdd.amount.input.value', () => {
            const v = parseFloat(amt) || 0;
            if (!picked || v <= 0) { toast('请选择分类并输入金额'); return; }
            addCategoryBudget(picked.id, v); toast('已设置分类预算'); close();
          }, { value: amt })}
          className="mt-2 w-full py-3 rounded-xl bg-[#4B6EF5] text-white text-[16px] border-none cursor-pointer"
        >
          确认
        </button>
      </div>
    </SheetShell>
  );
}

/* ============================= 编辑日预算 ============================= */
function EditDaySheet() {
  const close = useClose();
  const { bindAction } = useKapiGestures();
  const setDailyBudget = useKapiStore((s) => s.setDailyBudget);
  const [amt, setAmt] = useState('');
  return (
    <SheetShell close={close} variant="bottom" title="编辑日预算" closeIcon>
      <div className="p-4 flex flex-col gap-3">
        <input
          data-action="editDay.amount.input.value"
          data-action-type="input"
          inputMode="decimal"
          value={amt}
          onChange={(e) => setAmt(e.target.value)}
          placeholder="今日预算金额"
          className="w-full px-3 py-3 rounded-xl bg-[#F4F6FA] border-none outline-none text-[15px]"
        />
        <button
          {...bindAction('editDay.amount.input.value', () => {
            const v = parseFloat(amt) || 0;
            if (v <= 0) { toast('请输入金额'); return; }
            setDailyBudget(dateKey(TimeService.now()), v); toast('日预算已更新'); close();
          }, { value: amt })}
          className="w-full py-3 rounded-xl bg-[#4B6EF5] text-white text-[16px] border-none cursor-pointer"
        >
          确认
        </button>
      </div>
    </SheetShell>
  );
}

/* ============================= 账本切换 ============================= */
function LedgerSwitchSheet() {
  const close = useClose();
  const { bindTap, bindAction } = useKapiGestures();
  const ledgers = useKapiStore((s) => s.ledgers);
  const currentId = useKapiStore((s) => s.currentLedgerId);
  const setCurrentLedger = useKapiStore((s) => s.setCurrentLedger);
  return (
    <SheetShell close={close} variant="bottom" title="账本管理" closeIcon>
      <div className="p-4 flex flex-col gap-2">
        {ledgers.map((l) => (
          <button
            key={l.id}
            {...bindAction('ledger.item.select.ledger', () => { setCurrentLedger(l.id); toast(`已切换到 ${l.name}`); close(); }, { ledgerId: l.id })}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#F4F6FA] border-none cursor-pointer text-left"
          >
            <span className="text-[22px]">{l.cover}</span>
            <span className="flex-1 text-[15px] text-[#1A1D26]">{l.name}</span>
            {l.id === currentId && <IcCheck size={18} className="text-[#4B6EF5]" />}
          </button>
        ))}
        <button {...bindTap('ledger.create.open')} className="flex items-center gap-2 px-4 py-3 text-[#4B6EF5] text-[15px] bg-transparent border-none cursor-pointer">
          <IcPlus size={18} /> 添加账本
        </button>
      </div>
    </SheetShell>
  );
}

/* ============================= 新建账本 ============================= */
function LedgerCreateSheet() {
  const close = useClose();
  const { bindAction } = useKapiGestures();
  const addLedger = useKapiStore((s) => s.addLedger);
  const [type, setType] = useState<'personal' | 'shared'>('personal');
  const [name, setName] = useState('');
  return (
    <SheetShell close={close} variant="bottom" title="新建账本" closeIcon>
      <div className="p-4 flex flex-col gap-3">
        <div className="flex bg-[#F0F2F8] rounded-full p-1 self-center">
          {(['personal', 'shared'] as const).map((t) => (
            <button
              key={t}
              {...bindAction('ledgerCreate.type.select.tab', () => setType(t), { value: t })}
              className={`px-6 py-1.5 rounded-full text-[14px] border-none cursor-pointer ${type === t ? 'bg-white text-[#4B6EF5] font-semibold' : 'bg-transparent text-[#8A92A6]'}`}
            >
              {t === 'personal' ? '个人账本' : '共享账本'}
            </button>
          ))}
        </div>
        <input
          data-action="ledgerCreate.field.input.value"
          data-action-type="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="账本名称"
          className="w-full px-3 py-3 rounded-xl bg-[#F4F6FA] border-none outline-none text-[15px]"
        />
        {type === 'shared' && (
          <button {...bindAction('ledgerCreate.member.noop', () => toast('该功能暂未开放'))} className="px-3 py-3 rounded-xl bg-[#F4F6FA] text-left text-[15px] text-[#8A92A6] border-none cursor-pointer">
            添加账本成员 ›
          </button>
        )}
        <button
          {...bindAction('ledgerCreate.submit.confirm.create', () => {
            if (!name.trim()) { toast('请输入账本名称'); return; }
            addLedger({ name: name.trim(), type, cover: type === 'shared' ? '👥' : '📓', includeInTotal: true });
            toast('账本已创建'); close();
          })}
          className="mt-2 w-full py-3 rounded-xl bg-[#4B6EF5] text-white text-[16px] border-none cursor-pointer"
        >
          确认
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
  const user = useKapiStore((s) => s.user);
  return (
    <SheetShell close={close} variant="left">
      <div className="flex flex-col h-full overflow-y-auto pt-12 px-4 pb-6 gap-4" data-scroll-container="drawer" data-scroll-direction="vertical">
        <button {...bindTap('drawer.profile.open')} className="flex items-center gap-3 bg-transparent border-none cursor-pointer">
          <Avatar src={user.avatar} size={48} />
          <span className="text-[17px] font-semibold text-[#1A1D26]">{user.nick}</span>
          <span className="text-[#B3B9C6]">›</span>
        </button>

        <div {...bindTap('drawer.checkin.open')} className="bg-white rounded-2xl p-4 cursor-pointer">
          <div className="text-[13px] text-[#8A92A6] mb-2">June 2026</div>
          <div className="flex gap-1 mb-3">
            {Array.from({ length: 14 }).map((_, i) => (
              <span key={i} className="w-4 h-4 rounded-[3px]" style={{ background: i < 8 ? '#4B6EF5' : '#E3E6EE' }} />
            ))}
          </div>
          <div className="flex justify-around text-center">
            <div><div className="text-[18px] font-bold text-[#1A1D26]">{user.recordDays}</div><div className="text-[12px] text-[#8A92A6]">记录天数</div></div>
            <div><div className="text-[18px] font-bold text-[#1A1D26]">{user.totalRecords}</div><div className="text-[12px] text-[#8A92A6]">总记录</div></div>
            <div><div className="text-[18px] font-bold text-[#1A1D26]">{user.streakDays}</div><div className="text-[12px] text-[#8A92A6]">连续天数</div></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-2">
          <div className="text-[14px] font-semibold text-[#1A1D26] px-2 py-2">更多功能</div>
          <div className="grid grid-cols-3 gap-y-4 py-2">
            <DrawerFunc bind={bindTap('drawer.stats.open')} label="图表统计" />
            <DrawerFunc bind={bindTap('drawer.asset.open')} label="资产管理" />
            <DrawerFunc bind={bindTap('drawer.ledger.open')} label="账本管理" />
            <DrawerFunc bind={bindTap('drawer.budget.open')} label="预算管理" />
            <DrawerFunc bind={bindTap('drawer.category.open')} label="分类管理" />
          </div>
        </div>

        <button {...bindTap('drawer.settings.open')} className="bg-white rounded-2xl px-4 py-3 flex items-center text-[15px] text-[#1A1D26] border-none cursor-pointer">
          设置 <span className="flex-1" /> <span className="text-[#B3B9C6]">›</span>
        </button>
      </div>
    </SheetShell>
  );
}

/* ============================= 修改实付金额(gate4:F3) ============================= */
function AmountEditSheet() {
  const close = useClose();
  const activeBillId = useKapiStore((s) => s._activeBillId);
  const bills = useKapiStore((s) => s.bills);
  const updateBill = useKapiStore((s) => s.updateBill);
  const bill = bills.find((b) => b.id === activeBillId);
  const [expr, setExpr] = useState(bill ? String(bill.amount) : '');
  return (
    <SheetShell close={close} variant="bottom" title="修改实付金额" closeIcon>
      <div className="px-4 pt-2 pb-1 text-[28px] font-bold text-[#4B6EF5]">¥ {expr || '0.00'}</div>
      <Keypad
        inputActionId="amountEdit.amount.input.value"
        onInput={(k) => setExpr((e) => (k === 'del' ? e.slice(0, -1) : k === '+' || k === '-' ? e : e + k))}
        primaryLabel="完成"
        primaryActionId="amountEdit.submit.confirm.done"
        onPrimary={() => {
          const amt = parseFloat(expr) || 0;
          if (amt <= 0) { toast('请输入金额'); return; }
          if (activeBillId) updateBill(activeBillId, { amount: Math.round(amt * 100) / 100 });
          toast('金额已更新');
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
  const existing = useKapiStore((s) => s._statsRange);
  const setStatsRange = useKapiStore((s) => s.setStatsRange);
  const [view, setView] = useState(TimeService.now());
  const [start, setStart] = useState<number | null>(existing?.start ?? null);
  const [end, setEnd] = useState<number | null>(existing?.end ?? null);

  const vd = TimeService.fromTimestamp(view);
  const year = vd.getFullYear();
  const month = vd.getMonth();
  const firstDay = TimeService.fromLocalParts(year, month, 1).getDay();
  const daysInMonth = TimeService.fromLocalParts(year, month + 1, 0).getDate();

  const pick = (ts: number) => {
    if (start === null || end !== null) { setStart(ts); setEnd(null); }
    else if (ts < start) { setStart(ts); }
    else { setEnd(ts); }
  };
  const shiftMonth = (delta: number) => setView(TimeService.fromLocalParts(year, month + delta, 1).getTime());

  return (
    <SheetShell close={close} variant="bottom" title="选择统计区间" closeIcon>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => shiftMonth(-1)} className="bg-transparent border-none cursor-pointer p-1" aria-label="上个月"><IcNavBack size={18} className="text-[#8A92A6]" /></button>
          <span className="text-[15px] font-semibold">{year}年{month + 1}月</span>
          <button onClick={() => shiftMonth(1)} className="bg-transparent border-none cursor-pointer p-1" aria-label="下个月"><IcArrowRight size={18} className="text-[#8A92A6]" /></button>
        </div>
        <div className="text-center text-[12px] text-[#8A92A6] mb-2">
          {start ? `${dateKey(start).slice(5)}` : '起'} ~ {end ? `${dateKey(end).slice(5)}` : '止'}
        </div>
        <div className="grid grid-cols-7 text-center text-[12px] text-[#B3B9C6] mb-1">
          {['日', '一', '二', '三', '四', '五', '六'].map((w) => <span key={w}>{w}</span>)}
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
                className={`h-9 mx-auto w-9 rounded-full text-[14px] border-none cursor-pointer ${isEdge ? 'bg-[#4B6EF5] text-white' : isEnd ? 'bg-[#EAF0FE] text-[#4B6EF5]' : 'bg-transparent text-[#1A1D26]'}`}
              >
                {day}
              </button>
            );
          })}
        </div>
        <button
          {...bindAction('statsRange.submit.confirm.done', () => {
            if (start === null) { toast('请选择起始日期'); return; }
            setStatsRange({ start, end: end ?? start });
            toast('区间已更新');
            close();
          })}
          className="mt-4 w-full py-3 rounded-xl bg-[#4B6EF5] text-white text-[16px] border-none cursor-pointer"
        >
          确定
        </button>
      </div>
    </SheetShell>
  );
}

/* ============================= 选择性别(gate4:F6) ============================= */
function GenderPickSheet() {
  const close = useClose();
  const { bindAction } = useKapiGestures();
  const updateProfile = useKapiStore((s) => s.updateProfile);
  const cur = useKapiStore((s) => s.user.gender);
  const OPTIONS = ['男', '女', '保密'];
  return (
    <SheetShell close={close} variant="bottom" title="选择性别" closeIcon>
      <div className="p-4 flex flex-col gap-2 pb-6">
        {OPTIONS.map((g) => (
          <button
            key={g}
            {...bindAction('profile.gender.select.option', () => { updateProfile('gender', g); toast(`已设为${g}`); close(); }, { value: g })}
            className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#F4F6FA] border-none cursor-pointer text-[15px] text-[#1A1D26]"
          >
            {g}
            {cur === g && <IcCheck size={18} className="text-[#4B6EF5]" />}
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
