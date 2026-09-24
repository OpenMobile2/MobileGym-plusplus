import React, { useEffect } from 'react';
import { useAppStrings } from '@/os/useAppStrings';
import { useDianpingGestures } from '../hooks/useDianpingGestures';
import { useDianpingStore } from '../state';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcBack } from '../res/icons';

const ITEMS = [
  {
    id: 'a1',
    time: '7月30日 01:57',
    title: '你有一份待确认的世界杯礼包未领取！',
    body: '系统检测到你的账户有世界杯盲盒礼包资格尚未完成确认，联名款labubu、1888元红包、精酿券等名额仍在保留中，点击领取资格>>',
  },
  {
    id: 'a2',
    time: '7月26日 09:12',
    title: '领取中断！您有一份暑期狂欢礼包待确认>>',
    body: '你的抽奖资格尚未完成确认，百万冰饮券、大疆Pocket4、大额现金红包、Labubu等重磅好礼就绪，点击确认身份>>',
  },
];

export default function MsgActivityPage() {
  const s = useAppStrings(strings, stringsEn);
  const { bindBack, action } = useDianpingGestures();
  const showToast = useDianpingStore((st) => st.showToast);
  const markMsgRead = useDianpingStore((st) => st.markMsgRead);

  useEffect(() => {
    markMsgRead('activity');
  }, [markMsgRead]);

  return (
    <div className="flex h-full flex-col bg-[#F5F5F5]" data-status-bar-foreground="dark">
      <div className="relative flex h-11 items-center justify-center bg-white px-1">
        <button type="button" className="absolute left-1 cursor-pointer border-none bg-transparent p-1.5" {...bindBack()}>
          <IcBack size={22} />
        </button>
        <div className="text-[16px] font-semibold">{s.msgActivity}</div>
      </div>
      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="msg-activity"
        data-scroll-direction="vertical"
      >
        {ITEMS.map((it) => (
          <div key={it.id} className="mx-3 mt-2 rounded-[12px] bg-white px-3 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-b from-[#FF8A4C] to-[#FF5A2A] text-[11px] text-white">
                点
              </span>
              <span className="text-[13px] font-medium text-[#333]">点小二</span>
              <span className="ml-auto text-[11px] text-[#BBB]">{it.time}</span>
            </div>
            <div className="mt-2 text-[15px] font-bold leading-snug text-[#222]">{it.title}</div>
            <div className="mt-1.5 text-[13px] leading-6 text-[#666]">{it.body}</div>
            <button
              type="button"
              className="mt-2 w-full border-none border-t border-[#F5F5F5] bg-transparent pt-2.5 text-center text-[14px] text-[#3A6EA5] cursor-pointer"
              {...action('activity.detail.open.disabled', () => showToast(s.notOpen))}
            >
              查看详情
            </button>
          </div>
        ))}
        <div className="py-4 text-center text-[12px] text-[#BBB]">没有更多了</div>
      </div>
    </div>
  );
}
