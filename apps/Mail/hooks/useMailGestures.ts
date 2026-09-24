import type React from 'react';
import { useTriggerGestures } from '../../../os/hooks/useTriggerGestures';
import type { TransitionId } from '../navigation.declaration';
import { useAppNavigate } from '../navigation';

type SystemTriggerId = 'system.back';
type GestureId = TransitionId | SystemTriggerId;

export function useMailGestures() {
  const { go, back, navigateTo } = useAppNavigate();
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

  /** 所有返回/关闭键统一入口，路由到 OS 的 handleBack */
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

  /**
   * action 的便捷绑定：执行副作用后关闭当前弹层。
   * 用于底部操作表里"点了就生效并收起"的项。
   */
  const bindActionThenBack = (id: string, run: () => void) =>
    bindTap({ kind: 'action', id }, {
      onTrigger: () => {
        run();
        back();
      },
    });

  return {
    bindTap,
    bindLongPress,
    bindDoubleTap,
    bindBack,
    bindActionThenBack,
    go,
    back,
    navigateTo,
  };
}
