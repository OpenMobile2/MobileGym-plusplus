import React from 'react';
import { useFlomoStore } from '../state';
import { useFlomoGestures } from '../hooks/useFlomoGestures';
import { Sheet, Row } from '../components/Sheet';
import { IcShare, IcEdit, IcPin, IcDoc, IcAnnotate, IcLink, IcAi, IcMore, IcDelete } from '../res/icons';

export default function MemoCardmenuPage() {
  const { bindTap, back } = useFlomoGestures();
  const cur = useFlomoStore((s) => s.currentMemoId);
  const togglePin = useFlomoStore((s) => s.togglePin);
  const deleteMemo = useFlomoStore((s) => s.deleteMemo);
  const setCompose = useFlomoStore((s) => s.setCompose);
  const toast = useFlomoStore((s) => s.toast);

  const act = (id: string, fn: () => void) =>
    bindTap({ kind: 'action', id }, { onTrigger: () => { fn(); back(); } });

  return (
    <Sheet>
      <Row icon={<IcShare size={16} />} label="分享" bind={bindTap('share.image.open')} />
      <Row icon={<IcEdit size={16} />} label="编辑" bind={bindTap('compose.editor.edit', { beforeTrigger: () => { if (cur) setCompose('edit', cur); } })} />
      <Row icon={<IcPin size={16} />} label="置顶" bind={act('memo.cardMenu.pin.toggle', () => { if (cur) togglePin(cur); })} />
      <Row icon={<IcDoc size={16} />} label="查看详情" bind={bindTap('memo.detail.fromMenu')} />
      <Row icon={<IcAnnotate size={16} />} label="批注" bind={bindTap('compose.editor.annotate', { beforeTrigger: () => { if (cur) setCompose('annotate', cur); } })} />
      <Row icon={<IcLink size={16} />} label="相关笔记" bind={bindTap('related.notes.open')} />
      <Row icon={<IcAi size={16} />} label="AI 洞察" bind={bindTap('ai.insight.fromCard')} />
      <Row icon={<IcMore size={16} />} label="更多" bind={act('memo.cardMenu.more.expand', () => toast('该功能暂未开放'))} />
      <div className="h-px mx-5 my-1" style={{ background: '#F0F0F0' }} />
      <Row danger icon={<IcDelete size={16} />} label="删除" bind={act('memo.cardMenu.delete.confirm', () => { if (cur) deleteMemo(cur); })} />
    </Sheet>
  );
}
