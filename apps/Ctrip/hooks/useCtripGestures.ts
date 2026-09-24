import type React from 'react';
import { useTriggerGestures } from '../../../os/hooks/useTriggerGestures';
import type { TransitionId } from '../navigation.declaration';
import { useAppNavigate } from '../navigation';

type SystemTriggerId = 'system.back';
type GestureId = TransitionId | SystemTriggerId;

/**
 * Ctrip 手势绑定(仿 Taobao)。bindTap 接受:
 *  - transition id 字符串字面量  -> 触发 go(id) 导航;
 *  - { kind:'action', id } 对象   -> 触发 data-action(状态变更,配 onTrigger 跑 store)。
 */
export function useCtripGestures() {
  const { go, back } = useAppNavigate();
  const { bindTap, bindLongPress, bindDoubleTap } = useTriggerGestures<GestureId>({
    execute: (id, params) => {
      if (id === 'system.back') return;
      go(id as TransitionId, params);
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

  return { bindTap, bindLongPress, bindDoubleTap, bindBack, go, back };
}
