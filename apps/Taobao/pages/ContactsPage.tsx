import React from 'react';
import { TopBar, EmptyState } from '../components/ui';
import { IcUsers, IcComment } from '../res/icons';

/** 通讯录(spec: message.contacts,IMG_8715,P2 展示页) */
export default function ContactsPage() {
  return (
    <div className="flex flex-col h-full bg-[#F8F8F8]">
      <TopBar title="通讯录" rightContent={<IcUsers size={18} className="text-[#333333]" />} />
      <div className="flex-1 overflow-y-auto px-3">
        <div className="flex gap-2 mt-2">
          <div className="flex-1 bg-white rounded-xl py-3 flex items-center justify-center gap-1.5 text-[14px]">
            <IcUsers size={17} />亲情号
          </div>
          <div className="flex-1 bg-white rounded-xl py-3 flex items-center justify-center gap-1.5 text-[14px]">
            <IcComment size={17} />我的群聊
          </div>
        </div>
        <div className="flex justify-between items-center mt-4 px-1">
          <span className="text-[15px] font-semibold">新的好友</span>
          <span className="text-[12px] text-[#999999]">全部 1 ›</span>
        </div>
        <div className="bg-[#F0F0F0] rounded-lg px-3 py-2.5 mt-2 text-[12px] text-[#666666]">
          🛡️ 请放心,成为淘友<span className="text-[#FF5000]">不会泄露</span>您的隐私信息(包括您未公开的购物记录、买家秀等) ✕
        </div>
        <div className="flex justify-between items-center mt-4 px-1">
          <span className="text-[15px] font-semibold">我的好友</span>
          <span className="text-[#999999]">›</span>
        </div>
        <EmptyState text="您还没有好友" hint="去添加好友,分享沟通更方便哦" />
        <div className="flex justify-center">
          <button className="text-[14px] rounded-full border border-[#DDDDDD] bg-white px-6 py-2 cursor-pointer">去添加</button>
        </div>
      </div>
    </div>
  );
}
