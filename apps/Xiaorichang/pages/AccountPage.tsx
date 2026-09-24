import React from 'react';
import * as TimeService from '../../../os/TimeService';
import { useXiaorichangStore } from '../state';
import { useXiaorichangGestures } from '../hooks/useXiaorichangGestures';
import { useStrings } from '../hooks/useStrings';
import { avatarOf } from '../assets';
import { PageHeader } from '../components/common';
import { IcRight, IcReset } from '../res/icons';
import { pickImages } from '@/os/albumBridge';
import { AsyncFsImage } from '@/os/components/AsyncFsImage';

/** 账号(s228/s229 补拍)。会员/订阅走系统收银台；微信绑定仍需账号后端。 */
export default function AccountPage() {
  const st = useXiaorichangStore();
  const { bindTap, action } = useXiaorichangGestures();
  const s = useStrings();
  const notice = () => st.showNotice(s.notAvailable);
  const purchase = (subject: string, amount: number) => {
    const launched = window.__OS__?.startActivityForResult?.(
      {
        action: 'ACTION_PAY',
        scheme: 'alipays',
        data: {
          amount,
          orderId: `xiaorichang-subscription-${TimeService.now()}`,
          merchantName: s.paymentMerchant,
          subject,
          source: 'xiaorichang',
        },
      },
      (result) => {
        if (result.resultCode !== 'OK') return;
        st.updateUser({ vip: true });
        st.showToast(s.paymentSuccess);
      },
    );
    if (!launched) st.showNotice(s.notAvailable);
  };

  return (
    <div className="flex h-full flex-col bg-[#F8F8F8]" data-status-bar-foreground="dark">
      <PageHeader title={s.account}
        right={<button {...action('account.refresh.wontfixToast', notice)} aria-label="刷新"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm"><IcReset size={16} /></button>} />
      <div className="px-4">
        <div className="overflow-hidden rounded-2xl bg-white">
          <div className="flex items-center justify-between border-b border-[#F5F5F5] px-4 py-3.5">
            <span className="text-sm text-[#424242]">头像</span>
            <button {...action('account.avatar.edit', () => {
              void pickImages({ multiple: false, maxSelect: 1 }).then((result) => {
                if (result.cancelled || !result.selected.length) return;
                const selected = result.selected[0];
                st.updateUser({ avatar: selected.path || selected.uri });
              });
            })}>
              {st.user.avatar.startsWith('/') ? (
                <AsyncFsImage path={st.user.avatar} fallbackSrc={avatarOf('user')}
                  alt="头像" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <img src={avatarOf(st.user.avatar)} alt="头像" className="h-10 w-10 rounded-full object-cover" />
              )}
            </button>
          </div>
          <div className="flex items-center justify-between border-b border-[#F5F5F5] px-4 py-3.5">
            <span className="text-sm text-[#424242]">昵称</span>
            <input
              {...action('account.nickname.input', () => {}, { params: { value: st.user.nickname } })}
              value={st.user.nickname} onChange={(e) => st.updateUser({ nickname: e.target.value })}
              className="w-32 bg-transparent text-right text-sm text-[#9AA5B1] outline-none" />
          </div>
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="text-sm text-[#424242]">个人介绍</span>
            <input
              {...action('account.bio.input', () => {}, { params: { value: st.user.bio ?? '' } })}
              value={st.user.bio ?? ''} onChange={(e) => st.updateUser({ bio: e.target.value })}
              placeholder="+ 添加个人介绍"
              className="w-40 bg-transparent text-right text-sm text-[#9AA5B1] outline-none" />
          </div>
        </div>

        <div className="mt-3 overflow-hidden rounded-2xl bg-white">
          <button {...action('account.wechat.wontfixToast', notice)}
            className="flex w-full items-center justify-between border-b border-[#F5F5F5] px-4 py-3.5 text-sm text-[#424242]">
            绑定微信 <IcRight size={15} className="text-[#C9CDD3]" />
          </button>
          <button {...action('account.membership.pay', () => purchase(s.paymentPremiumSubject, 18))}
            className="flex w-full items-center justify-between border-b border-[#F5F5F5] px-4 py-3.5 text-sm text-[#424242]">
            类型:一年期会员 <IcRight size={15} className="text-[#C9CDD3]" />
          </button>
          <button {...bindTap('account.data.open')}
            className="flex w-full items-center justify-between border-b border-[#F5F5F5] px-4 py-3.5 text-sm text-[#424242]">
            备份 / 恢复数据 <IcRight size={15} className="text-[#C9CDD3]" />
          </button>
          <button {...action('account.subscription.pay', () => purchase(s.paymentSubscriptionSubject, 6))}
            className="flex w-full items-center justify-between px-4 py-3.5 text-sm text-[#424242]">
            付费订阅 <IcRight size={15} className="text-[#C9CDD3]" />
          </button>
        </div>
      </div>
    </div>
  );
}
