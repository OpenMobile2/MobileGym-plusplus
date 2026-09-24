import { useKapiStore } from '@/apps/Kapi/state';
import type { KapiBill, KapiCategory, FlowType } from '@/apps/Kapi/types';
import { expenseByCategory, ledgerBills, periodRange, rangeBills, sumByType } from '@/apps/Kapi/components/derive';
import * as TimeService from '@/os/TimeService';
import { assertAllowedKeys, optionalString, requireString, ToolExecutionError } from '../../core/errors';
import { compactResult, getLimit, includesQuery, requireFound } from '../../core/helpers';
import { openAppRoute } from '../../core/navigation';
import type { JsonObject, ToolHandler } from '../../core/types';
import { KAPI_TOOL_DEFINITIONS } from './definitions';

const state = () => useKapiStore.getState();

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseBusinessDate(input: JsonObject, key: string): number | undefined {
  const raw = optionalString(input, key);
  if (raw === undefined) return undefined;
  if (!DATE_ONLY_RE.test(raw)) {
    throw new ToolExecutionError('INVALID_ARGUMENT', `"${key}" must use YYYY-MM-DD format.`);
  }
  const ts = TimeService.parseToTimestamp(raw);
  if (!ts) {
    throw new ToolExecutionError('INVALID_ARGUMENT', `"${key}" must use YYYY-MM-DD format.`);
  }
  return ts;
}

function requireBusinessDate(input: JsonObject, key: string): number {
  const ts = parseBusinessDate(input, key);
  if (ts === undefined) {
    throw new ToolExecutionError('INVALID_ARGUMENT', `"${key}" is required.`);
  }
  return ts;
}

/** Exclusive end-of-day boundary for an inclusive local date, mirroring derive.ts's periodRange('custom', ...). */
function endOfDayExclusive(ts: number): number {
  const d = TimeService.fromTimestamp(ts);
  return TimeService.fromLocalParts(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime();
}

/** Local noon on the given date, matching the day-bucket convention used by BudgetPage/CalendarPage. */
function localNoon(ts: number): number {
  const d = TimeService.fromTimestamp(ts);
  return TimeService.fromLocalParts(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0).getTime();
}

function requireAmount(input: JsonObject, key = 'amount'): number {
  const value = input[key];
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || value > 999999.99) {
    throw new ToolExecutionError('INVALID_ARGUMENT', `"${key}" must be a positive number up to 999999.99.`);
  }
  return Math.round(value * 100) / 100;
}

function resolveOptionalType(input: JsonObject): 'expense' | 'income' | undefined {
  const value = input.type;
  if (value === undefined) return undefined;
  if (value !== 'expense' && value !== 'income') {
    throw new ToolExecutionError('INVALID_ARGUMENT', '"type" must be one of: expense, income.');
  }
  return value;
}

function resolveLedgerId(input: JsonObject): string {
  const name = optionalString(input, 'ledger_name', { maxLength: 50 });
  if (name === undefined) return state().currentLedgerId;
  const ledger = state().ledgers.find((l) => l.name === name);
  return requireFound(ledger, 'LEDGER_NOT_FOUND', `Kapi ledger not found: ${name}`).id;
}

function findCategory(type: 'expense' | 'income', name: string): KapiCategory {
  const list = type === 'expense' ? state().categories.expense : state().categories.income;
  return requireFound(list.find((c) => c.name === name), 'CATEGORY_NOT_FOUND', `Kapi ${type} category not found: ${name}`);
}

function findCategoryAnyType(name: string): KapiCategory {
  const all = [...state().categories.expense, ...state().categories.income];
  return requireFound(all.find((c) => c.name === name), 'CATEGORY_NOT_FOUND', `Kapi category not found: ${name}`);
}

function findCategoryOrSub(name: string): { category: KapiCategory; subId?: string } {
  const all = [...state().categories.expense, ...state().categories.income];
  const top = all.find((c) => c.name === name);
  if (top) return { category: top };
  for (const category of all) {
    const sub = category.subs?.find((row) => row.name === name);
    if (sub) return { category, subId: sub.id };
  }
  throw new ToolExecutionError('CATEGORY_NOT_FOUND', `Kapi category not found: ${name}`);
}

const billSummary = (b: KapiBill) => ({
  bill_id: b.id,
  type: b.type,
  category_id: b.categoryId,
  category_name: b.categoryName,
  amount: b.amount,
  note: b.note,
  date: TimeService.fromTimestamp(b.date).toISOString(),
});

const handlers: Record<string, ToolHandler> = {
  kapi__search_bills: (input) => {
    assertAllowedKeys(input, ['query', 'type', 'date_from', 'date_to', 'ledger_name', 'limit']);
    const query = optionalString(input, 'query', { maxLength: 200 });
    const type = resolveOptionalType(input);
    const startTs = parseBusinessDate(input, 'date_from');
    const dateToTs = parseBusinessDate(input, 'date_to');
    const endExclusive = dateToTs === undefined ? undefined : endOfDayExclusive(dateToTs);
    if (startTs !== undefined && endExclusive !== undefined && endExclusive <= startTs) {
      throw new ToolExecutionError('INVALID_ARGUMENT', '"date_to" must not be before "date_from".');
    }
    const ledgerId = resolveLedgerId(input);
    const limit = getLimit(input, 50);
    const rows = ledgerBills(state().bills, ledgerId)
      .filter((b) => type === undefined || b.type === type)
      .filter((b) => startTs === undefined || b.date >= startTs)
      .filter((b) => endExclusive === undefined || b.date < endExclusive)
      .filter((b) => query === undefined || includesQuery([b.note, b.categoryName, b.payee ?? ''], query))
      .sort((a, b) => b.date - a.date)
      .map(billSummary);
    return compactResult(rows, limit);
  },

  kapi__get_category_summary: (input) => {
    assertAllowedKeys(input, ['date_from', 'date_to', 'ledger_name']);
    const startTs = requireBusinessDate(input, 'date_from');
    const endTs = requireBusinessDate(input, 'date_to');
    if (endTs < startTs) {
      throw new ToolExecutionError('INVALID_ARGUMENT', '"date_to" must not be before "date_from".');
    }
    const ledgerId = resolveLedgerId(input);
    const range = periodRange('custom', 0, 0, { start: startTs, end: endTs });
    const bills = rangeBills(state().bills, ledgerId, range);
    const expense = sumByType(bills, 'expense');
    const income = sumByType(bills, 'income');
    return {
      date_from: input.date_from,
      date_to: input.date_to,
      expense,
      income,
      net: Math.round((income - expense) * 100) / 100,
      categories: expenseByCategory(bills).map((c) => ({
        category_id: c.id,
        category_name: c.name,
        amount: c.amount,
        pct: c.pct,
      })),
    };
  },

  kapi__get_budget_status: () => {
    const budget = state().budget;
    const allCategories = [...state().categories.expense, ...state().categories.income];
    return {
      monthly: budget.monthly,
      categories: budget.categories.map((cb) => ({
        category_id: cb.categoryId,
        category_name: allCategories.find((c) => c.id === cb.categoryId)?.name ?? cb.categoryId,
        amount: cb.amount,
      })),
    };
  },

  kapi__list_accounts: () => {
    const accounts = state().accounts;
    const netWorth = accounts.filter((a) => a.includeInTotal).reduce((sum, a) => sum + a.balance, 0);
    return {
      net_worth: Math.round(netWorth * 100) / 100,
      accounts: accounts.map((a) => ({
        account_id: a.id,
        name: a.name,
        type_label: a.typeLabel,
        balance: a.balance,
        include_in_total: a.includeInTotal,
      })),
    };
  },

  kapi__open_bill: async (input) => {
    assertAllowedKeys(input, ['bill_id']);
    const billId = requireString(input, 'bill_id', { maxLength: 200 });
    const bill = requireFound(state().bills.find((b) => b.id === billId), 'BILL_NOT_FOUND', `Kapi bill not found: ${billId}`);
    const route = `/bill/${encodeURIComponent(bill.id)}`;
    await openAppRoute('kapi', route);
    return { route, bill_id: bill.id };
  },

  kapi__open_category: async (input) => {
    assertAllowedKeys(input, ['category_name']);
    const name = requireString(input, 'category_name', { maxLength: 50 });
    const found = findCategoryOrSub(name);
    const targetId = found.subId ?? found.category.id;
    const route = `/category/${encodeURIComponent(targetId)}`;
    await openAppRoute('kapi', route);
    return { route, category_id: targetId, category_name: name, parent_category_id: found.category.id };
  },

  kapi__open_stats: async () => {
    const route = '/stats';
    await openAppRoute('kapi', route);
    return { route };
  },

  kapi__prepare_bill_draft: async (input) => {
    assertAllowedKeys(input, ['type', 'category_name', 'amount', 'note', 'date', 'ledger_name']);
    const type: FlowType = resolveOptionalType(input) ?? 'expense';
    const categoryName = requireString(input, 'category_name', { maxLength: 50 });
    const category = findCategory(type, categoryName);
    const amount = requireAmount(input);
    const note = optionalString(input, 'note', { maxLength: 100 }) ?? '';
    const ledgerId = resolveLedgerId(input);
    const dateTs = parseBusinessDate(input, 'date');

    const store = state();
    store.draftReset(type);
    store.draftPatch({
      categoryId: category.id,
      categoryName: category.name,
      icon: category.icon,
      color: category.color,
      amountExpr: String(amount),
      note,
      ledgerId,
      ...(dateTs !== undefined ? { date: localNoon(dateTs) } : {}),
    });

    const route = '/?sheet=record';
    await openAppRoute('kapi', route);
    return {
      route,
      persisted: false,
      type,
      category_id: category.id,
      category_name: category.name,
      amount,
      ledger_id: ledgerId,
    };
  },
};

export function executeKapiTool(name: string, input: JsonObject) {
  return requireFound(handlers[name], 'TOOL_NOT_FOUND', `Unknown Kapi tool: ${name}`)(input);
}

export { KAPI_TOOL_DEFINITIONS } from './definitions';
