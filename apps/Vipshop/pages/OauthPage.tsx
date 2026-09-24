import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useVipshopStore } from '../state';
import { useVipshopGestures } from '../hooks/useVipshopGestures';
import { VIP } from '../components/ui';

export default function OauthPage() {
  const { bindTap, bindBack } = useVipshopGestures();
  const [searchParams] = useSearchParams();
  const provider = searchParams.get('provider') === 'qq' ? 'QQ' : '微信';
  const login = useVipshopStore((s) => s.login);

  return (
    <div className="flex flex-col h-full bg-white" data-status-bar-foreground="dark">
      <div className="h-11 shrink-0 flex items-center px-3">
        <button {...bindBack()} className="bg-transparent border-none cursor-pointer text-[14px] text-[#222222]">取消</button>
        <span className="flex-1 text-center text-[15px] font-semibold text-[#222222]">{provider}授权</span>
        <span className="w-8" />
      </div>

      <div className="flex flex-col items-center px-8 mt-16">
        <span className="w-16 h-16 rounded-2xl flex items-center justify-center text-[32px]" style={{ background: '#FDECF5' }}>
          {provider === 'QQ' ? '🐧' : '💬'}
        </span>
        <div className="text-[16px] font-semibold text-[#222222] mt-4">唯品会 申请获取以下权限</div>
        <div className="w-full bg-[#F8F8F8] rounded-xl p-4 mt-5 text-[13px] text-[#666666] leading-relaxed">
          <div>· 获得你的公开信息(昵称、头像等)</div>
          <div className="mt-1">· 用于快速登录唯品会账号</div>
        </div>
        <button
          {...bindTap('oauth.confirm-open', { beforeTrigger: () => login('') })}
          className="w-full h-12 rounded-full mt-8 text-[16px] font-semibold border-none cursor-pointer text-white"
          style={{ background: VIP.primary }}
        >
          确认登录
        </button>
        <button {...bindBack()} className="w-full h-11 mt-2 text-[14px] text-[#888888] bg-transparent border-none cursor-pointer">
          取消
        </button>
      </div>
    </div>
  );
}
