import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSlackGestures } from '../hooks/useSlackGestures';
import { useI18n } from '../i18n';
import { useSlackStore, ME } from '../state';
import MemberPicker from '../components/MemberPicker';

/** 建立频道·添加成员（可跳过）。「建立」时才真正写入频道。 */
const CreateChannelMembersPage: React.FC = () => {
  const { bindTap, action, bindInput, go } = useSlackGestures();
  const { t } = useI18n();
  const [params] = useSearchParams();
  const channelName = params.get('name') ?? '';
  const isPrivate = params.get('private') === '1';

  const users = useSlackStore((s) => s.users);
  const createChannel = useSlackStore((s) => s.createChannel);
  const addMembers = useSlackStore((s) => s.addMembers);

  const [filter, setFilter] = useState('');
  const [picked, setPicked] = useState<string[]>([]);

  const candidates = users.filter(
    (u) =>
      u.id !== ME &&
      !u.isBot &&
      (filter.trim() === '' ||
        u.displayName.includes(filter.trim()) ||
        u.handle.includes(filter.trim().toLowerCase())),
  );

  return (
    <MemberPicker
      title={t('createChannel.membersTitle')}
      confirmLabel={picked.length > 0 ? t('common.add') : t('createChannel.skip')}
      confirmEnabled
      confirmProps={bindTap('slack.createmembers.done', {
        // 频道 id 只有建好之后才存在，所以在 onTrigger 里带真实 id 走同一条 transition
        onTrigger: () => {
          const slug = channelName.trim().replace(/\s+/g, '-');
          const joinText = (name: string) =>
            t('members.joined', { name, channel: slug });
          const id = createChannel(channelName, isPrivate, { joinText });
          if (picked.length > 0) addMembers(id, picked, joinText);
          // 清掉「建立频道 → 添加成员」整段流程，返回才回到主页/浏览频道，而不是创建页
          go('slack.createmembers.done', { convId: id }, {
            popTo: '/channel/create',
            popToInclusive: true,
          });
        },
      })}
      filterValue={filter}
      onFilterChange={setFilter}
      filterProps={bindInput('slack.createmembers.member.filter')}
      candidates={candidates}
      selectedIds={picked}
      rowProps={(userId) =>
        action(
          'slack.createmembers.member.toggle',
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

export default CreateChannelMembersPage;
