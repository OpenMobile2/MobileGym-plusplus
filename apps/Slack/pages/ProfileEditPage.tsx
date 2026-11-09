import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSlackGestures } from '../hooks/useSlackGestures';
import { useI18n } from '../i18n';
import { useSlackStore, ME } from '../state';
import { NEUTRAL } from '../res/colors';
import { IcClose } from '../res/icons';

/** 编辑个人档案（显示名 / 职位） */
const ProfileEditPage: React.FC = () => {
  const { bindBack, bindInput } = useSlackGestures();
  const { t } = useI18n();
  const { userId = '' } = useParams();

  const user = useSlackStore((s) => s.users.find((u) => u.id === userId));
  const updateUser = useSlackStore((s) => s.updateUser);

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [title, setTitle] = useState(user?.title ?? '');

  if (!user || user.id !== ME) return null;

  const save = (patch: { displayName?: string; title?: string }) => {
    updateUser(userId, patch);
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
          {t('profileEdit.title')}
        </h1>
        <span className="w-9" />
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto px-4 pb-6"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <label className="mt-2 block text-[13px] font-bold" style={{ color: NEUTRAL.textSecondary }}>
          {t('profileEdit.nameLabel')}
        </label>
        <input
          {...bindInput('slack.profileedit.name.input')}
          value={displayName}
          onChange={(e) => {
            setDisplayName(e.target.value);
            save({ displayName: e.target.value });
          }}
          className="mt-1 w-full border-b border-[#EAEAEA] bg-transparent pb-2 text-[17px] outline-none"
          style={{ color: NEUTRAL.textPrimary }}
        />

        <label className="mt-5 block text-[13px] font-bold" style={{ color: NEUTRAL.textSecondary }}>
          {t('profileEdit.titleLabel')}
        </label>
        <input
          {...bindInput('slack.profileedit.title.input')}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            save({ title: e.target.value });
          }}
          className="mt-1 w-full border-b border-[#EAEAEA] bg-transparent pb-2 text-[17px] outline-none"
          style={{ color: NEUTRAL.textPrimary }}
        />
      </div>
    </div>
  );
};

export default ProfileEditPage;
