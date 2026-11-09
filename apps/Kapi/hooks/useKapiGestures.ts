import type React from 'react';
import { useTriggerGestures } from '../../../os/hooks/useTriggerGestures';
import type { TransitionId } from '../navigation.declaration';
import { useAppNavigate } from '../navigation';

type SystemTriggerId = 'system.back';
type GestureId = TransitionId | SystemTriggerId;

export function useKapiGestures() {
  const { go, back } = useAppNavigate();
  const { bindTap, bindLongPress, bindDoubleTap } = useTriggerGestures<GestureId>({
    execute: (id, params) => {
      if (id === 'system.back') return;
      go(id, params);
    },
  });

  type TriggerTapOptions<T extends HTMLElement> = {
    params?: Record<string, string | number>;
    preventDefault?: boolean;
    stopPropagation?: boolean;
    beforeTrigger?: (event: React.SyntheticEvent<T>) => void;
    onTrigger?: () => void;
  };

  const bindBack = <T extends HTMLElement>(
    options?: (TriggerTapOptions<T> & { steps?: number }) | undefined,
  ) => {
    if (!options) {
      const binding = bindTap<T>('system.back', { params: { steps: 1 } });
      return { ...binding, 'data-trigger-type': 'back' as const };
    }
    const { steps, params, ...rest } = options;
    const binding = bindTap<T>('system.back', {
      ...rest,
      params: { ...(params ?? {}), steps: steps ?? 1 },
    });
    return { ...binding, 'data-trigger-type': 'back' as const };
  };

  /** 原地动作(data-action),不改变路由 */
  const bindAction = <T extends HTMLElement>(
    id: string,
    onTrigger: () => void,
    params?: Record<string, string | number | boolean>,
  ) => bindTap<T>({ kind: 'action', id }, { onTrigger, params });

  /** 长按原地动作 */
  const bindActionLong = <T extends HTMLElement>(
    id: string,
    onTrigger: () => void,
    params?: Record<string, string | number | boolean>,
  ) => bindLongPress<T>({ kind: 'action', id }, { onTrigger, params });

  return { bindTap, bindLongPress, bindDoubleTap, bindBack, bindAction, bindActionLong, go, back };
}
