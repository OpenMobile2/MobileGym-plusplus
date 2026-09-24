import React, { useState } from 'react';
import { useBossGestures } from '../hooks/useBossGestures';
import { useBossStore } from '../state';
import { Avatar, PageHeader } from '../components/common';
import { COLORS } from '../res/colors';

const QUESTIONS = [
  { id: 'aq1', q: '怎么能让账号更活跃,牛人主动打招呼啊?', hint: '发起了提问', avatar: 'f5' },
  { id: 'aq2', q: '礼貌求问!我现在是高中毕业,家人想让我去机构学电脑、云计算AI运维,学完能找到工作吗?求指点?', hint: '期待你的解答', avatar: 'f4' },
  { id: 'aq3', q: '说接受无经验,实际上呢?', hint: '期待你的解答', avatar: 'f2' },
  { id: 'aq4', q: '上班怎么才能快乐?', hint: '等你来答', avatar: 'f7' },
  { id: 'aq5', q: '这个点了,还有人在boss活跃社区吗?🌙🌙?', hint: '期待你的解答', avatar: 'f1' },
  { id: 'aq6', q: '怎么运营boss账号呢?', hint: '期待你的解答', avatar: 'f6' },
  { id: 'aq7', q: '想转行做数据分析,大专学历现实吗?', hint: '试试帮TA解答', avatar: 'f8' },
  { id: 'aq8', q: '27届护理大专应届,有护士资格证,面试诊所都要经验,怎么办?', hint: '等你来答', avatar: 'f3' },
];

/** 写回答-问题列表(补拍 19_30)。回答体系不做,写回答 toast wontfix。 */
const FeedAnswerPage: React.FC = () => {
  const { action, back } = useBossGestures();
  const store = useBossStore();
  const [selected, setSelected] = useState<(typeof QUESTIONS)[number] | null>(null);
  const [answer, setAnswer] = useState('');

  return (
    <div className="flex h-full flex-col bg-[#F5F6F7]">
      <div className="bg-white"><PageHeader title="写回答" /></div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3" data-scroll-container="main" data-scroll-direction="vertical">
        {QUESTIONS.map((item) => (
          <div key={item.id} className="mb-3 rounded-2xl bg-white p-4">
            <div className="text-[16px] font-semibold leading-relaxed text-gray-900">{item.q}</div>
            <div className="mt-3 flex items-center justify-between">
              <span className="flex items-center gap-2 text-[13px] text-gray-400">
                <Avatar imgKey={item.avatar} name="TA" size={26} />{item.hint}
              </span>
              <button
                {...action('answer.write.toast', () => { setSelected(item); setAnswer(''); }, { params: { id: item.id } })}
                className="rounded-full px-4 py-1.5 text-[13px] font-medium text-white"
                style={{ backgroundColor: COLORS.primaryBtn }}
              >
                写回答
              </button>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="absolute inset-0 z-40 flex flex-col bg-white">
          <PageHeader title="写回答" onBeforeBack={() => setSelected(null)} />
          <div className="px-4">
            <div className="rounded-xl bg-[#F5F6F7] p-3 text-[15px] font-semibold leading-relaxed text-gray-900">{selected.q}</div>
            <textarea
              autoFocus
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="写下你的经验和建议"
              className="mt-4 h-64 w-full resize-none bg-transparent text-[16px] leading-relaxed outline-none placeholder:text-gray-300"
            />
          </div>
          <div className="mt-auto px-4 pb-6">
            <button
              {...action('answer.publish.commit', () => {
                if (!answer.trim()) { store.showToast('请先填写回答'); return; }
                store.publishAnswer(selected.q, answer.trim());
                store.showToast('回答已发布');
                back();
              }, { params: { id: selected.id } })}
              className="w-full rounded-full py-3 text-[16px] font-medium text-white"
              style={{ backgroundColor: answer.trim() ? COLORS.primaryBtn : '#BFE8E6' }}
            >
              发布回答
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedAnswerPage;
