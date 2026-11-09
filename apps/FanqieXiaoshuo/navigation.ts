import { useCallback, useContext } from 'react';
import { UNSAFE_NavigationContext, useLocation, useNavigate } from 'react-router-dom';
import { NAVIGATION_DECLARATION, TransitionId } from './navigation.declaration';
import type {
  CaseDeclaration,
  Condition,
  FromConstraint,
  Primitive,
  TransitionDeclaration,
  ValueRef,
} from './navigation.types';
import { memoryHistoryPopTo } from '../../os/utils/memoryHistoryPopTo';
import { getTracker } from '../../os/utils/memoryHistoryTracker';

type NavOptions = {
  mode?: 'push' | 'replace';
  popTo?: string;
  popToInclusive?: boolean;
  /** popTo 目标页占多条栈项时(基态 + 其 searchParams 浮层)一路弹干净 */
  popToCollapse?: boolean;
  state?: unknown;
};

/**
 * 转换级默认导航选项(阶段⑥ 走查轮3)。调用方显式传入的 options 优先。
 *
 * #1 搜索是「页内状态」:结果页点搜索框改词时,先弹掉「中间页→结果页」这一段再落回中间页,
 *    否则每轮改词都往栈里叠两条,取消一层层退不回搜索前的页面。
 * #3 书籍详情是进阅读器的中转页:进阅读器时把详情(含其简介/封面浮层)一起弹掉,
 *    阅读器返回一次即回到来源页(搜索结果/首页/书评页…)。
 */
const NAV_DEFAULTS: Partial<
  Record<TransitionId, (params: Record<string, string | number>) => NavOptions>
> = {
  'searchresult.search-open': () => ({ popTo: '/search', popToInclusive: true }),
  'bookdetail.reader-open': p => ({
    popTo: `/book/${p.id}`, popToInclusive: true, popToCollapse: true,
  }),
  'bookdetail.introread-open': p => ({
    popTo: `/book/${p.id}`, popToInclusive: true, popToCollapse: true,
  }),
};

export function useAppNavigate() {
  const navigate = useNavigate();
  const location = useLocation();
  const { navigator } = useContext(UNSAFE_NavigationContext);

  const go = useCallback(
    (
      id: TransitionId,
      params: Record<string, string | number> = {},
      options?: NavOptions,
    ) => {
      const opts: NavOptions = { ...(NAV_DEFAULTS[id]?.(params) ?? {}), ...(options ?? {}) };
      const searchParams = new URLSearchParams(location.search);
    const t = NAVIGATION_DECLARATION.transitions.find(
      transition => transition.id === id,
    ) as TransitionDeclaration | undefined;
    if (!t) {
      throw new Error(`Transition not found: ${id}`);
    }

    if (!matchFrom(t.from, location.pathname, searchParams)) {
      throw new Error(
        `Transition "${id}" not allowed from "${location.pathname}${location.search}"`,
      );
    }

    const chosen = chooseCase(t, { pathname: location.pathname, searchParams, params });
    const effectiveTo = chosen ? chosen.to : t.to;
    const effectiveSearch = chosen ? chosen.search : t.search;
    const effectiveSearchParams = chosen?.searchParams || t.searchParams;

    const targetPathname = replaceParams(effectiveTo, params);

    const newParams = buildSearchParams({
      currentSearchParams: searchParams,
      preserveParams: t.preserveParams || [],
      staticSearch: effectiveSearch,
      dynamicSearchParams: effectiveSearchParams,
      runtimeParams: params,
    });

    const searchStr = newParams.toString();
    const targetUrl = searchStr ? `${targetPathname}?${searchStr}` : targetPathname;

    if (opts.popTo) {
      memoryHistoryPopTo(navigator, opts.popTo, { inclusive: opts.popToInclusive });
      if (opts.popToCollapse && opts.popToInclusive && navigator) {
        // 弹一次只越过最上面那条;目标页还压在栈顶就继续弹(最多 4 条,防死循环)
        for (let i = 0; i < 4; i++) {
          const tracker = getTracker(navigator as object);
          const top = tracker?.stack[tracker.index];
          if (!top || top.pathname !== opts.popTo) break;
          memoryHistoryPopTo(navigator, opts.popTo, { inclusive: true });
        }
      }
    }
    const mode = opts.mode ?? t.mode;
    const navOptions: { replace?: boolean; state?: unknown } = {};
    if (mode === 'replace') navOptions.replace = true;
    if (opts.state !== undefined) navOptions.state = opts.state;
    navigate(targetUrl, Object.keys(navOptions).length > 0 ? navOptions : undefined);
    },
    [navigate, location.pathname, location.search, navigator],
  );

  const back = useCallback(
    (steps: number = 1) => {
    navigate(-steps);
    },
    [navigate],
  );

  return { go, back };
}

function matchFrom(
  from: TransitionDeclaration['from'],
  pathname: string,
  searchParams: URLSearchParams,
): boolean {
  if (from === '*') return true;
  const constraints = Array.isArray(from) ? from : [from];

  return constraints.some(constraint => {
    if (constraint === '*') return true;
    if (typeof constraint === 'string') {
      return matchRoute(constraint, pathname);
    }

    if (!matchRoute(constraint.path, pathname)) {
      return false;
    }

    if (constraint.search) {
      for (const [key, expected] of Object.entries(constraint.search)) {
        const actual = searchParams.get(key);

        if (expected === '*') {
          if (!actual) return false;
        } else if (expected === null) {
          if (actual !== null) return false;
        } else if (actual !== expected) {
          return false;
        }
      }
    }

    return true;
  });
}

function buildSearchParams(options: {
  currentSearchParams: URLSearchParams;
  preserveParams: string[];
  staticSearch: Record<string, string | null>;
  dynamicSearchParams: Record<string, 'string' | 'number'>;
  runtimeParams: Record<string, string | number>;
}): URLSearchParams {
  const { currentSearchParams, preserveParams, staticSearch, dynamicSearchParams, runtimeParams } =
    options;

  const newParams = new URLSearchParams();

  for (const key of preserveParams) {
    const value = currentSearchParams.get(key);
    if (value !== null) {
      newParams.set(key, value);
    }
  }

  for (const [key, value] of Object.entries(staticSearch)) {
    if (value === null) {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
  }

  for (const key of Object.keys(dynamicSearchParams)) {
    const value = runtimeParams[key];
    if (value !== undefined) {
      newParams.set(key, String(value));
    }
  }

  return newParams;
}

function replaceParams(path: string, params: Record<string, string | number>): string {
  return path.replace(/:(\w+)/g, (_, key) => {
    const value = params[key];
    if (value === undefined) {
      throw new Error(`Missing param "${key}" for path "${path}"`);
    }
    return String(value);
  });
}

function matchRoute(template: string, path: string): boolean {
  if (template === '*') return true;
  const regex = new RegExp('^' + template.replace(/:\w+/g, '[^/]+') + '$');
  return regex.test(path);
}

function chooseCase(
  t: TransitionDeclaration,
  ctx: { pathname: string; searchParams: URLSearchParams; params: Record<string, string | number> },
): CaseDeclaration | null {
  if (!t.cases || t.cases.length === 0) {
    return null;
  }

  for (const c of t.cases) {
    if (evalCondition(c.when, ctx)) return c;
  }

  throw new Error(
    `Transition "${t.id}" cases has no matching branch. Non-empty cases must end with { when: { op: 'always' } }.`,
  );
}

function evalCondition(
  cond: Condition,
  ctx: { pathname: string; searchParams: URLSearchParams; params: Record<string, string | number> },
): boolean {
  switch (cond.op) {
    case 'always':
      return true;
    case 'and':
      return cond.items.every(item => evalCondition(item, ctx));
    case 'or':
      return cond.items.some(item => evalCondition(item, ctx));
    case 'not':
      return !evalCondition(cond.item, ctx);
    case 'exists': {
      const v = resolveValue(cond.ref, ctx);
      return v !== null && v !== undefined && String(v) !== '';
    }
    case 'eq':
      return resolveValue(cond.left, ctx) === cond.right;
    case 'in': {
      const value = resolveValue(cond.left, ctx);
      return cond.right.includes(value);
    }
    case 'match': {
      const v = resolveValue(cond.left, ctx);
      if (v === null || v === undefined) return false;
      const re = new RegExp(cond.right);
      return re.test(String(v));
    }
    case 'gt':
    case 'gte':
    case 'lt':
    case 'lte': {
      const v = resolveValue(cond.left, ctx);
      const num = typeof v === 'number' ? v : Number(v);
      if (!Number.isFinite(num)) return false;
      if (cond.op === 'gt') return num > cond.right;
      if (cond.op === 'gte') return num >= cond.right;
      if (cond.op === 'lt') return num < cond.right;
      return num <= cond.right;
    }
    default:
      return false;
  }
}

function resolveValue(
  ref: ValueRef,
  ctx: { pathname: string; searchParams: URLSearchParams; params: Record<string, string | number> },
): Primitive {
  if (ref.ref === 'search') {
    const v = ctx.searchParams.get(ref.key);
    return v === null ? null : v;
  }
  if (ref.ref === 'param') {
    const value = ctx.params[ref.key];
    if (value === undefined) return null;
    return typeof value === 'number' || typeof value === 'boolean' ? value : String(value);
  }
  // appState 未接入，默认返回 null
  return null;
}
