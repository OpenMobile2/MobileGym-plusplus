import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSlackGestures } from '../hooks/useSlackGestures';
import { useI18n } from '../i18n';
import { useSlackStore, ME } from '../state';
import MemberPicker from '../components/MemberPicker';

/** 频道-添加成员（IMG_2379）。添加后写入成员名单，会话里补一条系统消息（Layer 1 渲染）。 */
const AddMembersPage: React.FC = () => {
  const { action, bindInput, back } = useSlackGestures();
  const { t } = useI18n();
  const { convId = '' } = useParams();

  const users = useSlackStore((s) => s.users);
  const conv = useSlackStore((s) => s.conversations.find((c) => c.id === convId));
  const addMembers = useSlackStore((s) => s.addMembers);

  const [filter, setFilter] = useState('');
  const [picked, setPicked] = useState<string[]>([]);

  const candidates = users.filter(
    (u) =>
      u.id !== ME &&
      !u.isBot &&
      !(conv?.memberIds ?? []).includes(u.id) &&
      (filter.trim() === '' ||
        u.displayName.includes(filter.trim()) ||
        u.handle.includes(filter.trim().toLowerCase())),
  );

  return (
    <MemberPicker
      title={t('members.title')}
      confirmLabel={t('common.add')}
      confirmEnabled={picked.length > 0}
      confirmProps={action('slack.addmembers.add.submit', () => {
        addMembers(convId, picked, (name) =>
          t('members.joined', { name, channel: conv?.name ?? '' }),
        );
        back();
      })}
      filterValue={filter}
      onFilterChange={setFilter}
      filterProps={bindInput('slack.addmembers.filter.input')}
      candidates={candidates}
      selectedIds={picked}
      rowProps={(userId) =>
        action(
          'slack.addmembers.candidate.toggle',
          () =>
            setPicked((prev) =>
              prev.includes(userId) ? prev.filter((x) => x !== userId) : [...prev, userId],
            ),
          { params: { userId } },
        )
      }
    />
  );
};

export default AddMembersPage;
