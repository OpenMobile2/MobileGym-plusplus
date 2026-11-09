import React from 'react';
import { useWeiboGestures } from '../hooks/useWeiboGestures';
import { useWeiboStore } from '../state';
import { StatusCard } from '../components/StatusCard';
import { useStrings, TopBar, EmptyState } from '../components/ui';

export default function HistoryPage() {
  const s = useStrings();
  const { bindBack } = useWeiboGestures();
  const statuses = useWeiboStore((st) => st.statuses);
  const history = statuses.filter((x) => !x.supertopicId).slice(0, 4);

  return (
    <div className="flex flex-col h-full bg-[#F2F2F2]">
      <TopBar backBinding={bindBack()} title="浏览记录" />
      <div className="flex-1 overflow-y-auto pt-2" data-scroll-container="history-list" data-scroll-direction="vertical">
        {history.length ? (
          <>
            <div className="px-4 py-1 text-[13px] text-[#7F7F7F]">今天</div>
            {history.map((st) => <StatusCard key={st.id} status={st} openTransition="history.status-open" showFollow={false} />)}
          </>
        ) : <EmptyState text={s.emptyHistory} />}
      </div>
    </div>
  );
}
