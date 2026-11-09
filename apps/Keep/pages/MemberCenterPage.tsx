import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useKeepGestures } from '../hooks/useKeepGestures';
import { useKeepStrings } from '../hooks/useKeepStrings';
import { useKeepStore } from '../state';
import { C } from '../components/ui';
import { Img } from '../res/images';
import { IcClose, IcGift, IcArrowRight, IcCheck } from '../res/icons';
import { payWithSystem } from '../capabilities';

const BENEFITS: { key: string; label: string; desc: string }[] = [
  { key: 'plan', label: '定制计划', desc: '个性定制日程 快速达成目标' },
  { key: 'voice', label: '语音指导', desc: '实时语音督练 像教练在身边' },
  { key: 'photo', label: '拍照记录', desc: '拍照记录身材变化 见证蜕变' },
  { key: 'data', label: '数据分析', desc: '多维数据分析 训练更科学' },
];

/** 会员购买页（支付成功后开通，不做学生认证）—— 节点 member.center(证据 s023/s098) */
export default function MemberCenterPage() {
  const { bindTap, bindBack } = useKeepGestures();
  const s = useKeepStrings();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useKeepStore((st) => st.toast);
  const user = useKeepStore((st) => st.user);
  const member = useKeepStore((st) => st.member);
  const purchaseMember = useKeepStore((st) => st.purchaseMember);

  const skuId = searchParams.get('sku') ?? member.plans[0]?.id ?? '';
  const sku = member.plans.find((p) => p.id === skuId) ?? member.plans[0];
  const agreed = searchParams.get('agree') === '1';
  const benefitKey = searchParams.get('benefit') ?? 'plan';
  const benefit = BENEFITS.find((b) => b.key === benefitKey) ?? BENEFITS[0];

  const wontfix = (id: string) =>
    bindTap({ kind: 'action', id }, { onTrigger: () => toast(s.notOpen) });

  const payForMembership = () => {
    const launched = payWithSystem(
      {
        amount: sku.price,
        orderId: `keep-member-${sku.id}`,
        subject: sku.label,
        method: '支付宝支付',
      },
      (result) => { if (result.resultCode === 'OK') purchaseMember(sku.id); },
    );
    if (!launched) toast(s.notOpen);
  };

  return (
    <div className="flex flex-col h-full" style={{ background: '#26202E' }} data-status-bar-foreground="light">
      {/* 顶部:关闭X + tabs */}
      <div className="flex items-center px-3 h-12 shrink-0 gap-6">
        <button {...bindBack()} className="p-1 bg-transparent border-none text-white" aria-label="关闭">
          <IcClose size={22} />
        </button>
        <span className="text-[16px] font-bold text-white border-b-2 border-white pb-1">会员</span>
        <button {...wontfix('member.center.livecard.wontfix')} className="bg-transparent border-none text-[15px] text-white/60 p-0">
          直播畅练卡
        </button>
        <button {...wontfix('member.center.moretab.wontfix')} className="bg-transparent border-none text-[15px] text-white/60 p-0">
          更多
        </button>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 用户卡 */}
        <div className="mx-4 mt-2 rounded-2xl px-4 py-4" style={{ background: 'rgba(255,255,255,.06)' }}>
          <div className="flex items-center gap-3">
            <Img id={user.avatar} className="w-12 h-12 rounded-full object-cover shrink-0" alt={user.nickname} />
            <div className="min-w-0">
              <div className="text-[16px] font-semibold text-white">{user.nickname}</div>
              <div className="text-[12px] mt-0.5" style={{ color: C.gold }}>
                {member.active ? `会员有效期至 ${member.expireDate}` : '会员已过期,成为会员立享超多特权'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-3 text-[12px] text-white/60">
            <button {...wontfix('member.center.help.wontfix')} className="bg-transparent border-none text-white/60 p-0 text-[12px]">
              帮助中心
            </button>
            <span className="text-white/25">|</span>
            <button {...wontfix('member.center.redeem.wontfix')} className="bg-transparent border-none text-white/60 p-0 text-[12px]">
              兑换码充值
            </button>
          </div>
        </div>

        {/* 会员专属赠礼横条 */}
        <button
          {...wontfix('member.center.gift.wontfix')}
          className="flex items-center gap-2 mx-4 mt-3 px-4 py-3 rounded-xl border-none text-left w-[calc(100%-32px)]"
          style={{ background: 'rgba(255,255,255,.06)' }}
        >
          <IcGift size={18} style={{ color: C.gold }} />
          <span className="flex-1 text-[13px] text-white">查看你的会员专属赠礼</span>
          <IcArrowRight size={16} className="text-white/50" />
        </button>

        {/* 权益标题 + 胶囊 */}
        <div className="px-4 mt-6">
          <div className="text-[24px] font-bold leading-snug">
            <span style={{ color: C.gold }}>会员 </span>
            <span className="text-white">尊享专属权益</span>
          </div>
          <div className="text-[24px] font-bold text-white">专业指导,科学训练</div>
          <div className="flex gap-2 mt-4 overflow-x-auto" data-scroll-container="benefits" data-scroll-direction="horizontal">
            {BENEFITS.map((b) => {
              const sel = b.key === benefit.key;
              return (
                <button
                  key={b.key}
                  {...bindTap(
                    { kind: 'action', id: 'member.center.benefit.switch' },
                    {
                      params: { benefit: b.key },
                      onTrigger: () =>
                        setSearchParams((p) => { p.set('benefit', b.key); return p; }, { replace: true }),
                    },
                  )}
                  className="shrink-0 px-3.5 py-1.5 rounded-full border-none text-[13px]"
                  style={{
                    background: sel ? '#FFFFFF' : 'rgba(255,255,255,.1)',
                    color: sel ? '#26202E' : 'rgba(255,255,255,.7)',
                    fontWeight: sel ? 600 : 400,
                  }}
                >
                  {b.label}
                </button>
              );
            })}
          </div>
          {/* 权益轮播大图 */}
          <div
            className="mt-3 rounded-2xl px-5 pt-5 pb-6 overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #4A3A6B 0%, #8A4CC9 60%, #B65CD8 100%)' }}
          >
            <div className="text-[18px] font-bold text-white">{benefit.desc}</div>
            <div className="mt-4 rounded-xl bg-black/30 px-3 py-3">
              <div className="flex items-center gap-1.5 text-[12px] text-white">
                <span className="w-4 h-4 rounded-full inline-block" style={{ background: 'conic-gradient(#7A5AF8, #3C7CFC, #7A5AF8)' }} />
                卡卡教练
              </div>
              <div className="text-[11px] text-white/70 mt-1.5 leading-relaxed">
                近期你的训练单一,燃脂效率下降,为你编排了更高效的方案。
              </div>
            </div>
          </div>
        </div>

        {/* 选档卡(白色底) */}
        <div className="mt-5 rounded-t-2xl bg-app-surface px-4 pt-3 pb-3">
          <div className="mx-auto w-9 h-1 rounded-full bg-gray-200" />
          <div
            className="flex gap-2.5 mt-3 overflow-x-auto"
            data-scroll-container="skus"
            data-scroll-direction="horizontal"
          >
            {member.plans.map((p) => {
              const sel = p.id === sku.id;
              return (
                <button
                  key={p.id}
                  {...bindTap(
                    { kind: 'action', id: 'member.center.sku.select' },
                    {
                      params: { sku: p.id },
                      onTrigger: () =>
                        setSearchParams((q) => { q.set('sku', p.id); return q; }, { replace: true }),
                    },
                  )}
                  className="relative shrink-0 w-28 rounded-xl pt-5 pb-4 flex flex-col items-center"
                  style={{
                    background: sel ? '#FDF8EE' : '#F7F8FA',
                    border: sel ? `1.5px solid ${C.gold}` : '1.5px solid transparent',
                  }}
                >
                  {p.id === member.plans[0].id && (
                    <span
                      className="absolute -top-2 left-0 px-1.5 py-0.5 rounded-tl-lg rounded-br-lg text-[10px] text-white"
                      style={{ background: 'linear-gradient(90deg,#C465D8,#F8586C)' }}
                    >
                      特惠 2 折起
                    </span>
                  )}
                  <span className="text-[14px] text-app-text">{p.label}</span>
                  <span className="text-[26px] font-bold text-app-text mt-1 leading-none">¥{p.price}</span>
                  {p.origPrice > p.price && (
                    <span className="text-[11px] text-app-text-muted line-through mt-1">¥{p.origPrice}</span>
                  )}
                </button>
              );
            })}
          </div>
          {sku.note && <div className="text-[11px] text-app-text-muted mt-3">{sku.note}</div>}
          <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg" style={{ background: '#F3EFFB' }}>
            <span className="px-1.5 py-0.5 rounded text-[10px] text-white" style={{ background: 'linear-gradient(90deg,#C465D8,#F8586C)' }}>
              青春特惠
            </span>
            <span className="text-[12px] text-app-text">认证成功,已享特惠</span>
          </div>

          {/* 开通按钮:未勾选拦截 / 已勾选拉起系统支付 / 已开通态 */}
          {member.active ? (
            <div
              className="w-full mt-4 py-3 rounded-full text-center text-[16px] font-semibold"
              style={{ background: '#F2ECD9', color: '#9A7B41' }}
            >
              已开通 · 有效期至 {member.expireDate}
            </div>
          ) : (
            <button
              {...(agreed
                ? bindTap(
                    { kind: 'action', id: 'member.center.purchase.pay' },
                    { params: { sku: sku.id }, onTrigger: payForMembership },
                  )
                : bindTap(
                    { kind: 'action', id: 'member.center.purchase.blocked' },
                    { onTrigger: () => toast('请先阅读并同意协议') },
                  ))}
              className="w-full mt-4 py-3 rounded-full border-none text-[16px] font-semibold text-white"
              style={{ background: 'linear-gradient(90deg, #E4C088, #C9A05E)' }}
            >
              确认协议并以 {sku.price} 元开通
            </button>
          )}

          {/* 协议勾选 */}
          <div className="flex items-center justify-center gap-1.5 mt-3 pb-2">
            <button
              {...bindTap(
                { kind: 'action', id: 'member.center.agreement.toggle' },
                {
                  params: { agreed: !agreed },
                  onTrigger: () =>
                    setSearchParams((p) => { p.set('agree', agreed ? '0' : '1'); return p; }, { replace: true }),
                },
              )}
              className="bg-transparent border-none p-0 flex items-center"
              role="checkbox"
              aria-checked={agreed}
            >
              <span
                className="w-4.5 h-4.5 rounded-full flex items-center justify-center"
                style={{
                  width: 18, height: 18,
                  background: agreed ? C.green : 'transparent',
                  border: agreed ? 'none' : '1.5px solid #C6C9D0',
                }}
              >
                {agreed && <IcCheck size={12} className="text-white" />}
              </span>
            </button>
            <span className="text-[11px] text-app-text-muted">我已阅读并同意</span>
            <button
              {...wontfix('member.center.agreementlink.wontfix')}
              className="bg-transparent border-none p-0 text-[11px]"
              style={{ color: C.greenDeep }}
            >
              会员服务协议
            </button>
            <span className="text-[11px] text-app-text-muted">和</span>
            <button
              {...wontfix('member.center.agreementlink.wontfix')}
              className="bg-transparent border-none p-0 text-[11px]"
              style={{ color: C.greenDeep }}
            >
              自动续费服务声明
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
