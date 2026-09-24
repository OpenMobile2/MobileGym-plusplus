import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/common';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { useBaicizhanStore } from '../state';
import { colors } from '../res/colors';

export default function WordbookEditPage() {
  const s = useStrings();
  const { action, back } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const [sp] = useSearchParams();
  const bookId = sp.get('bookId');
  const wordbook = st.wordbooks.find((item) => item.id === bookId);
  const editing = Boolean(wordbook);
  const [name, setName] = useState(wordbook?.name ?? '');
  const clean = name.trim();
  const duplicate = st.wordbooks.some((item) => item.id !== bookId && item.name === clean);
  const canSave = clean.length > 0 && clean.length <= 20 && !duplicate && (editing || st.wordbooks.length < 3);

  const save = () => {
    if (!canSave) return;
    if (wordbook) st.renameWordbook(wordbook.id, clean);
    else st.addWordbook(clean);
    back();
  };

  return (
    <div className="flex h-full flex-col bg-[#F5F7FB]" data-status-bar-foreground="dark">
      <PageHeader title={editing ? s.manageWordbook : s.newWordbook} />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <label className="text-xs font-semibold text-[#5B6B85]" htmlFor="wordbook-name">{s.wordbookName}</label>
          <input id="wordbook-name" value={name} maxLength={20} autoFocus
            onChange={(event) => setName(event.target.value)} {...action('wordbook.name.input', () => {}, { params: { value: name } })}
            placeholder="例如：外刊生词" className="mt-2 w-full rounded-xl bg-[#F2F3F5] px-3 py-3 text-sm outline-none" />
          <div className="mt-2 flex text-[11px]"><span className={duplicate ? 'text-[#E4574C]' : 'text-[#9AA5B1]'}>{duplicate ? '名称已存在，请换一个' : '名称会显示在单词本列表中'}</span><span className="ml-auto text-[#9AA5B1]">{name.length}/20</span></div>
          <button data-keep-keyboard="true" disabled={!canSave} {...action('wordbook.edit.save', save)} className="mt-5 w-full rounded-full py-3 text-sm font-semibold text-white disabled:opacity-40" style={{ background: colors.primary }}>{s.save}</button>
        </div>

        {wordbook && wordbook.id !== 'wb_collect' && (
          <div className="mt-5 rounded-2xl bg-white p-4">
            <div className="text-sm font-semibold text-[#33405C]">更多管理</div>
            <div className="mt-1 text-xs text-[#9AA5B1]">删除后，本单词本中的分组会移除；词库中的单词不会丢失。</div>
            <button {...action('wordbook.delete.submit', () => { st.deleteWordbook(wordbook.id); back(2); }, { params: { bookId: wordbook.id } })} className="mt-4 w-full rounded-full bg-[#FFF0EE] py-3 text-sm font-semibold text-[#E4574C]">{s.deleteWordbook}</button>
          </div>
        )}
      </div>
    </div>
  );
}
