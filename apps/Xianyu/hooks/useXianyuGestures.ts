import type React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTriggerGestures } from '../../../os/hooks/useTriggerGestures';
import type { TransitionId } from '../navigation.declaration';
import { useAppNavigate } from '../navigation';

type SystemTriggerId = 'system.back';
type GestureId = TransitionId | SystemTriggerId;

export function useXianyuGestures() {
  const location = useLocation();
  const navigate = useNavigate();
  const { go, back } = useAppNavigate();
  const { bindTap, bindLongPress, bindDoubleTap } = useTriggerGestures<GestureId>({
    execute: (id, params) => {
      if (id === 'system.back') return;
      // 离开页面前清掉 URL 弹层,避免历史栈留下 panel 条目导致返回误开弹窗
      const sp = new URLSearchParams(location.search);
      if (sp.has('panel')) {
        sp.delete('panel');
        const qs = sp.toString();
        navigate({ pathname: location.pathname, search: qs ? `?${qs}` : '' }, { replace: true });
      }
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

  return { bindTap, bindLongPress, bindDoubleTap, bindBack, go, back };
}
