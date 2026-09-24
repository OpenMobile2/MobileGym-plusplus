import React from 'react';
import { useFlomoStore } from '../state';
import { useFlomoGestures } from '../hooks/useFlomoGestures';
import { Sheet, Row } from '../components/Sheet';
import { IcEdit, IcDelete } from '../res/icons';

export default function TagEditsheetPage() {
  const { bindTap, back } = useFlomoGestures();
  const tags = useFlomoStore((s) => s.tags);
  const currentTagId = useFlomoStore((s) => s.currentTagId);
  const renameTag = useFlomoStore((s) => s.renameTag);
  const deleteTag = useFlomoStore((s) => s.deleteTag);
  const toast = useFlomoStore((s) => s.toast);

  const cur = tags.find((t) => t.id === currentTagId);

  const act = (id: string, fn: () => void) =>
    bindTap({ kind: 'action', id }, { onTrigger: () => { fn(); back(); } });

  return (
    <Sheet title={cur ? cur.name : '标签操作'}>
      <Row
        icon={<IcEdit size={16} />}
        label="重命名"
        bind={act('tag.editSheet.rename.do', () => {
          if (currentTagId) renameTag(currentTagId, `${cur?.name ?? '标签'}·改`);
          toast('已重命名');
        })}
      />
      <div className="h-px mx-5 my-1" style={{ background: '#F0F0F0' }} />
      <Row
        danger
        icon={<IcDelete size={16} />}
        label="删除标签(仅从笔记移除)"
        bind={act('tag.editSheet.delete.do', () => {
          if (currentTagId) deleteTag(currentTagId, false);
          toast('已移除标签');
        })}
      />
    </Sheet>
  );
}
