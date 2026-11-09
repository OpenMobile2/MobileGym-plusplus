import React from 'react';
import { useFlomoStore } from '../state';
import { useFlomoGestures } from '../hooks/useFlomoGestures';
import { Sheet, Row } from '../components/Sheet';
import { IcTag } from '../res/icons';

export default function ComposeTagsuggestPage() {
  const { bindTap, back } = useFlomoGestures();
  const tags = useFlomoStore((s) => s.tags);
  const insertDraft = useFlomoStore((s) => s.insertDraft);
  return (
    <Sheet title="选择标签">
      <div className="max-h-72 overflow-y-auto">
        {tags.map((t) => (
          <Row
            key={t.id}
            icon={<IcTag size={16} />}
            label={`#${t.name}`}
            bind={bindTap({ kind: 'action', id: 'compose.tagSuggest.select.tag' }, {
              onTrigger: () => { insertDraft(`#${t.name} `); back(); },
            })}
          />
        ))}
        <Row
          icon={<IcTag size={16} />}
          label="新建标签…"
          bind={bindTap({ kind: 'action', id: 'compose.tagSuggest.create.new' }, {
            onTrigger: () => { insertDraft('#新标签 '); back(); },
          })}
        />
      </div>
    </Sheet>
  );
}
