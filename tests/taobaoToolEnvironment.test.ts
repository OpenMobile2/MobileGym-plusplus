import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

function createLocalStorageMock() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  };
}

describe('Taobao environment tools', () => {
  let executeTaobaoTool: typeof import('../app_tools/apps/taobao').executeTaobaoTool;
  let useTaobaoStore: typeof import('../apps/Taobao/state').useTaobaoStore;
  let initialState: ReturnType<typeof useTaobaoStore.getState>;
  let route = '/';

  beforeAll(async () => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: createLocalStorageMock(),
      configurable: true,
    });
    Object.defineProperty(globalThis, 'window', {
      value: {
        setTimeout,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        location: { search: '' },
        __OS__: {
          openApp: (_appId: string, nextRoute?: string) => {
            route = nextRoute ?? '/';
          },
          getAppRoute: () => ({ app: 'taobao', path: route }),
        },
      },
      configurable: true,
    });

    ({ executeTaobaoTool } = await import('../app_tools/apps/taobao'));
    ({ useTaobaoStore } = await import('../apps/Taobao/state'));
    initialState = useTaobaoStore.getState();
  });

  beforeEach(() => {
    route = '/';
    useTaobaoStore.setState(initialState, true);
  });

  it('removes exactly the cart rows prepared by the tool when the order is created', async () => {
    const originalCart = initialState.cart.filter((line) => !line.invalid).slice(0, 2);
    expect(originalCart).toHaveLength(2);
    const [unrelated, target] = originalCart;
    useTaobaoStore.setState({
      cart: initialState.cart.map((line) => ({
        ...line,
        selected: line.id === unrelated.id,
      })),
      checkout: null,
    });

    const result = await executeTaobaoTool('taobao__prepare_checkout', {
      cart_line_ids: [target.id],
    });

    expect(result).toMatchObject({ persisted: false, line_count: 1 });
    expect(route).toBe('/order/confirm');
    expect(useTaobaoStore.getState().checkout?.sourceCartLineIds).toEqual([target.id]);
    expect(useTaobaoStore.getState().cart.find((line) => line.id === target.id)?.selected).toBe(false);

    const orderId = useTaobaoStore.getState().createOrder();
    expect(orderId).not.toBe('');
    expect(useTaobaoStore.getState().cart.some((line) => line.id === target.id)).toBe(false);
    expect(useTaobaoStore.getState().cart.some((line) => line.id === unrelated.id)).toBe(true);
    expect(useTaobaoStore.getState().orders[0].lines.map((line) => line.itemId)).toEqual([target.itemId]);
  });
});
