/**
 * 发帖页(spec post.publish):正文 + 话题推荐chips + 工具栏(图片/#话题/表情/投票/AI/···)。
 * ?circle= 指定发到哪个圈(默认 love);相册/话题面板走 ?panel=(URL驱动,返回键可关)。
 * 证据 anchor 112。
 */
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { useMeiyouStore } from '../state';
import { useMeiyouGestures } from '../hooks/useMeiyouGestures';
import { MY, NOT_OPEN, Img, useToast, usePanel } from '../components/ui';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcHelp, IcImage, IcTopic, IcEmoji, IcPoll, IcAI, IcMoreH, IcClose } from '../res/icons';
import { pickImages } from '@/os/albumBridge';

/** 空文案时的通用推荐话题 / 有文案后换一组(mock 简化联动) */
const TOPICS_EMPTY = ['#今天穿了什么', '#婚后真实生活记录', '#今天我最美'] as const;
const TOPICS_TYPING = ['#姐妹来帮忙', '#情感树洞', '#记录我的小日子'] as const;
/** #话题面板全量列表 */
const TOPIC_PANEL_LIST = [...TOPICS_EMPTY, ...TOPICS_TYPING, '#我的备孕日常', '#妇科健康'] as const;

export default function PublishPage() {
  const { bindTap, bindBack, back } = useMeiyouGestures();
  const s = useAppStrings(strings, stringsEn);
  const [toast, showToast] = useToast();
  const { value: panel, open: openPanel } = usePanel('panel');
  const [searchParams] = useSearchParams();
  const circleId = searchParams.get('circle') ?? 'love';
  const publishPost = useMeiyouStore((st) => st.publishPost);

  const [text, setText] = React.useState('');
  const [topics, setTopics] = React.useState<string[]>([]);
  const [images, setImages] = React.useState<string[]>([]);

  const canPublish = text.trim().length > 0 || topics.length > 0;
  const suggestions = (text.trim() ? TOPICS_TYPING : TOPICS_EMPTY).filter((t) => !topics.includes(t));

  const insertTopic = (t: string) => {
    setTopics((prev) => (prev.includes(t) ? prev : [...prev, t]));
  };

  const submit = () => {
    if (!canPublish) return;
    publishPost(text.trim(), topics, images, circleId);
    back();
  };

  return (
    <div className="flex flex-col h-full relative bg-white">
      {/* 顶栏:取消 / 发帖子ⓘ / 发布 */}
      <div className="flex items-center h-11 px-3 shrink-0">
        <button {...bindBack()} className="text-[15px] text-[#1A1A1A] bg-transparent border-none cursor-pointer p-0">
          {s.cancel}
        </button>
        <div className="flex-1 flex items-center justify-center gap-1">
          <span className="text-[16px] font-semibold text-[#1A1A1A]">{s.publishTitle}</span>
          <IcHelp size={14} className="text-[#BBBBBB]" />
        </div>
        <button
          {...bindTap({ kind: 'action', id: 'publish.post.submit' }, { onTrigger: submit })}
          disabled={!canPublish}
          className="px-4 h-8 rounded-full text-[14px] text-white border-none cursor-pointer"
          style={{ background: canPublish ? MY.primary : '#FBC7D9' }}
        >
          {s.publishAction}
        </button>
      </div>

      {/* 正文输入区(输入相关容器保持键盘) */}
      <div className="flex-1 flex flex-col px-4 pt-2 overflow-hidden" data-keep-keyboard="true">
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={s.publishPlaceholder}
          data-action="publish.text.input"
          data-action-type="input"
          className="w-full h-40 text-[16px] leading-relaxed text-[#1A1A1A] outline-none resize-none border-none p-0"
        />
        {/* 已插入话题:以粉色 span 追加在正文尾部 */}
        {topics.length > 0 && (
          <div className="text-[16px] leading-relaxed -mt-1">
            {topics.map((t) => (
              <span key={t} className="mr-1.5" style={{ color: '#FF6E96' }}>{t}</span>
            ))}
          </div>
        )}
        {/* 已选图片预览 */}
        {images.length > 0 && (
          <div className="flex gap-2 mt-2">
            {images.map((img) => (
              <Img key={img} src={img} className="w-24 h-24 rounded-lg object-cover" />
            ))}
          </div>
        )}
      </div>

      {/* 话题推荐 chips 行 */}
      <div className="shrink-0 flex gap-2 px-3 pb-2 overflow-x-auto" data-keep-keyboard="true">
        {suggestions.map((t) => (
          <button
            key={t}
            {...bindTap({ kind: 'action', id: 'publish.topic.insert' }, {
              params: { target: t },
              onTrigger: () => insertTopic(t),
            })}
            className="px-3 h-8 rounded-full bg-[#F5F5F7] text-[12px] text-[#666] border-none cursor-pointer whitespace-nowrap shrink-0"
          >
            {t}
          </button>
        ))}
      </div>

      {/* 工具栏 */}
      <div className="shrink-0 flex items-center justify-between px-5 h-12 border-t border-[#F0F0F0]" data-keep-keyboard="true">
        <button
          {...bindTap({ kind: 'action', id: 'publish.image.add' }, {
            onTrigger: () => {
              void pickImages({ multiple: true, maxSelect: 9 - images.length }).then((r) => {
                if (r.cancelled || !r.selected.length) return;
                setImages((prev) => [...prev, ...r.selected.map((x) => x.uri)].slice(0, 9));
              });
            },
          })}
          className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer"
          aria-label="图片"
        >
          <IcImage size={22} className="text-[#1A1A1A]" />
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'publish.topic.panel.open' }, { onTrigger: () => openPanel('topic') })}
          className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer"
          aria-label="话题"
        >
          <IcTopic size={22} className="text-[#1A1A1A]" />
        </button>
        {[
          { key: 'emoji', Icon: IcEmoji, label: '表情' },
          { key: 'poll', Icon: IcPoll, label: '投票' },
          { key: 'ai', Icon: IcAI, label: 'AI' },
          { key: 'more', Icon: IcMoreH, label: '更多' },
        ].map(({ key, Icon, label }) => (
          <button
            key={key}
            {...bindTap({ kind: 'action', id: 'publish.tools.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
            className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer"
            aria-label={label}
          >
            <Icon size={22} className="text-[#1A1A1A]" />
          </button>
        ))}
      </div>

      {/* #话题选择面板(?panel=topic) */}
      {panel === 'topic' && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" {...bindBack()} />
          <div className="relative bg-white rounded-t-2xl pb-6 max-h-[60%] flex flex-col">
            <div className="flex items-center justify-between px-4 h-12 shrink-0">
              <div className="text-[15px] font-semibold text-[#1A1A1A]">选择话题</div>
              <button
                {...bindBack()}
                className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer"
                aria-label="关闭"
              >
                <IcClose size={18} className="text-[#999]" />
              </button>
            </div>
            <div className="overflow-y-auto px-4">
              {TOPIC_PANEL_LIST.map((t) => (
                <button
                  key={t}
                  {...bindTap({ kind: 'action', id: 'publish.topic.insert' }, {
                    params: { target: t },
                    onTrigger: () => { insertTopic(t); back(); },
                  })}
                  className="w-full text-left py-3 text-[14px] border-none bg-transparent cursor-pointer border-b border-[#F5F5F5]"
                  style={{ color: topics.includes(t) ? '#BBBBBB' : '#FF6E96' }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {toast}
    </div>
  );
}
