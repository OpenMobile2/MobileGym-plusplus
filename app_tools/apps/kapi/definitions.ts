import { defineAppTools, ID, LIMIT, STRING } from '../../core/define';

const DATE = { ...STRING, description: 'Local calendar date in YYYY-MM-DD format.' };
const CATEGORY_NAME = { ...STRING, description: 'Exact category display name, e.g. 餐饮 or 交通.', maxLength: 50 };
const LEDGER_NAME = { ...STRING, description: 'Ledger display name, e.g. 总账本. Defaults to the current ledger.', maxLength: 50 };
const AMOUNT = { type: 'number', exclusiveMinimum: 0, maximum: 999999.99 } as const;

export const KAPI_TOOL_DEFINITIONS = defineAppTools('kapi', [
  {
    name: 'search_bills',
    description: 'Search bill (transaction) records by keyword, expense/income type, date range, and ledger. Keyword matches the same note/category/counterparty text used by the in-app bill search. Returns compact summaries without counterparty, tags, discount, or refund detail; use open_bill for that.',
    properties: {
      query: { ...STRING, description: 'Optional text to match against the note, category name, or counterparty. Omit to list every bill matching the other filters.' },
      type: { type: 'string', enum: ['expense', 'income'], description: 'Optional; omit to include both expense and income bills.' },
      date_from: DATE,
      date_to: DATE,
      ledger_name: LEDGER_NAME,
      limit: LIMIT,
    },
  },
  {
    name: 'get_category_summary',
    description: 'Aggregate expense totals by category over an inclusive local date range (the same computation the Stats page uses for a custom range), plus overall expense/income/net totals for that range. Only categories with at least one matching bill are returned.',
    properties: {
      date_from: DATE,
      date_to: DATE,
      ledger_name: LEDGER_NAME,
    },
    required: ['date_from', 'date_to'],
  },
  {
    name: 'get_budget_status',
    description: 'Return the configured monthly budget target and the per-category budget limits set on the Budget page. This is the configured target only; it does not compute live spend. Pair with get_category_summary over an explicit date range to compare spend against these limits.',
  },
  {
    name: 'list_accounts',
    description: 'List asset accounts with balances and the net worth total, as shown on the Assets page. Returns an empty list when no account has been added yet.',
  },
  {
    name: 'open_bill',
    description: 'Open one bill detail page by bill_id returned from search_bills. Counterparty, tags, discount/refund, and the reimburse/exclude-flow/exclude-budget switches are only visible in the GUI after this navigation; read a fresh screenshot after this call.',
    properties: { bill_id: ID },
    required: ['bill_id'],
    kind: 'navigation',
  },
  {
    name: 'open_category',
    description: 'Open the category drill-down page for one category by its exact display name. Sub-category names for that category are only visible in the GUI after this navigation; read a fresh screenshot after this call.',
    properties: { category_name: CATEGORY_NAME },
    required: ['category_name'],
    kind: 'navigation',
  },
  {
    name: 'open_stats',
    description: 'Open the Stats page. It opens on its default month view; switch the period tab or pick a custom range from the GUI. Read a fresh screenshot after this call.',
    kind: 'navigation',
  },
  {
    name: 'prepare_bill_draft',
    description: 'Prefill the manual record-entry sheet (type, category, amount, note, date, ledger) without saving a bill. The user must still tap 完成 (or 再记) in the GUI to actually save it; read a fresh screenshot after this call and complete the save through the GUI.',
    properties: {
      type: { type: 'string', enum: ['expense', 'income'], default: 'expense' },
      category_name: CATEGORY_NAME,
      amount: AMOUNT,
      note: { ...STRING, maxLength: 100 },
      date: DATE,
      ledger_name: LEDGER_NAME,
    },
    required: ['category_name', 'amount'],
    kind: 'draft',
  },
]);
