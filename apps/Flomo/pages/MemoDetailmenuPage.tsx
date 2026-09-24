import React from 'react';
import { useFlomoStore } from '../state';
import { useFlomoGestures } from '../hooks/useFlomoGestures';
import { Sheet, Row } from '../components/Sheet';
import { IcPin, IcLink, IcAi, IcSetDate, IcDoc, IcHistory, IcDelete } from '../res/icons';

export default function MemoDetailmenuPage() {
  const { bindTap, back } = useFlomoGestures();
  const cur = useFlomoStore((s) => s.currentMemoId);
  const togglePin = useFlomoStore((s) => s.togglePin);
  const deleteMemo = useFlomoStore((s) => s.deleteMemo);
  const toast = useFlomoStore((s) => s.toast);

  const act = (id: string, fn: () => void) =>
    bindTap({ kind: 'action', id }, { onTrigger: () => { fn(); back(); } });

  return (
    <Sheet>
      <Row icon={<IcPin size={16} />} label="置顶" bind={act('memo.detailMenu.pin.toggle', () => { if (cur) togglePin(cur); })} />
      <Row icon={<IcLink size={16} />} label="复制链接" bind={act('memo.detailMenu.copylink.do', () => toast('已复制链接'))} />
      <Row icon={<IcAi size={16} />} label="AI 调整" bind={bindTap('ai.insight.adjust')} />
      <Row icon={<IcSetDate size={16} />} label="设定日期" bind={act('memo.detailMenu.setdate.open', () => toast('该功能暂未开放'))} />
      <Row icon={<IcDoc size={16} />} label="相关笔记" bind={bindTap('memo.detailMenu.related')} />
      <Row icon={<IcHistory size={16} />} label="历史版本" bind={act('memo.detailMenu.history.open', () => toast('该功能暂未开放'))} />
      <div className="h-px mx-5 my-1" style={{ background: '#F0F0F0' }} />
      <Row danger icon={<IcDelete size={16} />} label="删除" bind={act('memo.detailMenu.delete.do', () => { if (cur) deleteMemo(cur); back(); })} />
    </Sheet>
  );
}
