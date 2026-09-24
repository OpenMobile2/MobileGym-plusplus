import type React from 'react';
import { useRef } from 'react';
import { useTriggerGestures } from '../../../os/hooks/useTriggerGestures';
import type { TransitionId } from '../navigation.declaration';
import { useAppNavigate } from '../navigation';

type SystemTriggerId = 'system.back';
type GestureId = TransitionId | SystemTriggerId;
type NavOptions = { mode?: 'push' | 'replace'; popTo?: string; popToInclusive?: boolean };

export function useSlackGestures() {
  const { go, back } = useAppNavigate();
  const navOptsRef = useRef<Record<string, NavOptions>>({});
  const { bindTap: rawTap, bindLongPress: rawLongPress } = useTriggerGestures<GestureId>({
    execute: (id, params) => {
      if (id === 'system.back') return;
      try {
        go(id as TransitionId, params, navOptsRef.current[id]);
      } catch (err) {
        // Tab 按钮按规范无条件打标，但 from 不含自身目标（避免图上出现自环边）。
        // 点击当前所在 Tab 因此匹配不到来源，语义上就是 no-op，不该炸。
        const notAllowed = err instanceof Error && err.message.includes('not allowed from');
        if (!notAllowed) throw err;
      }
    },
  });

  type TapOptions<T extends HTMLElement> = {
    params?: Record<string, string | number>;
    preventDefault?: boolean;
    stopPropagation?: boolean;
    beforeTrigger?: (event: React.SyntheticEvent<T>) => void;
    onTrigger?: () => void;
    nav?: NavOptions;
  };

  const bindTap = <T extends HTMLElement>(id: TransitionId, options?: TapOptions<T>) => {
    if (options?.nav) navOptsRef.current[id] = options.nav;
    const { nav, ...rest } = options ?? {};
    void nav;
    return rawTap<T>(id, rest);
  };

  const bindLongPress = <T extends HTMLElement>(id: TransitionId, options?: TapOptions<T>) =>
    rawLongPress<T>(id, options);

  const action = <T extends HTMLElement>(
    id: string,
    onTrigger: () => void,
    options?: Omit<TapOptions<T>, 'onTrigger'> & {
      params?: Record<string, string | number | boolean>;
    },
  ) => rawTap<T>({ kind: 'action', id }, { ...options, onTrigger });

  /** 输入框只打标不绑点击：受控值由组件自己的 onChange 维护 */
  const bindInput = (id: string) => ({ 'data-action': id, 'data-action-type': 'input' }) as const;

  const bindBack = <T extends HTMLElement>(options?: TapOptions<T> & { steps?: number }) => {
    const { steps, params, ...rest } = options ?? {};
    const binding = rawTap<T>('system.back', {
      ...rest,
      params: { ...(params ?? {}), steps: steps ?? 1 },
    });
    return { ...binding, 'data-trigger-type': 'back' as const };
  };

  return { bindTap, bindLongPress, action, bindInput, bindBack, go, back };
}
