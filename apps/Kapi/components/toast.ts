import { useEffect, useState } from 'react';

type Listener = (msg: string, id: number) => void;
const listeners = new Set<Listener>();
let counter = 0;

/** 全局轻提示(铁律①:未实现功能给明确反馈) */
export function toast(message: string): void {
  counter += 1;
  const id = counter;
  listeners.forEach((l) => l(message, id));
}

/** ToastHost 内部使用 */
export function useToastQueue() {
  const [items, setItems] = useState<Array<{ id: number; msg: string }>>([]);
  useEffect(() => {
    const listener: Listener = (msg, id) => {
      setItems((prev) => [...prev, { id, msg }]);
      window.setTimeout(() => {
        setItems((prev) => prev.filter((i) => i.id !== id));
      }, 1800);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return items;
}
