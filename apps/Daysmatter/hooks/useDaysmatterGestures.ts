import type React from 'react';
import { useTriggerGestures } from '../../../os/hooks/useTriggerGestures';
import type { TransitionId } from '../navigation.declaration';
import { useAppNavigate } from '../navigation';

type SystemTriggerId = 'system.back';
type GestureId = TransitionId | SystemTriggerId;

export function useDaysmatterGestures() {
  const { go, back } = useAppNavigate();
  const { bindTap: rawTap, bindLongPress: rawLongPress } = useTriggerGestures<GestureId>({
    execute: (id, params) => {
      if (id === 'system.back') return;
      go(id as TransitionId, params);
    },
  });

  type TapOptions<T extends HTMLElement> = {
    params?: Record<string, string | number>;
    preventDefault?: boolean;
    stopPropagation?: boolean;
    beforeTrigger?: (event: React.SyntheticEvent<T>) => void;
    onTrigger?: () => void;
  };

  /** 触发 transition(导航/改 search),产出 data-trigger */
  const bindTap = <T extends HTMLElement>(id: TransitionId, options?: TapOptions<T>) =>
    rawTap<T>(id, options);

  /** 长按触发 transition */
  const bindLongPress = <T extends HTMLElement>(id: TransitionId, options?: TapOptions<T>) =>
    rawLongPress<T>(id, options);

  /** 原地动作(改 store/本地态),产出 data-action */
  const action = <T extends HTMLElement>(
    id: string,
    onTrigger: () => void,
    options?: Omit<TapOptions<T>, 'onTrigger'> & { params?: Record<string, string | number | boolean> },
  ) => rawTap<T>({ kind: 'action', id }, { ...options, onTrigger });

  /** 返回键 */
  const bindBack = <T extends HTMLElement>(options?: TapOptions<T> & { steps?: number }) => {
    const { steps, params, ...rest } = options ?? {};
    const binding = rawTap<T>('system.back', {
      ...rest,
      params: { ...(params ?? {}), steps: steps ?? 1 },
    });
    return { ...binding, 'data-trigger-type': 'back' as const };
  };

  return { bindTap, bindLongPress, action, bindBack, go, back };
}
