import React from 'react';
import { useLocale } from '@/os/locale';
import { ADDRESS_EN, COUPON_EN, PRODUCT_EN, STORE_EN } from '../res/data.en';
import { useLuckinStore } from '../state';
import type { Address, Coupon, Product, Store } from '../types';

function localize<T extends { id: string }>(items: T[], translations: Record<string, Partial<T>>, english: boolean): T[] {
  if (!english) return items;
  return items.map((item) => ({ ...item, ...translations[item.id] }));
}

export function useLuckinProducts(source: 'coffee' | 'instant' = 'coffee'): Product[] {
  const items = useLuckinStore((state) => source === 'coffee' ? state.products : state.instantProducts);
  const english = useLocale() === 'en';
  return React.useMemo(() => localize(items, PRODUCT_EN, english), [english, items]);
}

export function useLuckinStores(): Store[] {
  const items = useLuckinStore((state) => state.stores);
  const english = useLocale() === 'en';
  return React.useMemo(() => localize(items, STORE_EN, english), [english, items]);
}

export function useLuckinAddresses(): Address[] {
  const items = useLuckinStore((state) => state.addresses);
  const english = useLocale() === 'en';
  return React.useMemo(() => localize(items, ADDRESS_EN, english), [english, items]);
}

export function useLuckinCoupons(): Coupon[] {
  const items = useLuckinStore((state) => state.coupons);
  const english = useLocale() === 'en';
  return React.useMemo(() => localize(items, COUPON_EN, english), [english, items]);
}
