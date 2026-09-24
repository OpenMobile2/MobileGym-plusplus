import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFanqieGestures } from '../hooks/useFanqieGestures';
import { useFanqieStrings, TopBar, Avatar, fmtTime } from '../components/ui';
import { useFanqieStore } from '../state';
import * as TimeService from '@/os/TimeService';
import { IcBell, IcUsers, IcMessage, IcArrowRight } from '../res/icons';

/** 消息分类 + 内容(固定演示内容,内联查看) */
const MSG_CATEGORIES = [
  {
    id: 'system', label: '系统通知', Icon: IcBell,
    items: [
      { title: '书荒新里程达成', body: '恭喜你本周阅读时长突破 5 小时,获得「书虫」成就徽章一枚。' },
      { title: '推书大神成长指南', body: '发布 3 条优质书评即可解锁「推书官」身份,快去点评你喜欢的书吧。' },
      { title: '《十日终焉》周边开售', body: '巅峰榜 TOP1《十日终焉》限定周边已上线,书城搜索即可查看。' },
    ],
  },
  {
    id: 'interact', label: '互动消息', Icon: IcMessage,
    items: [
      { title: '你收到了 19 条点赞', body: '「爱吃杂炒腊味的萧天澜」等 19 位书友点赞了你的书评。' },
      { title: '新的评论回复', body: '有书友回复了你在《救眉庄》下的书评:这情侣装配的太搭了。' },
    ],
  },
  {
    id: 'fans', label: '粉丝消息', Icon: IcUsers,
    items: [],
  },
] as const;

export default function MessagesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { bindTap } = useFanqieGestures();
  const s = useFanqieStrings();
  const users = useFanqieStore((st) => st.users);

  const openId = searchParams.get('open');
  const opened = MSG_CATEGORIES.find((c) => c.id === openId);

  // ===== 内联详情:某类消息列表 =====
  if (opened) {
    return (
      <div className="flex flex-col h-full bg-(--app-c-bg-page-alt)">
        <TopBar title={opened.label} />
        <div className="flex-1 overflow-y-auto" data-scroll-container="messages-list" data-scroll-direction="vertical">
          {opened.items.length === 0 ? (
            <div className="text-center text-[13px] text-(--app-c-text-tertiary) py-20">暂无{opened.label}</div>
          ) : (
            <div className="bg-(--app-c-bg-card) mt-2">
              {opened.items.map((m, i) => (
                <div key={m.title} className={`flex items-start px-4 py-3.5 ${i > 0 ? 'border-t border-(--app-c-divider)' : ''}`}>
                  <Avatar src={users[i % users.length]?.avatar} className="w-9 h-9 shrink-0" />
                  <div className="flex-1 min-w-0 ml-3">
                    <div className="flex items-center">
                      <span className="text-[14px] font-medium text-(--app-c-text-primary) flex-1 truncate">{m.title}</span>
                      <span className="text-[11px] text-(--app-c-text-disabled) ml-2 shrink-0">{fmtTime(TimeService.now() - (i + 1) * 3600_000)}</span>
                    </div>
                    <div className="text-[13px] text-(--app-c-text-regular) mt-1 leading-5">{m.body}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== 分类列表 =====
  return (
    <div className="flex flex-col h-full bg-(--app-c-bg-page-alt)">
      <TopBar title={s.messages} />
      <div className="flex-1 overflow-y-auto" data-scroll-container="messages-list" data-scroll-direction="vertical">
        <div className="bg-(--app-c-bg-card) mt-2">
          {MSG_CATEGORIES.map((c, i) => {
            const last = c.items[0];
            return (
              <button
                key={c.id}
                {...bindTap({ kind: 'action', id: 'messages.category.select.target' }, {
                  params: { target: c.id },
                  onTrigger: () => setSearchParams((p) => { p.set('open', c.id); return p; }),
                })}
                className={`w-full flex items-center px-4 py-3.5 bg-transparent border-none cursor-pointer text-left ${i > 0 ? 'border-t border-(--app-c-divider)' : ''}`}
              >
                <div className="w-10 h-10 rounded-full bg-(--app-c-brand-soft) flex items-center justify-center shrink-0">
                  <c.Icon size={20} className="text-(--app-c-brand)" />
                </div>
                <div className="flex-1 min-w-0 ml-3">
                  <div className="text-[14px] text-(--app-c-text-primary)">{c.label}</div>
                  <div className="text-[12px] text-(--app-c-text-tertiary) mt-0.5 truncate">
                    {last ? last.title : `暂无${c.label}`}
                  </div>
                </div>
                <IcArrowRight size={16} className="text-(--app-c-text-disabled) shrink-0" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
