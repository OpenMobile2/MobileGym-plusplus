/**
 * 评价评论的确定性生成:同一条评价在「评价详情」和「消息·评论/@」里展示一致。
 * 只产出「别人对你评价的评论」(其他用户 + 商家回复),不含你自己发出的回复。
 */
export interface ReviewComment {
  name: string;
  body: string;
  merchant: boolean;
}

const USER_NAMES = ['静珊', '小食光', '吃货本货', '南京土著', '周末探店', '柠檬不酸'];
const GENERIC_COMMENTS = [
  '养生与美味兼得，难得！',
  '改天一定去试试~',
  '请问需要提前预约吗？',
  '人均多少呀，看着不便宜',
  '这家我也去过，确实不错',
];
const PHOTO_COMMENTS = ['拍照太好看了吧', '看着就很香'];
const MERCHANT_REPLIES = [
  '感谢您的支持与鼓励~我们会继续把更好的菜品和服务带给您，期待您的再次光临！',
  '谢谢您的用心评价！您的满意是我们最大的动力，欢迎下次再来~',
  '非常感谢您的光临与反馈，我们会持续改进，期待与您再会！',
];

export function seedOf(reviewId: string): number {
  return Math.abs([...reviewId].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7));
}

export function reviewCommentsFor(opts: {
  reviewId: string;
  hasPhoto: boolean;
  shopShort: string;
  reply?: string;
}): ReviewComment[] {
  const seed = seedOf(opts.reviewId);
  const pool = opts.hasPhoto ? [...GENERIC_COMMENTS, ...PHOTO_COMMENTS] : GENERIC_COMMENTS;
  const explicitReply = opts.reply;
  const merchantReply = explicitReply ?? MERCHANT_REPLIES[seed % MERCHANT_REPLIES.length];
  const comments: ReviewComment[] = [];
  const count = seed % 3; // 0-2 条用户评论
  const used = new Set<number>();
  for (let i = 0; i < count; i += 1) {
    let idx = (seed + i * 7) % pool.length;
    while (used.has(idx)) idx = (idx + 1) % pool.length; // 同一评价内评论不重复
    used.add(idx);
    comments.push({ name: USER_NAMES[(seed + i) % USER_NAMES.length], body: pool[idx], merchant: false });
  }
  // 有确定回复的必展示;否则约 1/3 评价带商家回复
  if (explicitReply || seed % 3 === 0) {
    comments.push({ name: `${opts.shopShort}（商家）`, body: merchantReply, merchant: true });
  }
  return comments;
}
