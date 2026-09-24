import { useAppStrings } from '@/os/useAppStrings';
import { strings, type CainiaoStringKey } from '../res/strings';
import { stringsEn } from '../res/strings.en';

/** 旧 dotted-key → camelCase(兼容存量 t('tab.home') 调用) */
const DOT_MAP: Record<string, CainiaoStringKey> = {
  'tab.home': 'tabHome',
  'tab.discover': 'tabDiscover',
  'tab.coupons': 'tabCoupons',
  'tab.messages': 'tabMessages',
  'tab.me': 'tabMe',
  'home.searchPlaceholder': 'homeSearchPlaceholder',
  'home.search': 'homeSearch',
  'home.pickup': 'homePickup',
  'home.send': 'homeSend',
  'home.swap': 'homeSwap',
  'home.idcode': 'homeIdcode',
  'home.shouqu': 'homeShouqu',
  'home.jitui': 'homeJitui',
  'home.allPackages': 'homeAllPackages',
  'home.confirmTaken': 'homeConfirmTaken',
  'home.delegate': 'homeDelegate',
  'home.arrived': 'homeArrived',
  'home.toSend': 'homeToSend',
  'common.back': 'commonBack',
  'common.confirm': 'commonConfirm',
  'common.cancel': 'commonCancel',
  'common.save': 'commonSave',
  'common.delete': 'commonDelete',
  'common.copy': 'commonCopy',
  'common.copied': 'commonCopied',
  'common.notOpen': 'commonNotOpen',
  'common.empty': 'commonEmpty',
  'common.noMore': 'commonNoMore',
  'ship.title': 'shipTitle',
  'ship.submit': 'shipSubmit',
  'ship.confirmModify': 'shipConfirmModify',
  'ship.addressbook': 'shipAddressbook',
  'ship.newAddress': 'shipNewAddress',
  'ship.estimate': 'shipEstimate',
  'ship.fillFirst': 'shipFillFirst',
  'ship.methodPickup': 'shipMethodPickup',
  'ship.methodLocker': 'shipMethodLocker',
  'ship.methodStation': 'shipMethodStation',
  'ship.cancelOrder': 'shipCancelOrder',
  'ship.pay': 'shipPay',
  'ship.service': 'shipService',
  'ship.modify': 'shipModify',
  'ship.handover': 'shipHandover',
  'orders.pending': 'ordersPending',
  'orders.shipped': 'ordersShipped',
  'orders.cancelled': 'ordersCancelled',
  'orders.empty': 'ordersEmpty',
  'messages.title': 'messagesTitle',
  'messages.readAll': 'messagesReadAll',
  'messages.emptyChannel': 'messagesEmptyChannel',
  'me.benefits': 'meBenefits',
  'me.settings': 'meSettings',
  'me.logout': 'meLogout',
  'pickup.taken': 'pickupTaken',
  'pickup.title': 'pickupTitle',
  'coupons.claim': 'couponsClaim',
  'coupons.buy': 'couponsBuy',
  'discover.placeholder': 'discoverPlaceholder',
};

/** 跟随 OS 语言;底层走 useAppStrings(strings / strings.en) */
export function useI18n() {
  const s = useAppStrings(strings, stringsEn);
  const t = (key: string): string => {
    const mapped = DOT_MAP[key] ?? (key as CainiaoStringKey);
    return (s as Record<string, string>)[mapped] ?? key;
  };
  return { t, s };
}
