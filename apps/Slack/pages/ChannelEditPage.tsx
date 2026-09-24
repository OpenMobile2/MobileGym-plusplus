import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSlackGestures } from '../hooks/useSlackGestures';
import { useI18n } from '../i18n';
import { useSlackStore } from '../state';
import { NEUTRAL } from '../res/colors';
import { IcHash, IcClose } from '../res/icons';

/** 编辑频道页（IMG_2378）。名称不做小写校验（阶段④ 订正）。 */
const ChannelEditPage: React.FC = () => {
  const { bindBack, bindInput } = useSlackGestures();
  const { t } = useI18n();
  const { convId = '' } = useParams();

  const conv = useSlackStore((s) => s.conversations.find((c) => c.id === convId));
  const updateChannel = useSlackStore((s) => s.updateChannel);

  const [name, setName] = useState(conv?.name ?? '');
  const [topic, setTopic] = useState(conv?.topic ?? '');
  const [description, setDescription] = useState(conv?.description ?? '');

  if (!conv) return null;

  const save = (patch: { name?: string; topic?: string; description?: string }) => {
    updateChannel(convId, patch);
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex flex-shrink-0 items-center gap-2 px-4 pb-2 pt-11">
        <button
          {...bindBack()}
          aria-label="close"
          className="flex h-9 w-9 items-center justify-center rounded-full border-none bg-[#F3F3F3]"
          style={{ color: NEUTRAL.textPrimary }}
        >
          <IcClose size={19} />
        </button>
        <h1 className="flex-1 text-center text-[17px] font-bold" style={{ color: NEUTRAL.textPrimary }}>
          {t('channelEdit.title')}
        </h1>
        <span className="w-9" />
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto px-4 pb-6"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <label className="mt-2 block text-[13px] font-bold" style={{ color: NEUTRAL.textSecondary }}>
          {t('channelEdit.nameLabel')}
        </label>
        <div className="mt-1 flex items-center gap-2 border-b border-[#EAEAEA] pb-2">
          <IcHash size={19} style={{ color: NEUTRAL.textSecondary }} />
          <input
            {...bindInput('slack.channeledit.name.input')}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              save({ name: e.target.value });
            }}
            className="min-w-0 flex-1 border-none bg-transparent text-[17px] outline-none"
            style={{ color: NEUTRAL.textPrimary }}
          />
        </div>
        <p className="mt-1 text-[13px]" style={{ color: NEUTRAL.textSecondary }}>
          {t('channelEdit.nameHint')}
        </p>

        <label className="mt-5 block text-[13px] font-bold" style={{ color: NEUTRAL.textSecondary }}>
          {t('channelEdit.topicLabel')}
        </label>
        <input
          {...bindInput('slack.channeledit.topic.input')}
          value={topic}
          onChange={(e) => {
            setTopic(e.target.value);
            save({ topic: e.target.value });
          }}
          placeholder={t('channelEdit.topicPlaceholder')}
          className="mt-1 w-full border-b border-[#EAEAEA] bg-transparent pb-2 text-[17px] outline-none"
          style={{ color: NEUTRAL.textPrimary }}
        />

        <label className="mt-5 block text-[13px] font-bold" style={{ color: NEUTRAL.textSecondary }}>
          {t('channelEdit.descLabel')}
        </label>
        <textarea
          {...bindInput('slack.channeledit.desc.input')}
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            save({ description: e.target.value });
          }}
          placeholder={t('channelEdit.descPlaceholder')}
          rows={4}
          className="mt-1 w-full resize-none rounded-lg border border-[#DDDDDD] px-3 py-2 text-[17px] outline-none"
          style={{ color: NEUTRAL.textPrimary, backgroundColor: '#F5F5F5' }}
        />
      </div>
    </div>
  );
};

export default ChannelEditPage;
