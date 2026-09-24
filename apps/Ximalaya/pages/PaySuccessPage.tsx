import React, { useEffect } from 'react';
import * as TimeService from '@/os/TimeService';
import { useXimalayaGestures } from '../hooks/useXimalayaGestures';
import { useXimalayaStrings } from '../hooks/useXimalayaStrings';
import { useXimalayaStore } from '../state';
import { IcCheck } from '../res/icons';

function fmtDate(ts: number): string {
  const d = TimeService.fromTimestamp(ts);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}.${m}.${day}`;
}

export function PaySuccessPage() {
  const { bindBack } = useXimalayaGestures();
  const s = useXimalayaStrings();
  const openVip = useXimalayaStore((st) => st.openVip);
  const vipExpireAt = useXimalayaStore((st) => st.user.vipExpireAt);
  const isVip = useXimalayaStore((st) => st.user.isVip);

  // 进入即模拟开通成功
  useEffect(() => {
    if (!isVip) openVip();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-full flex flex-col pt-10 bg-white items-center" data-status-bar-foreground="dark">
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#F5D9A0] to-[#E7B85C] flex items-center justify-center text-white">
          <IcCheck size={44} />
        </div>
        <div className="text-[20px] font-semibold text-[#333] mt-5">{s.member_pay_success}</div>
        <div className="text-[14px] text-[#999] mt-2">VIP 会员权益已生效</div>
        <div className="mt-6 w-full rounded-xl bg-[#FAF7F0] py-4">
          <div className="text-[12px] text-[#999]">会员到期时间</div>
          <div className="text-[16px] font-medium text-[#C4302B] mt-1">{fmtDate(vipExpireAt)}</div>
        </div>
      </div>
      <div className="shrink-0 w-full px-6 pb-8">
        <button {...bindBack()} className="w-full h-11 rounded-full bg-[#FE4543] text-white text-[15px] font-semibold">
          知道了
        </button>
      </div>
    </div>
  );
}
