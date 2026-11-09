import React from 'react';
import { useI18n } from '../../i18n';
import { ATTACH_ROWS, ATTACH_GALLERY } from '../../constants';
import { NEUTRAL } from '../../res/colors';
import { IconRenderer, IcCamera } from '../../res/icons';
import Sheet from '../Sheet';
import type { Bind } from '../../types';

export type AttachBinds = {
  camera: Bind;
  photo: (id: string) => Bind;
  row: (id: string) => Bind;
};

/** 输入栏 ＋ 的附件弹层：相册横排 + 功能行（IMG_2437 外推补齐） */
const AttachSheet: React.FC<{ binds: AttachBinds }> = ({ binds }) => {
  const { t } = useI18n();

  return (
    <Sheet>
      <div
        className="flex gap-2 overflow-x-auto px-4 pb-3 pt-1"
        data-scroll-container="gallery"
        data-scroll-direction="horizontal"
      >
        <button
          {...binds.camera}
          className="flex h-[86px] w-[86px] flex-shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-[#DDDDDD] bg-white"
          style={{ color: NEUTRAL.textSecondary }}
        >
          <IcCamera size={22} />
          <span className="text-[12px]">{t('attach.camera')}</span>
        </button>
        {ATTACH_GALLERY.map((g) => (
          <button
            key={g.id}
            {...binds.photo(g.id)}
            aria-label={`photo-${g.id}`}
            className="h-[86px] w-[86px] flex-shrink-0 rounded-lg border-none"
            style={{ backgroundColor: g.color }}
          />
        ))}
      </div>

      <div className="border-t border-[#EAEAEA] pt-1">
        {ATTACH_ROWS.map((r) => (
          <button
            key={r.id}
            {...binds.row(r.id)}
            className="flex w-full items-center gap-3.5 border-none bg-transparent px-4 py-3 text-left"
            style={{ color: NEUTRAL.textPrimary }}
          >
            <IconRenderer name={r.icon} size={19} />
            <span className="text-[16px]">{t(r.labelKey)}</span>
          </button>
        ))}
      </div>
    </Sheet>
  );
};

export default AttachSheet;
