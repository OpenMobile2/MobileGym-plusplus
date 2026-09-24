import React from 'react';
import { useSlackGestures } from '../hooks/useSlackGestures';
import { useI18n } from '../i18n';
import { NEUTRAL, BLUE } from '../res/colors';
import { IcCheck, IcSearch } from '../res/icons';
import Avatar from './Avatar';
import type { Bind, SlackUser } from '../types';

/**
 * 成员选择模态卡（IMG_2379）：左上蓝色「取消」、居中标题、右上确认键；
 * 输入行 + 候选人列表。建立频道-添加成员 与 频道-添加成员 共用。
 */
const MemberPicker: React.FC<{
  title: string;
  confirmLabel: string;
  confirmEnabled: boolean;
  confirmProps: Bind;
  filterValue: string;
  onFilterChange: (v: string) => void;
  filterProps: Bind;
  candidates: SlackUser[];
  selectedIds: string[];
  rowProps: (userId: string) => Bind;
}> = ({
  title,
  confirmLabel,
  confirmEnabled,
  confirmProps,
  filterValue,
  onFilterChange,
  filterProps,
  candidates,
  selectedIds,
  rowProps,
}) => {
  const { bindBack } = useSlackGestures();
  const { t } = useI18n();

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex flex-shrink-0 items-center gap-2 px-4 pb-2 pt-11">
        <button
          {...bindBack()}
          className="rounded-full border-none px-3 py-1.5 text-[15px] font-semibold text-white"
          style={{ backgroundColor: BLUE.link }}
        >
          {t('common.cancel')}
        </button>
        <h1
          className="flex-1 truncate text-center text-[17px] font-bold"
          style={{ color: NEUTRAL.textPrimary }}
        >
          {title}
        </h1>
        <button
          {...confirmProps}
          disabled={!confirmEnabled}
          className="rounded-full border-none px-3 py-1.5 text-[15px] font-semibold"
          style={{
            backgroundColor: confirmEnabled ? '#EAF2FA' : '#F5F5F5',
            color: confirmEnabled ? BLUE.link : '#B5B5B8',
          }}
        >
          {confirmLabel}
        </button>
      </div>

      <div className="flex-shrink-0 border-b border-[#EAEAEA] px-4 pb-2.5">
        <input
          {...filterProps}
          value={filterValue}
          onChange={(e) => onFilterChange(e.target.value)}
          placeholder={t('members.placeholder')}
          className="w-full border-none bg-transparent text-[16px] outline-none"
          style={{ color: NEUTRAL.textPrimary }}
        />
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {candidates.length === 0 ? (
          <div className="flex items-start gap-3 px-4 py-3">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F3F3F3]"
              style={{ color: NEUTRAL.textSecondary }}
            >
              <IcSearch size={17} />
            </span>
            <span>
              <span className="block text-[16px] font-bold" style={{ color: NEUTRAL.textPrimary }}>
                {t('members.noMatch')}
              </span>
              <span className="block text-[13px]" style={{ color: NEUTRAL.textSecondary }}>
                {t('members.tryEmail')}
              </span>
            </span>
          </div>
        ) : (
          candidates.map((u) => {
            const picked = selectedIds.includes(u.id);
            return (
              <button
                key={u.id}
                {...rowProps(u.id)}
                className="flex w-full items-center gap-3 border-none bg-transparent px-4 py-2.5 text-left"
              >
                <Avatar user={u} size={36} rounded="rounded-md" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[16px]" style={{ color: NEUTRAL.textPrimary }}>
                    {u.displayName}
                  </span>
                  <span className="block truncate text-[13px]" style={{ color: NEUTRAL.textSecondary }}>
                    @{u.handle}
                  </span>
                </span>
                <span
                  className="flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full border-2"
                  style={{
                    borderColor: picked ? BLUE.link : '#C4C4C6',
                    backgroundColor: picked ? BLUE.link : 'transparent',
                    color: '#FFFFFF',
                  }}
                >
                  {picked && <IcCheck size={14} />}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MemberPicker;
