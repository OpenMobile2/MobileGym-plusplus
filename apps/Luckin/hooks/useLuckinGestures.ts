import type React from 'react';
import { useTriggerGestures } from '../../../os/hooks/useTriggerGestures';
import { useAppNavigate } from '../navigation';
import type { TransitionId } from '../navigation.declaration';

type GestureId = TransitionId | 'system.back';

export function useLuckinGestures() {
  const { go, back, setSearch } = useAppNavigate();
  const { bindTap, bindLongPress, bindDoubleTap } = useTriggerGestures<GestureId>({
    execute: (id, params) => {
      if (id !== 'system.back') go(id, params);
    },
  });

  type TapOptions<T extends HTMLElement> = {
    params?: Record<string, string | number>;
    preventDefault?: boolean;
    stopPropagation?: boolean;
    beforeTrigger?: (event: React.SyntheticEvent<T>) => void;
    onTrigger?: () => void;
  };

  const bindBack = <T extends HTMLElement>(options?: TapOptions<T> & { steps?: number }) => {
    const { steps = 1, params, ...rest } = options ?? {};
    const binding = bindTap<T>('system.back', { ...rest, params: { ...(params ?? {}), steps } });
    return { ...binding, 'data-trigger-type': 'back' as const };
  };

  const bindAction = <T extends HTMLElement>(id: string, onTrigger: () => void, params?: Record<string, string | number | boolean>) => (
    bindTap<T>({ kind: 'action', id }, { onTrigger, params })
  );

  return { bindTap, bindLongPress, bindDoubleTap, bindBack, bindAction, go, back, setSearch };
}
