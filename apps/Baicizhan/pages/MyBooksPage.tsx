import React from 'react';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { colors } from '../res/colors';
import { PageHeader } from '../components/common';

export default function MyBooksPage() {
  const { bindTap } = useBaicizhanGestures();
  return (
    <div className="flex h-full flex-col bg-white" data-status-bar-foreground="dark">
      <PageHeader title="我的图书" />
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-8" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="flex h-24 w-20 items-center justify-center rounded-lg bg-[#F0F4FA] text-3xl text-[#B0C0D8]">无</div>
        <div className="mt-4 text-sm text-[#9AA5B1]">暂无图书配套资料</div>
        <div className="mt-1 text-xs text-[#C9CDD3]">使用百词斩扫描实体书二维码添加资料</div>
        <button {...bindTap('books.explore')} className="mt-5 rounded-full bg-[#EAF0FF] px-6 py-2 text-sm" style={{ color: colors.primary }}>去商城看看</button>
      </div>
    </div>
  );
}
