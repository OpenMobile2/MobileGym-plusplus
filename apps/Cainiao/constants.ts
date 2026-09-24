/**
 * OS 宿主约束 —— 来源:os/data/simulatorConfig.ts
 */
export const OS = {
  STATUS_BAR_H: 40,
  GESTURE_BAR_H: 16,
  VIEWPORT_W: 360,
  VIEWPORT_H: 800,
  TOP_BAR_H: 44,
  TAB_BAR_H: 56,
} as const;

/** 每次修改 defaults.json 结构必须递增(persistName 版本化,变更即重置) */
export const DATA_VERSION = 9;

export const TAB_PATHS = ['/', '/discover', '/coupons', '/messages', '/me'] as const;

/** 上门时间可选时段 */
export const TIME_SLOTS = ['09:00-11:00', '11:00-13:00', '13:00-15:00', '15:00-17:00', '17:00-19:00'] as const;

/** 物品类型九宫格(spec a169) */
export const ITEM_TYPES = ['日用品', '食品', '文件', '衣物', '数码产品', '鞋子', '饰品', '易碎品', '其他'] as const;

/** 物品类型 → 参考重量 kg(r3:选类型弹参考重量气泡) */
export const ITEM_REF_WEIGHT: Record<string, number> = {
  日用品: 1, 食品: 1, 文件: 1, 衣物: 1, 数码产品: 1, 鞋子: 2, 饰品: 1, 易碎品: 2, 其他: 1,
};

/** 交件方式弹层选项(spec s141) */
export const HANDOVER_PLACES = ['当面交件', '放家门口', '放门卫', '放前台', '放物业', '放快递代寄点'] as const;
export const HANDOVER_NOTES = ['需要打电话', '别打电话', '别敲门', '别按门铃'] as const;
export const HANDOVER_EXTRAS = ['带包装袋', '带胶带'] as const;

/** 取消原因(spec frame:r3@124) */
export const CANCEL_REASONS = {
  自己相关: [
    '信息填错了(需修改取件时间/地址等)',
    '想去附近的服务点寄件',
    '计划有变,暂时不需要寄了',
    '我想换个上门取件时间',
    '价格有点贵',
  ],
  快递员相关: [
    '快递员未按时上门/上门慢',
    '快递员不上门',
    '快递员服务不好(不上门/推脱/态度差)',
    '联系不上快递员',
  ],
  其他: ['物品类型无法邮寄', '快递员反馈因运力紧张暂无法揽收', '其他'],
} as const;

/** 禁寄品查询:热门 + 判定字典(spec a181) */
export const PROHIBITED_HOT = ['充电宝', '香烟', '喷雾', '手机', '锂电池', '酒', '宠物', '易碎品'] as const;
export const PROHIBITED_DICT: Record<string, { verdict: 'ok' | 'limited' | 'no'; note: string }> = {
  充电宝: { verdict: 'limited', note: '仅限陆运,需绝缘包装,额定能量≤100Wh' },
  香烟: { verdict: 'limited', note: '个人少量(≤2条)可寄,需实名' },
  喷雾: { verdict: 'no', note: '含压缩气体,禁止邮寄' },
  手机: { verdict: 'limited', note: '含锂电池,仅限陆运,原包装为佳' },
  锂电池: { verdict: 'no', note: '裸装锂电池禁止邮寄' },
  酒: { verdict: 'limited', note: '密封完好≤2瓶,仅限陆运' },
  宠物: { verdict: 'no', note: '活体动物禁止邮寄' },
  易碎品: { verdict: 'limited', note: '可寄,建议加固包装并保价' },
};

/** 地址标签(spec a177:两组不互斥,组内单选) */
export const TAGS_ADDRESS = ['家', '公司', '学校'] as const;
export const TAGS_RELATION = ['亲人', '朋友', '客户'] as const;

/** 全部包裹筛选组(spec a171) */
export const FILTER_GROUPS = {
  packageType: ['收件', '寄件', '停滞件'],
  owner: ['我的', '亲友'],
  logistics: ['待取件', '派送中', '运输中', '待发货', '已签收'],
  trade: ['退款成功', '已确认收货'],
  company: ['中通', '圆通', '申通', '韵达', '百世', '顺丰', '邮政', '德邦'],
} as const;
