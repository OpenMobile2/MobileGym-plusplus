import { useCallback, useContext } from 'react';
import { UNSAFE_NavigationContext, useLocation, useNavigate } from 'react-router-dom';
import { memoryHistoryPopTo } from '../../os/utils/memoryHistoryPopTo';
import { NAVIGATION_DECLARATION, type TransitionId } from './navigation.declaration';
import type { FromConstraint, TransitionDeclaration } from './navigation.types';

export function useAppNavigate() {
  const navigate = useNavigate();
  const location = useLocation();
  const { navigator } = useContext(UNSAFE_NavigationContext);

  const go = useCallback((
    id: TransitionId,
    params: Record<string, string | number> = {},
    options?: { mode?: 'push' | 'replace'; popTo?: string; popToInclusive?: boolean },
  ) => {
    const searchParams = new URLSearchParams(location.search);
    const transition = NAVIGATION_DECLARATION.transitions.find(item => item.id === id) as
      | TransitionDeclaration
      | undefined;

    if (!transition) {
      throw new Error(`Transition not found: ${id}`);
    }

    if (!matchFrom(transition.from, location.pathname, searchParams)) {
      throw new Error(`Transition "${id}" not allowed from "${location.pathname}${location.search}"`);
    }

    const inheritedPathParams = extractParamsFromPathTemplate(transition.to, location.pathname);
    const mergedParams = { ...inheritedPathParams, ...params };
    const targetPath = replaceParams(transition.to, mergedParams);
    const nextParams = buildSearchParams({
      currentSearchParams: searchParams,
      preserveParams: transition.preserveParams || [],
      staticSearch: transition.search,
      dynamicSearchParams: transition.searchParams,
      runtimeParams: mergedParams,
    });
    const search = nextParams.toString();
    const targetUrl = search ? `${targetPath}?${search}` : targetPath;

    if (options?.popTo) {
      memoryHistoryPopTo(navigator, options.popTo, { inclusive: options.popToInclusive });
    }

    const mode = options?.mode ?? transition.mode;
    navigate(targetUrl, mode === 'replace' ? { replace: true } : undefined);
  }, [location.pathname, location.search, navigate, navigator]);

  const back = useCallback((steps = 1) => navigate(-steps), [navigate]);

  return { go, back };
}

function buildSearchParams(options: {
  currentSearchParams: URLSearchParams;
  preserveParams: string[];
  staticSearch: Record<string, string | null>;
  dynamicSearchParams: Record<string, 'string' | 'number'>;
  runtimeParams: Record<string, string | number>;
}) {
  const next = new URLSearchParams();

  for (const key of options.preserveParams) {
    const value = options.currentSearchParams.get(key);
    if (value !== null) next.set(key, value);
  }

  for (const [key, value] of Object.entries(options.staticSearch)) {
    if (value === null) next.delete(key);
    else next.set(key, value);
  }

  for (const key of Object.keys(options.dynamicSearchParams)) {
    const value = options.runtimeParams[key];
    if (value !== undefined) next.set(key, String(value));
  }

  return next;
}

function matchFrom(
  from: TransitionDeclaration['from'],
  pathname: string,
  searchParams: URLSearchParams,
) {
  if (from === '*') return true;
  const constraints = Array.isArray(from) ? from : [from];
  return constraints.some((constraint) => {
    if (constraint === '*') return true;
    if (typeof constraint === 'string') return matchRoute(constraint, pathname);
    return matchConstraint(constraint, pathname, searchParams);
  });
}

function matchConstraint(constraint: FromConstraint, pathname: string, searchParams: URLSearchParams) {
  if (!matchRoute(constraint.path, pathname)) return false;
  if (!constraint.search) return true;

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

  return true;
}

function matchRoute(template: string, path: string) {
  if (template === '*') return true;
  return new RegExp(`^${template.replace(/:\w+/g, '[^/]+')}$`).test(path);
}

function replaceParams(path: string, params: Record<string, string | number>) {
  return path.replace(/:(\w+)/g, (_, key: string) => {
    const value = params[key];
    if (value === undefined) throw new Error(`Missing param "${key}" for path "${path}"`);
    return encodeURIComponent(String(value));
  });
}

function extractParamsFromPathTemplate(template: string, pathname: string): Record<string, string> {
  const keys: string[] = [];
  const pattern = `^${template.replace(/:([A-Za-z0-9_]+)/g, (_, key: string) => {
    keys.push(key);
    return '([^/]+)';
  })}$`;
  const match = pathname.match(new RegExp(pattern));
  if (!match) return {};

  const result: Record<string, string> = {};
  keys.forEach((key, index) => {
    result[key] = decodeURIComponent(match[index + 1]);
  });
  return result;
}
