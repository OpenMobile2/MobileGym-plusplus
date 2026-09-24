import React from 'react';
import { useBroadcastStore } from '../state';
import { TopBar } from '../components/common';
import { EpisodeRow } from '../components/cards';
import { useBroadcastStrings } from '../hooks/useBroadcastStrings';

export const UpNextPage: React.FC = () => {
  const s = useBroadcastStrings();
  const episodes = useBroadcastStore(s => s.episodes);
  const upNextIds = useBroadcastStore(s => s.upNextIds);
  return (
    <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground="dark">
      <TopBar title={s.up_next} />
      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {upNextIds.length === 0 && <div className="p-10 text-center text-app-text-muted text-sm">{s.queue_empty}</div>}
        {upNextIds.map(id => {
          const ep = episodes[id]; if (!ep) return null;
          return <EpisodeRow key={id} ep={ep} label={ep.progressSec > 0 ? s.continue_listening : s.new_episode} />;
        })}
      </div>
    </div>
  );
};
