import { useTriggerGestures } from '../../../os/hooks/useTriggerGestures';
import type { TransitionId } from '../navigation.declaration';
import { useAppNavigate } from '../navigation';

type SystemTriggerId = 'system.back';
type GestureId = TransitionId | SystemTriggerId;

export function useKeepGestures() {
  const { go, back, exitSearch } = useAppNavigate();
  const { bindTap, bindLongPress, bindDoubleTap } = useTriggerGestures<GestureId>({
    execute: (id, params) => {
      if (id === 'system.back') return;
      go(id as TransitionId, params);
    },
  });

  const bindBack = <T extends HTMLElement>() => {
    const binding = bindTap<T>('system.back', {
      params: { steps: 1 },
    });
    return { ...binding, 'data-trigger-type': 'back' as const };
  };

  return { bindTap, bindLongPress, bindDoubleTap, bindBack, go, back, exitSearch };
}
