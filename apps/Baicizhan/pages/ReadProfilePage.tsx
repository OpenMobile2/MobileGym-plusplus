import React from 'react';
import type { ActivityResult } from '@/os/types/manifest';
import { useBaicizhanStore, collectedCount } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';
import { IcMail } from '../res/icons';

const RIGHTS = ['会员书籍', '中文翻译', '知识精讲', '单词巩固', '精听朗读', '拓展讲义'];

export default function ReadProfilePage() {
  const s = useStrings();
  const { action, bindTap } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const toast = () => st.showToast(s.notAvailable);
  // Gate4v5:此前全是写死的 0,阅读器点「加入单词本」后这里不变,看起来像没加成功
  const grid: [string, number][] = [
    ['单词收藏', collectedCount(st)],
    ['阅读笔记', 0],
    ['文章收藏', st.shelf.length],
    ['已读文章', st.readArticleIds.length],
    ['完读书籍', 0],
    ['朗读作品', 0],
  ];
  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#E6F4EF] to-white" data-status-bar-foreground="dark">
      <div className="flex items-center px-4 pt-12">
        <div className="ml-auto"><button {...bindTap('read.profile.unavailable.open', { params: { feature: '阅读消息中心' } })}><IcMail size={20} color="#2C7A6B" /></button></div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl shadow">🐶</div>
          <div><div className="text-lg font-bold text-[#212121]">{st.profile.name}</div><div className="text-xs text-[#9AA5B1]">ID: {st.profile.bczId}</div></div>
        </div>

        <div className="mt-4 rounded-2xl bg-[#E8D6B1] p-4">
          <div className="grid grid-cols-6 gap-1 text-center text-[9px] text-[#8A6A2A]">
            {RIGHTS.map((r) => <button key={r} {...bindTap('read.profile.unavailable.open', { params: { feature: r } })} className="flex flex-col items-center gap-1">🎖️<span>{r}</span></button>)}
          </div>
          <button {...action('read.member.pay.system', () => {
            if (st.memberships.readActive) { st.showToast('阅读会员有效'); return; }
            const launched = window.__OS__?.startActivityForResult?.(
              'alipay',
              {
                action: 'ACTION_PAY',
                scheme: 'alipays',
                data: { amount: 9, orderId: 'bcz-read-member-monthly', merchantName: '百词斩', subject: '薄荷阅读会员连续包月', source: 'baicizhan' },
              },
              (result: ActivityResult) => { if (result.resultCode === 'OK') st.activateReadMembership(); },
            );
            if (!launched) toast();
          })} className="mt-3 w-full rounded-full bg-[#3A2E1A] py-2.5 text-sm font-semibold text-white">{st.memberships.readActive ? '会员已开通' : '立即开通会员'}</button>
        </div>

        <button {...bindTap('read.profile.unavailable.open', { params: { feature: '薄荷集市' } })} className="mt-3 flex w-full items-center rounded-2xl bg-white p-3 text-sm text-[#33405C]">累计 {st.coins} 铜板 <span className="ml-auto text-xs" style={{ color: colors.readTeal }}>薄荷集市 ›</span></button>

        <div className="mt-3 rounded-2xl bg-white p-4">
          <div className="text-sm text-[#9AA5B1]">累计阅读</div>
          <div className="mt-1 text-lg font-bold text-[#212121]">{st.readChars} 字 · 0 小时 0 分钟</div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-3 rounded-2xl bg-white p-4 text-center">
          {grid.map(([l, n]) => <div key={l as string}><div className="text-base font-bold text-[#212121]">{n}{l === '文章收藏' ? '篇' : l === '完读书籍' ? '本' : '个'}</div><div className="text-[10px] text-[#9AA5B1]">{l}</div></div>)}
        </div>
      </div>
    </div>
  );
}
