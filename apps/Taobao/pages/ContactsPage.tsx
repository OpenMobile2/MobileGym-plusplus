import React from 'react';
import { useStrings } from '../hooks/useStrings';
import { TopBar, EmptyState } from '../components/ui';
import { IcUsers, IcComment } from '../res/icons';

/** 通讯录(spec: message.contacts,IMG_8715,P2 展示页) */
export default function ContactsPage() {
  const s = useStrings();
  return (
    <div className="flex flex-col h-full bg-app-bg">
      <TopBar title={s.contactsTitle} rightContent={<IcUsers size={18} className="text-app-text" />} />
      <div className="flex-1 overflow-y-auto px-3">
        <div className="flex gap-2 mt-2">
          <div className="flex-1 bg-app-surface rounded-xl py-3 flex items-center justify-center gap-1.5 text-[14px]">
            <IcUsers size={17} />{s.familyAccountLabel}
          </div>
          <div className="flex-1 bg-app-surface rounded-xl py-3 flex items-center justify-center gap-1.5 text-[14px]">
            <IcComment size={17} />{s.myGroupChatsLabel}
          </div>
        </div>
        <div className="flex justify-between items-center mt-4 px-1">
          <span className="text-[15px] font-semibold">{s.newFriendsLabel}</span>
          <span className="text-[12px] text-app-text-muted">{s.contactsNewFriendsCount}</span>
        </div>
        <div className="bg-[#F0F0F0] rounded-lg px-3 py-2.5 mt-2 text-[12px] text-app-text-muted">
          {s.contactsPrivacyPrefix}<span className="text-[#FF5000]">{s.contactsPrivacyHighlight}</span>{s.contactsPrivacySuffix}
        </div>
        <div className="flex justify-between items-center mt-4 px-1">
          <span className="text-[15px] font-semibold">{s.myFriendsLabel}</span>
          <span className="text-app-text-muted">›</span>
        </div>
        <EmptyState text={s.noFriendsText} hint={s.addFriendHint} />
        <div className="flex justify-center">
          <button className="text-[14px] rounded-full border border-[#DDDDDD] bg-app-surface px-6 py-2 cursor-pointer">{s.goAddLabel}</button>
        </div>
      </div>
    </div>
  );
}
