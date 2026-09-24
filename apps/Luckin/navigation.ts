import { useCallback, useContext } from 'react';
import { UNSAFE_NavigationContext, useLocation, useNavigate } from 'react-router-dom';
import { memoryHistoryPopTo } from '../../os/utils/memoryHistoryPopTo';
import { NAVIGATION_DECLARATION, type TransitionId } from './navigation.declaration';
import type { FromConstraint, TransitionDeclaration } from './navigation.types';

function matchRoute(template: string, path: string): boolean {
  if (template === '*') return true;
  return new RegExp(`^${template.replace(/:\w+/g, '[^/]+')}$`).test(path);
}

function matchFrom(from: TransitionDeclaration['from'], pathname: string, searchParams: URLSearchParams): boolean {
  if (from === '*') return true;
  const list = Array.isArray(from) ? from : [from];
  return list.some((constraint) => {
    if (constraint === '*') return true;
    if (typeof constraint === 'string') return matchRoute(constraint, pathname);
    const item = constraint as FromConstraint;
    if (!matchRoute(item.path, pathname)) return false;
    return Object.entries(item.search ?? {}).every(([key, expected]) => {
      const actual = searchParams.get(key);
      if (expected === '*') return actual !== null;
      return expected === null ? actual === null : actual === expected;
    });
  });
}

export function useAppNavigate() {
  const navigate = useNavigate();
  const location = useLocation();
  const { navigator } = useContext(UNSAFE_NavigationContext);

  const go = useCallback((id: TransitionId, params: Record<string, string | number> = {}, options?: { mode?: 'push' | 'replace'; popTo?: string; popToInclusive?: boolean }) => {
    const transition = NAVIGATION_DECLARATION.transitions.find((item) => item.id === id) as TransitionDeclaration | undefined;
    if (!transition) throw new Error(`Transition not found: ${id}`);
    const currentSearch = new URLSearchParams(location.search);
    if (!matchFrom(transition.from, location.pathname, currentSearch)) {
      throw new Error(`Transition "${id}" not allowed from "${location.pathname}${location.search}"`);
    }
    const pathname = transition.to.replace(/:(\w+)/g, (_, key: string) => {
      const value = params[key];
      if (value === undefined) throw new Error(`Missing param "${key}" for transition "${id}"`);
      return String(value);
    });
    const nextSearch = new URLSearchParams();
    for (const key of transition.preserveParams ?? []) {
      const value = currentSearch.get(key);
      if (value !== null) nextSearch.set(key, value);
    }
    for (const [key, value] of Object.entries(transition.search)) {
      if (value !== null) nextSearch.set(key, value);
    }
    for (const key of Object.keys(transition.searchParams)) {
      if (params[key] !== undefined) nextSearch.set(key, String(params[key]));
    }
    const query = nextSearch.toString();
    const url = query ? `${pathname}?${query}` : pathname;
    if (options?.popTo) memoryHistoryPopTo(navigator, options.popTo, { inclusive: options.popToInclusive });
    navigate(url, { replace: (options?.mode ?? transition.mode) === 'replace' });
  }, [location.pathname, location.search, navigate, navigator]);

  const back = useCallback((steps = 1) => navigate(-steps), [navigate]);
  const setSearch = useCallback((updates: Record<string, string | null>, mode: 'push' | 'replace' = 'push') => {
    const search = new URLSearchParams(location.search);
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) search.delete(key);
      else search.set(key, value);
    }
    const query = search.toString();
    navigate(query ? `${location.pathname}?${query}` : location.pathname, { replace: mode === 'replace' });
  }, [location.pathname, location.search, navigate]);
  return { go, back, setSearch };
}
