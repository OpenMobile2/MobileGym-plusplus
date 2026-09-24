import React, { useState } from 'react';
import { useYoukuStore } from '../state';
import { useYoukuGestures } from '../hooks/useYoukuGestures';
import { useI18n } from '../i18n';
import { YOUKU_CONFIG } from '../data';
import { IcSearch, IcHash } from '../components/msgpub/icons';

interface TopicLite {
  id: string;
  name: string;
  heatText: string;
}

const TOPICS = YOUKU_CONFIG.topics as TopicLite[];

/** spec 节点 publish.topic(route /publish/topic)—— 选择话题页(s201);选中写 _temp.publishDraft 后 back 回编辑页 */
export default function PublishTopicPage() {
  const { action, bindBack, back } = useYoukuGestures();
  const { t } = useI18n();
  const draft = useYoukuStore((s) => s._temp.publishDraft);
  const setTemp = useYoukuStore((s) => s.setTemp);
  const [keyword, setKeyword] = useState('');

  const kw = keyword.trim();
  const list = kw ? TOPICS.filter((x) => x.name.includes(kw)) : TOPICS;

  return (
    <div
      className="flex h-full w-full flex-col bg-(--app-c-page-bg) pt-10 text-(--app-c-text-primary)"
    >
      {/* 顶栏:搜索话题输入框 + 取消 */}
      <div className="flex shrink-0 items-center gap-4 px-3 py-2">
        <div className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-xl bg-(--app-c-chip-bg) px-3.5">
          <IcSearch size={18} strokeWidth={2} className="shrink-0 text-[#8A8A8A]" />
          <input
            data-action="publish.topic.search.input"
            data-action-type="input"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={t('publish.topic.searchPh')}
            className="min-w-0 flex-1 border-none bg-transparent text-[16px] text-(--app-c-text-primary) outline-none placeholder:text-[#666666]"
          />
        </div>
        <button
          {...bindBack()}
          className="shrink-0 cursor-pointer border-none bg-transparent p-0 text-[16px] text-(--app-c-text-primary)"
        >
          {t('common.cancel')}
        </button>
      </div>

      <div
        data-scroll-container="main"
        data-scroll-direction="vertical"
        className="min-h-0 flex-1 overflow-y-auto px-4 pb-6"
      >
        <div className="pb-1.5 pt-4 text-[19px] font-bold">{t('publish.topic.latest')}</div>

        {list.length === 0 && (
          <div className="pt-20 text-center text-[14px] text-[#666666]">
            {t('publish.topic.empty')}
          </div>
        )}

        {list.map((tp) => (
          <div
            key={tp.id}
            {...action(
              'publish.topic.select.topic',
              () => {
                setTemp({ publishDraft: { ...draft, topicName: tp.name } });
                back();
              },
              { params: { value: tp.id } },
            )}
            className="flex cursor-pointer items-center gap-3.5 py-3.5"
          >
            {/* # 气泡图标(蓝色井号) */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl rounded-bl-[4px] bg-[#16283E]">
              <IcHash size={20} strokeWidth={2.5} className="text-[#3D8BFF]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[16px]">{tp.name}</div>
              <div className="mt-1 text-[13px] text-[#999999]">{tp.heatText}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
