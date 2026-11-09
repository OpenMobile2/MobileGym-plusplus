import React from 'react';
import { useParams } from 'react-router-dom';
import { TopBar, Screen, coverBg, WY } from '../components/ui';

const TITLES: Record<string, string> = { fans: '新增粉丝', at: '评论和@提及', like: '赞和通知' };
export default function NoticeListPage() {
  const { kind = 'fans' } = useParams();
  const rows = kind === 'at' ? [] : ['鸣濑羽歌 关注了你', 'RyanPan_ 收藏了你的歌单'];
  return (
    <Screen>
      <TopBar title={TITLES[kind] || '通知'} />
      <div className="flex-1 overflow-y-auto">
        {rows.length === 0 && <div className="p-10 text-center text-[13px]" style={{ color: WY.textSecondary }}>没有新通知</div>}
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: WY.divider }}>
            <div className="w-10 h-10 rounded-full" style={{ background: coverBg(r) }} /><span className="text-[14px]" style={{ color: WY.textPrimary }}>{r}</span>
          </div>
        ))}
      </div>
    </Screen>
  );
}
