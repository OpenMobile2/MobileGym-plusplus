import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { TransitionId } from './navigation.declaration';

type GoOptions = { mode?: 'push' | 'replace'; state?: Record<string, unknown> };

export function useAppNavigate() {
  const navigate = useNavigate();
  const location = useLocation();

  const go = useCallback(
    (transitionId: TransitionId, params?: Record<string, string>, options?: GoOptions) => {
      const mode = options?.mode ?? 'push';
      switch (transitionId) {
        case 'meituan.home-open':
          navigate('/', { replace: true });
          break;
        case 'meituan.open-restaurant':
          navigate(`/restaurant/${params?.rid ?? ''}`, { replace: mode === 'replace' });
          break;
        case 'meituan.cart-open':
          navigate(`${location.pathname}?cart=open`);
          break;
        case 'meituan.cart-close':
          navigate(-1);
          break;
        case 'meituan.open-order-confirm':
          navigate('/order-confirm');
          break;
        case 'meituan.submit-order':
          navigate('/order-success', { replace: true });
          break;
        case 'meituan.open-orders':
          navigate('/orders', { replace: mode === 'replace' });
          break;
        case 'meituan.open-me':
          navigate('/me', { replace: true });
          break;
        case 'meituan.restaurant-comments':
          navigate(`${location.pathname}?tab=comments`, { replace: true });
          break;
        case 'meituan.restaurant-menu':
          navigate(`${location.pathname}`, { replace: true });
          break;
        default:
          break;
      }
    },
    [navigate, location.pathname],
  );

  const back = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  return { go, back };
}
