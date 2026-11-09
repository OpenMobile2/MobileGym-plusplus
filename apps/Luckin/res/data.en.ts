import type { Address, Coupon, Product, Store } from '../types';

export const PRODUCT_EN: Record<string, Pick<Product, 'name' | 'subtitle' | 'badge'>> = {
  'orange-c': { name: 'Fresh Orange C Americano', subtitle: 'Fresh-cut orange · crisp coffee aroma', badge: 'Upgraded' },
  'coconut-latte': { name: 'Coconut Latte', subtitle: 'Light coconut aroma · signature favorite', badge: 'Popular' },
  'velvet-c': { name: 'Colorful C Americano', subtitle: 'Three fresh fruits · bright and refreshing', badge: 'New' },
  'grape-latte': { name: 'Grape Velvet Latte', subtitle: 'Seasonal grape · silky milk foam', badge: 'Seasonal' },
  'cloud-latte': { name: 'Cloud Cream Latte', subtitle: 'Rich milk · smooth coffee finish', badge: 'Classic' },
  'lemon-tea': { name: 'Lime Iced Tea', subtitle: 'Fresh-brewed tea · bright lime aroma', badge: 'Deal' },
  'instant-01': { name: 'Classic Coffee Concentrate · 32 Cups', subtitle: 'Zero sugar, zero fat · hot or iced', badge: 'New' },
  'instant-02': { name: 'Dark Roast Freeze-Dried Coffee · 12', subtitle: 'Aroma locked in · ready in seconds', badge: 'Bestseller' },
  'instant-03': { name: 'Mountain Drip Coffee · 10 Bags', subtitle: 'Specialty blend · nutty finish', badge: 'Launch' },
  'instant-04': { name: 'Light Coconut Coffee Drink', subtitle: 'Six bottles · refreshing coconut', badge: 'Popular' },
  'instant-05': { name: 'Sunrise Blend Coffee Beans · 500 g', subtitle: 'Medium-dark roast · chocolate finish', badge: 'Recommended' },
};

export const STORE_EN: Record<string, Pick<Store, 'name' | 'address'>> = {
  s01: { name: 'Galaxy Plaza Store', address: '1F, 88 New Town Rd, Hailan' },
  s02: { name: 'Cloud Sail Center Store', address: '16 Cloud Sail Ave, Hailan' },
  s03: { name: 'Innovation Park Store', address: 'Tower A, 9 Innovation Rd, Hailan' },
  s04: { name: 'Lakeside Place Store', address: '101 Lakeside St, Hailan' },
  s05: { name: 'South Bank Store', address: '26 South Bank Rd, Hailan' },
};

export const ADDRESS_EN: Record<string, Pick<Address, 'name' | 'region' | 'detail' | 'tag'>> = {
  a01: { name: 'Lin Xiao', region: 'Hailan · New Town', detail: 'Room 1202, Building 1, 88 Galaxy St', tag: 'Home' },
  a02: { name: 'Lin Xiao', region: 'Hailan · High-Tech', detail: '8F, Tower A, Innovation Park', tag: 'Work' },
  a03: { name: 'Zhou Ning', region: 'Hailan · Lakeside', detail: 'Building 3, East Gate, Lakeside University', tag: 'School' },
  a04: { name: 'Xu An', region: 'Hailan · South Bank', detail: 'Room 506, Building 2, 18 South Bank', tag: 'Home' },
  a05: { name: 'Chen Mo', region: 'Hailan · New Town', detail: 'Reception, Tower B, Cloud Sail Center', tag: 'Work' },
};

export const COUPON_EN: Record<string, Pick<Coupon, 'title' | 'threshold' | 'expiry'>> = {
  c01: { title: '¥9.9 Drink Coupon', threshold: 'Valid on selected drinks', expiry: 'Expires in 7 days' },
  c02: { title: '¥8 Off ¥20', threshold: 'Spend ¥20 or more', expiry: 'Expires in 3 days' },
  c03: { title: '¥10 Instant Newcomer Coupon', threshold: 'Spend ¥49 on Instant', expiry: 'Expires in 15 days' },
  c04: { title: 'Coffee Card · 5 Uses', threshold: 'One use per day', expiry: 'Expires in 30 days' },
  c05: { title: 'Monday Energy ¥6 Coupon', threshold: 'Spend ¥15 on drinks', expiry: 'Expires today' },
};
