// apps/GoogleDrive/pages/AccessPage.tsx — 管理访问权限
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { GD } from '../res/colors';
import { DIM } from '../res/dimens';
import { IcClose, IcGlobe, IcCheck, IcCopyLink, IcChevronDown, IcPerson } from '../res/icons';
import { useGoogleDriveGestures } from '../hooks/useGoogleDriveGestures';
import { useGoogleDriveStrings } from '../hooks/useGoogleDriveStrings';
import { useGoogleDriveStore } from '../state';
import { ItemIcon, showToast } from '../components/common';
import { buildShareLink } from '../utils/shareLink';
import type { AccessRole } from '../types';

const ROLES: AccessRole[] = ['viewer', 'commenter', 'editor'];

export const AccessPage: React.FC = () => {
  const s = useGoogleDriveStrings();
  const { id = '' } = useParams();
  const { bindBack, bindTap } = useGoogleDriveGestures();
  const items = useGoogleDriveStore(st => st.items);
  const contacts = useGoogleDriveStore(st => st.contacts);
  const user = useGoogleDriveStore(st => st.user);
  const setLinkAccess = useGoogleDriveStore(st => st.setLinkAccess);
  const ensureAccessDefaults = useGoogleDriveStore(st => st.ensureAccessDefaults);

  useEffect(() => {
    if (id) ensureAccessDefaults(id);
  }, [id, ensureAccessDefaults]);

  const item = items[id];
  if (!item) return null;

  const linkAccess = item.linkAccess ?? 'restricted';
  const linkRole = item.linkRole ?? 'viewer';
  const shareLink = item.shareLink || buildShareLink(id);
  const collaborators = item.collaborators ?? [];
  const ownerLabel = item.ownerName ?? user.name;
  const ownerContact = contacts.find(c => c.name === ownerLabel);
  const roleLabel = (r: AccessRole) => (
    r === 'viewer' ? s.access_role_viewer : r === 'commenter' ? s.access_role_commenter : s.access_role_editor
  );

  const copyLink = () => {
    window.__OS__?.clipboard?.copyText?.(shareLink, 'googledrive');
    showToast(s.toast_link_copied);
  };

  return (
    <div className="relative flex flex-col h-full bg-white">
      <div className="pt-10" />
      <div className="shrink-0 flex items-center" style={{ height: DIM.topBarH, paddingLeft: 4, paddingRight: 8 }}>
        <button {...bindBack()} className="w-11 h-11 flex items-center justify-center" aria-label={s.a11y_close}>
          <IcClose size={22} color={GD.text} />
        </button>
        <ItemIcon item={item} size={20} />
        <span className="text-[16px] flex-1 truncate ml-2" style={{ color: GD.text }}>{s.menu_manage_access}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="text-[13px] py-3" style={{ color: GD.textSecondary }}>{item.name}</div>

        {/* 有权访问的人（所有者 + 协作者） */}
        <div className="pb-2 text-[13px]" style={{ color: GD.textSecondary }}>{s.access_people}</div>

        <div className="flex items-center gap-3 py-2.5">
          <span
            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[14px]"
            style={{ background: ownerContact?.color ?? user.avatarColor }}
          >
            {ownerLabel.slice(0, 1)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] truncate" style={{ color: GD.text }}>{ownerLabel}</div>
            <div className="text-[12px]" style={{ color: GD.textSecondary }}>{s.access_owner}</div>
          </div>
        </div>

        {collaborators.map(col => {
          const c = contacts.find(x => x.id === col.contactId);
          if (!c) return null;
          return (
            <button
              key={c.id}
              {...bindTap('googledrive.access.person.open', { params: { id, person: c.id } })}
              className="w-full flex items-center gap-3 py-2.5 text-left active:bg-black/5 rounded-lg"
            >
              <span
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[14px]"
                style={{ background: c.color }}
              >
                {c.name.slice(0, 1)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] truncate" style={{ color: GD.text }}>{c.name}</div>
                <div className="text-[12px] truncate" style={{ color: GD.textSecondary }}>{c.email}</div>
              </div>
              <span className="text-[13px] shrink-0 flex items-center gap-0.5" style={{ color: GD.blue }}>
                {roleLabel(col.role)}
                <IcChevronDown size={16} color={GD.blue} />
              </span>
            </button>
          );
        })}

        {collaborators.length === 0 && (
          <div className="flex items-center gap-3 py-2.5 opacity-60">
            <span className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: GD.divider }}>
              <IcPerson size={20} color={GD.textSecondary} />
            </span>
            <div className="text-[13px]" style={{ color: GD.textSecondary }}>{s.access_people_empty}</div>
          </div>
        )}

        {/* 常规访问：两项择一，不再点一下就来回切换 */}
        <div className="pt-5 pb-2 text-[13px]" style={{ color: GD.textSecondary }}>{s.access_general}</div>

        <button
          data-action="googledrive.access.link.toggle"
          data-action-params={JSON.stringify({ item: id, mode: 'restricted' })}
          onClick={() => {
            // 默认数据常无 linkAccess 字段，UI 用 ?? 'restricted' 显示勾选；
            // 不能用显示值做 early-return，否则首点「受限」会像死点击。
            setLinkAccess(id, 'restricted', linkRole);
            showToast(s.toast_link_restricted);
          }}
          className="w-full flex items-center gap-3 py-3 text-left active:bg-black/5 rounded-lg"
        >
          <span className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: GD.searchBg }}>
            <IcPerson size={20} color={GD.textSecondary} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[15px]" style={{ color: GD.text }}>{s.access_restricted}</div>
            <div className="text-[12px]" style={{ color: GD.textSecondary }}>{s.access_restricted_desc}</div>
          </div>
          {linkAccess === 'restricted' && <IcCheck size={18} color={GD.blue} />}
        </button>

        <button
          data-action="googledrive.access.link.toggle"
          data-action-params={JSON.stringify({ item: id, mode: 'anyone' })}
          onClick={() => {
            setLinkAccess(id, 'anyone', linkRole);
            showToast(s.toast_link_anyone);
          }}
          className="w-full flex items-center gap-3 py-3 text-left active:bg-black/5 rounded-lg"
        >
          <span className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#E6F4EA' }}>
            <IcGlobe size={20} color={GD.typeSheet} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[15px]" style={{ color: GD.text }}>{s.access_anyone}</div>
            <div className="text-[12px]" style={{ color: GD.textSecondary }}>{roleLabel(linkRole)}</div>
          </div>
          {linkAccess === 'anyone' && <IcCheck size={18} color={GD.blue} />}
        </button>

        {/* 任何人有链接：专属链接 + 链接角色，始终可见（在选中 anyone 时） */}
        {linkAccess === 'anyone' && (
          <div className="mt-1 mb-4 rounded-xl px-3 py-3" style={{ background: GD.blueSurface }}>
            <div className="text-[12px] mb-1.5" style={{ color: GD.textSecondary }}>{s.access_link_label}</div>
            <div className="flex items-start gap-2 mb-3">
              <div
                className="flex-1 text-[13px] break-all leading-snug select-text"
                style={{ color: GD.blue }}
                data-action="googledrive.access.link.display"
                data-action-params={JSON.stringify({ item: id, link: shareLink })}
              >
                {shareLink}
              </div>
              <button
                data-action="googledrive.access.link.copy"
                data-action-params={JSON.stringify({ item: id })}
                onClick={copyLink}
                className="shrink-0 h-9 px-3 rounded-full flex items-center gap-1 text-[13px] active:bg-black/5"
                style={{ background: '#fff', color: GD.blue, border: `1px solid ${GD.divider}` }}
                aria-label={s.access_copy_link}
              >
                <IcCopyLink size={16} color={GD.blue} />
                {s.access_copy_link}
              </button>
            </div>

            <div className="text-[12px] mb-1" style={{ color: GD.textSecondary }}>{s.access_link_role}</div>
            <div className="flex flex-col gap-0.5">
              {ROLES.map(r => (
                <button
                  key={r}
                  data-action="googledrive.access.select.role"
                  data-action-params={JSON.stringify({ item: id, role: r })}
                  onClick={() => { setLinkAccess(id, 'anyone', r); showToast(s.toast_role_updated); }}
                  className="w-full flex items-center gap-3 h-10 px-2 rounded-lg text-left active:bg-black/5"
                >
                  <span className="w-5">{linkRole === r && <IcCheck size={18} color={GD.blue} />}</span>
                  <span className="text-[14px]" style={{ color: linkRole === r ? GD.blue : GD.text }}>{roleLabel(r)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="h-10" />
      </div>
    </div>
  );
};
