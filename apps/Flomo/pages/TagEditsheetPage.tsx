import React, { useEffect, useState } from 'react';
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
  const [name, setName] = useState('');
  useEffect(() => setName(cur?.name ?? ''), [cur?.id, cur?.name]);

  const act = (id: string, fn: () => void) =>
    bindTap({ kind: 'action', id }, { onTrigger: () => { fn(); back(); } });

  return (
    <Sheet title={cur ? cur.name : '标签操作'}>
      <div className="px-5 py-2 flex items-center gap-2">
        <IcEdit size={16} />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="新标签名称"
          className="flex-1 h-9 px-3 rounded-lg border bg-transparent outline-none"
        />
        <button
          {...act('tag.editSheet.rename.do', () => {
            const next = name.trim();
            if (currentTagId && next) renameTag(currentTagId, next);
            toast(next ? '已重命名' : '标签名不能为空');
          })}
          className="px-3 h-9 rounded-lg border-none cursor-pointer"
        >保存</button>
      </div>
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
