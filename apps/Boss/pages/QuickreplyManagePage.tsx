import React from 'react';
import { useBossGestures } from '../hooks/useBossGestures';
import { useBossStore } from '../state';
import { PageHeader, PrimaryButton } from '../components/common';

/** 管理常用语(IMG_8508):列表 + 编辑 + 排序 + 添加。会话「去修改(打招呼语)」也进这里。 */
const QuickreplyManagePage: React.FC = () => {
  const { bindTap, action } = useBossGestures();
  const store = useBossStore();
  const quickReplies = useBossStore((s) => s.quickReplies);

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader
        title={`管理常用语${quickReplies.length}/15`}
        right={
          <button
            {...action('quickreply.sort.toggle', () => store.showNotice('常用语拖动排序暂未开放，请点击“我知道了”返回。'), { params: {} })}
            className="pr-1 text-[15px] text-gray-700"
          >
            排序
          </button>
        }
      />
      <div className="min-h-0 flex-1 overflow-y-auto px-4" data-scroll-container="main" data-scroll-direction="vertical">
        {quickReplies.map((q) => (
          <div key={q.id} className="border-b border-gray-100 py-4">
            <div className="text-[15px] leading-relaxed text-gray-900">{q.text}</div>
            <div className="mt-2 flex justify-end">
              <button
                {...bindTap('quickreply.edit-open', { params: { id: q.id } })}
                className="flex items-center gap-1 text-[14px] text-gray-500"
              >
                ✎ 编辑
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="shrink-0 px-4 pb-6">
        <PrimaryButton {...bindTap('quickreply.add-open')}>添加常用语</PrimaryButton>
      </div>
    </div>
  );
};

export default QuickreplyManagePage;
