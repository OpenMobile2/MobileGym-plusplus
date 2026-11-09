import React from 'react';
import { useBaicizhanStore } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';
import { LearningCover, PageHeader } from '../components/common';
import { IcChevronRight } from '../res/icons';

export default function WordbookListPage() {
  const s = useStrings();
  const { bindTap, action } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const canCreate = st.wordbooks.length < 3;

  return (
    <div className="flex h-full flex-col bg-white" data-status-bar-foreground="dark">
      <PageHeader title={`${s.wordbookTitle} (${st.wordbooks.length}/3)`} />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-3" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="mb-2 rounded-2xl bg-[#F2F6FF] px-4 py-3 text-xs leading-5 text-[#5B6B85]">新建自己的单词本，再进入详情添加、批量管理单词。最多可保留 3 本。</div>
        {st.wordbooks.map((wordbook) => (
          <button key={wordbook.id} {...bindTap('wordbook.detail.open', { params: { bookId: wordbook.id } })}
            className="flex w-full items-center gap-3 border-b border-[#F2F2F2] py-3 text-left">
            <LearningCover id={wordbook.id} title={wordbook.name} icon={wordbook.id === 'wb_collect' ? '★' : 'Aa'} compact className="h-14 w-12 shrink-0 rounded-lg" />
            <div><div className="text-base font-semibold text-[#212121]">{wordbook.name}</div><div className="text-xs text-[#9AA5B1]">共 {wordbook.wordIds.length} 词 · 点击进入管理</div></div>
            <IcChevronRight size={16} color="#C9CDD3" className="ml-auto" />
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 border-t border-[#F0F0F0] p-4">
        <button {...action('wordbook.token.paste', () => st.showToast('口令无效'))} className="flex flex-col items-center text-[10px] text-[#9AA5B1]">🔑<span>{s.pasteToken}</span></button>
        {canCreate ? (
          <button {...bindTap('wordbook.create.open')} className="flex-1 rounded-full py-3 text-sm font-semibold text-white" style={{ background: colors.primary }}>＋ {s.newWordbook}</button>
        ) : (
          <div className="flex-1 rounded-full bg-[#ECEFF3] py-3 text-center text-sm text-[#9AA5B1]">已达 3 本上限</div>
        )}
      </div>
    </div>
  );
}
