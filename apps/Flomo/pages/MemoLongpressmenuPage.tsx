import React from 'react';
import { useFlomoStore } from '../state';
import { useFlomoGestures } from '../hooks/useFlomoGestures';
import { Sheet, Row, IconRow } from '../components/Sheet';
import { IcShare, IcEdit, IcCopy, IcAi, IcLink, IcDuplicate, IcDelete } from '../res/icons';
import { copyToClipboard } from '../capabilities';

export default function MemoLongpressmenuPage() {
  const { bindTap, back } = useFlomoGestures();
  const cur = useFlomoStore((s) => s.currentMemoId);
  const memos = useFlomoStore((s) => s.memos);
  const deleteMemo = useFlomoStore((s) => s.deleteMemo);
  const duplicateMemo = useFlomoStore((s) => s.duplicateMemo);
  const setCompose = useFlomoStore((s) => s.setCompose);
  const toast = useFlomoStore((s) => s.toast);
  const currentMemo = memos.find((m) => m.id === cur);

  const copyMemo = () => {
    if (!currentMemo) {
      toast('笔记不存在');
      return;
    }
    if (!copyToClipboard(currentMemo.content)) {
      toast('无法访问剪切板');
      return;
    }
    toast('已复制');
  };

  const act = (id: string, fn: () => void) =>
    bindTap({ kind: 'action', id }, { onTrigger: () => { fn(); back(); } });

  return (
    <Sheet>
      <IconRow
        items={[
          { icon: <IcShare size={20} />, label: '分享', bind: bindTap('memo.longPressMenu.share') },
          { icon: <IcEdit size={20} />, label: '编辑', bind: bindTap('memo.longPressMenu.edit', { beforeTrigger: () => { if (cur) setCompose('edit', cur); } }) },
          { icon: <IcCopy size={20} />, label: '复制', bind: act('memo.longPressMenu.copy.do', copyMemo) },
        ]}
      />
      <div className="h-px mx-5 my-1" style={{ background: '#F0F0F0' }} />
      <Row icon={<IcAi size={16} />} label="AI 洞察" bind={bindTap('memo.longPressMenu.aiInsight')} />
      <Row icon={<IcLink size={16} />} label="相关笔记" bind={bindTap('memo.longPressMenu.related')} />
      <Row icon={<IcDuplicate size={16} />} label="副本" bind={act('memo.longPressMenu.duplicate.do', () => { if (cur) { duplicateMemo(cur); toast('已创建副本'); } })} />
      <div className="h-px mx-5 my-1" style={{ background: '#F0F0F0' }} />
      <Row danger icon={<IcDelete size={16} />} label="删除" bind={act('memo.longPressMenu.delete.do', () => { if (cur) deleteMemo(cur); })} />
    </Sheet>
  );
}
