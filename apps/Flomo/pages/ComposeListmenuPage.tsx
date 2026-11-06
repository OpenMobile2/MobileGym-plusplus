import React from 'react';
import { useFlomoStore } from '../state';
import { useFlomoGestures } from '../hooks/useFlomoGestures';
import { Sheet, Row } from '../components/Sheet';
import { IcList } from '../res/icons';

export default function ComposeListmenuPage() {
  const { bindTap, back } = useFlomoGestures();
  const insertDraft = useFlomoStore((s) => s.insertDraft);
  const draft = useFlomoStore((s) => s.composeDraft);
  return (
    <Sheet title="列表样式">
      <Row
        icon={<IcList size={16} />}
        label="无序列表"
        bind={bindTap({ kind: 'action', id: 'compose.listMenu.select.bullet' }, {
          onTrigger: () => { insertDraft(draft ? '\n- ' : '- '); back(); },
        })}
      />
      <Row
        icon={<IcList size={16} />}
        label="有序列表"
        bind={bindTap({ kind: 'action', id: 'compose.listMenu.select.ordered' }, {
          onTrigger: () => { insertDraft(draft ? '\n1. ' : '1. '); back(); },
        })}
      />
    </Sheet>
  );
}
