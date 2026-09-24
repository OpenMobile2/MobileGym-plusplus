import React, { useState } from 'react';
import { useSlackGestures } from '../hooks/useSlackGestures';
import { useI18n } from '../i18n';
import { NEUTRAL, BLUE } from '../res/colors';
import { IcHash, IcClose } from '../res/icons';
import { LauncherIcon } from '../res/appIcon';

/** 建立一个频道·命名（IMG_2371）。阶段④ 订正：不校验小写，只要非空即可继续。 */
const CreateChannelPage: React.FC = () => {
  const { bindTap, bindBack, bindInput } = useSlackGestures();
  const { t } = useI18n();
  const [name, setName] = useState('');
  const ready = name.trim().length > 0;

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
          {t('createChannel.title')}
        </h1>
        <button
          {...bindTap('slack.createchannel.next', { params: { name: name.trim(), private: '0' } })}
          disabled={!ready}
          className="rounded-full border-none px-3 py-1.5 text-[15px] font-semibold"
          style={{
            backgroundColor: ready ? '#EAF2FA' : '#F5F5F5',
            color: ready ? BLUE.link : '#B5B5B8',
          }}
        >
          {t('createChannel.next')}
        </button>
      </div>

      <h2 className="px-4 pb-1 pt-2 text-[15px] font-bold" style={{ color: NEUTRAL.textPrimary }}>
        {t('createChannel.nameLabel')}
      </h2>
      <div className="flex items-center gap-2 border-b border-[#EAEAEA] px-4 pb-2.5">
        <IcHash size={19} style={{ color: NEUTRAL.textSecondary }} />
        <input
          {...bindInput('slack.createchannel.name.input')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('createChannel.namePlaceholder')}
          className="min-w-0 flex-1 border-none bg-transparent text-[17px] outline-none"
          style={{ color: NEUTRAL.textPrimary }}
        />
      </div>

      <div className="mx-4 mt-4 flex gap-3 rounded-lg bg-[#F3F3F3] p-3">
        <span className="mt-0.5 flex-shrink-0">
          <LauncherIcon size={18} />
        </span>
        <p className="text-[14px] leading-snug" style={{ color: NEUTRAL.textPrimary }}>
          {t('createChannel.nameHint')}
        </p>
      </div>
    </div>
  );
};

export default CreateChannelPage;
