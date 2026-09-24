import type { DidiState } from './types';

/**
 * 持久化白名单：业务态可跨重进保留；敏感草稿/PII 不落盘。
 * - 保留：user / addresses / orders / coupons / 消息与司机会话 / 上车点与地图锚点 / 列表 UI / settings
 * - 剥离：emergencyContacts、发票草稿、评价草稿、搜索草稿、进行中 trip、当前会话指针
 */
export function partializeDidiState<T extends DidiState>(state: T): Partial<DidiState> {
  return {
    user: state.user,
    addresses: state.addresses,
    orders: state.orders,
    coupons: state.coupons,
    invoiceApplications: state.invoiceApplications,
    taskAudit: state.taskAudit,
    messageThreads: state.messageThreads,
    driverChats: state.driverChats,
    payChannels: state.payChannels,
    pickupPoint: state.pickupPoint,
    mapAnchorId: state.mapAnchorId,
    selectedMapPlaceId: state.selectedMapPlaceId,
    selectedPickupId: state.selectedPickupId,
    tripsSection: state.tripsSection,
    tripsTab: state.tripsTab,
    tripsFilterTypes: state.tripsFilterTypes,
    msgTab: state.msgTab,
    couponsClaimed: state.couponsClaimed,
    settings: {
      ...state.settings,
      emergencyContacts: [],
    },
  };
}

/** Remove older schemas that may have persisted private fields. */
export function removeLegacyDidiStorage(currentVersion: number): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem('didi');
  for (let version = 1; version < currentVersion; version += 1) {
    localStorage.removeItem(`didi_v${version}`);
  }
}
