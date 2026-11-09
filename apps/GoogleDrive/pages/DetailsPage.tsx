// apps/GoogleDrive/pages/DetailsPage.tsx
// apps/GoogleDrive/pages/otherPages.tsx — Gemini / 目标位置选择 / 详情 / 上传确认 / 设置
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { GD } from '../res/colors';
import { DIM } from '../res/dimens';
import { IcClose, IcGlobe } from '../res/icons';
import { useGoogleDriveGestures } from '../hooks/useGoogleDriveGestures';
import { useGoogleDriveStrings } from '../hooks/useGoogleDriveStrings';
import { useGoogleDriveStore } from '../state';
import { formatSize, useDateFormat, ItemIcon } from '../components/common';

// ═══════════════════════════════════════════════════════════
// 详细信息和活动（IMG_2295）—— 独立全屏页，不是底部弹层
// ═══════════════════════════════════════════════════════════
export const DetailsPage: React.FC = () => {
  const s = useGoogleDriveStrings();
  const { id = '' } = useParams();
  const { bindBack, bindTap } = useGoogleDriveGestures();
  const items = useGoogleDriveStore(st => st.items);
  const contacts = useGoogleDriveStore(st => st.contacts);
  const fmt = useDateFormat();
  const item = items[id];
  if (!item) return null;

  const typeLabel: Record<string, string> = {
    folder: s.filter_type_folders, doc: s.create_gdoc, sheet: s.create_gsheet,
    slide: s.create_gslide, pdf: 'PDF', image: s.filter_type_photos, other: s.filter_type_documents,
  };
  const parent = item.parentId ? items[item.parentId] : null;
  const Field: React.FC<{ label: string; value: string; note?: string }> = ({ label, value, note }) => (
    <div className="mb-5">
      <div className="text-[12px] mb-1" style={{ color: GD.textSecondary }}>{label}</div>
      <div className="text-[15px]" style={{ color: GD.text }}>
        {value}
        {note && <span className="text-[13px] ml-2" style={{ color: GD.textSecondary }}>{note}</span>}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="pt-10" />
      <div className="shrink-0 flex items-center" style={{ height: DIM.topBarH, paddingLeft: 4, paddingRight: 8 }}>
        <button {...bindBack()} className="w-11 h-11 flex items-center justify-center" aria-label={s.a11y_close}>
          <IcClose size={22} color={GD.text} />
        </button>
        <ItemIcon item={item} size={20} />
        <span className="text-[16px] flex-1 truncate ml-2" style={{ color: GD.text }}>{item.name}</span>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pt-2" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 顶部两列属性栅格 */}
        <div className="grid grid-cols-2">
          <Field label={s.details_type} value={typeLabel[item.kind] ?? item.kind} />
          <Field label={s.details_location} value={item.ownerName ? '--' : (parent?.name ?? s.move_my_drive)} />
        </div>
        <Field label={s.details_size} value={formatSize(item.size)} />
        <Field
          label={s.details_storage_used}
          value={formatSize(item.size)}
          note={item.ownerName ? s.sub_owned_by_other : undefined}
        />
        <Field label={s.details_created} value={fmt(item.createdAt)} />
        <Field label={s.details_modified} value={fmt(item.modifiedAt)} />

        <div className="pt-2" style={{ borderTop: `1px solid ${GD.divider}` }}>
          <div className="text-[15px] py-4" style={{ color: GD.text }}>{s.details_manage_access}</div>
          <button
            {...bindTap('googledrive.details.access.open', { params: { id } })}
            className="flex items-center gap-3 pb-4"
          >
            <span className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[13px]" style={{ background: contacts[0]?.color ?? GD.blue }}>
              {(item.ownerName ?? contacts[0]?.name ?? '?').slice(0, 1)}
            </span>
            <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#E6F4EA' }}>
              <IcGlobe size={18} color={GD.typeSheet} />
            </span>
          </button>
        </div>

        <div className="pt-2" style={{ borderTop: `1px solid ${GD.divider}` }}>
          <div className="text-[15px] py-4" style={{ color: GD.text }}>{s.details_activity}</div>
          {(item.activity ?? []).map((a, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <span className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[13px]" style={{ background: contacts[i % contacts.length]?.color ?? GD.blue }}>
                {a.who.slice(0, 1)}
              </span>
              <span className="min-w-0">
                <span className="block text-[14px] truncate" style={{ color: GD.text }}>{a.who}</span>
                <span className="block text-[12px]" style={{ color: GD.textSecondary }}>
                  {s[a.whatKey as keyof typeof s]} · {fmt(a.at)}
                </span>
              </span>
            </div>
          ))}
          <div className="h-8" />
        </div>
      </div>
    </div>
  );
};
