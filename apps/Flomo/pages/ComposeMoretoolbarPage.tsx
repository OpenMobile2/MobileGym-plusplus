import React from 'react';
import { useFlomoStore } from '../state';
import { useFlomoGestures } from '../hooks/useFlomoGestures';
import { Sheet, Row } from '../components/Sheet';
import { IcHighlight, IcUnderline, IcMention, IcUndo, IcCamera, IcScan } from '../res/icons';

export default function ComposeMoretoolbarPage() {
  const { bindTap, back } = useFlomoGestures();
  const insertDraft = useFlomoStore((s) => s.insertDraft);
  const toast = useFlomoStore((s) => s.toast);
  return (
    <Sheet title="更多工具">
      <Row icon={<IcHighlight size={16} />} label="荧光笔"
        bind={bindTap({ kind: 'action', id: 'compose.moreToolbar.highlight.toggle' }, { onTrigger: () => { insertDraft('==高亮=='); back(); } })} />
      <Row icon={<IcUnderline size={16} />} label="下划线"
        bind={bindTap({ kind: 'action', id: 'compose.moreToolbar.underline.toggle' }, { onTrigger: () => { insertDraft('__下划线__'); back(); } })} />
      <Row icon={<IcMention size={16} />} label="@ 笔记联想"
        bind={bindTap('compose.moreToolbar.mention')} />
      <Row icon={<IcUndo size={16} />} label="撤销 / 重做"
        bind={bindTap({ kind: 'action', id: 'compose.moreToolbar.undo.do' }, { onTrigger: () => { toast('已撤销'); back(); } })} />
      <Row icon={<IcCamera size={16} />} label="拍照"
        bind={bindTap({ kind: 'action', id: 'compose.moreToolbar.camera.open' }, { onTrigger: () => { toast('该功能暂未开放'); back(); } })} />
      <Row icon={<IcScan size={16} />} label="扫描"
        bind={bindTap({ kind: 'action', id: 'compose.moreToolbar.scan.open' }, { onTrigger: () => { toast('该功能暂未开放'); back(); } })} />
    </Sheet>
  );
}
