import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { useDianpingGestures } from '../hooks/useDianpingGestures';
import { useDianpingStore } from '../state';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcBack, IcChevronRight, IcPear } from '../res/icons';
import type { UserProfile } from '../types';

type EditableField = 'nickname' | 'gender' | 'bio' | 'birthday' | 'hometown' | 'residence';
const FIELD_LABEL: Record<EditableField, string> = {
  nickname: '昵称',
  gender: '性别',
  bio: '个人介绍',
  birthday: '生日',
  hometown: '家乡',
  residence: '常居地',
};
const EDITABLE: EditableField[] = ['nickname', 'gender', 'bio', 'birthday', 'hometown', 'residence'];

export default function ProfileEditPage() {
  const s = useAppStrings(strings, stringsEn);
  const { bindBack, bindTap, action, back } = useDianpingGestures();
  const showToast = useDianpingStore((st) => st.showToast);
  const userProfile = useDianpingStore((st) => st.userProfile);
  const updateUserProfile = useDianpingStore((st) => st.updateUserProfile);
  const [sp] = useSearchParams();
  const editing = sp.get('field') as EditableField | null;
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (editing) setDraft(userProfile[editing] ?? '');
  }, [editing, userProfile]);

  const rows: { key: string; label: string; value?: string; link?: boolean; avatar?: boolean; bg?: boolean; field?: EditableField }[][] = [
    [
      { key: 'avatar', label: '头像', avatar: true },
      { key: 'bg', label: '背景', bg: true },
      { key: 'nickname', label: '昵称', value: userProfile.nickname, field: 'nickname' },
      { key: 'gender', label: '性别', value: userProfile.gender, field: 'gender' },
      { key: 'bio', label: '个人介绍', value: userProfile.bio, field: 'bio' },
    ],
    [
      { key: 'birthday', label: '生日', value: userProfile.birthday, field: 'birthday' },
      { key: 'hometown', label: '家乡', value: userProfile.hometown, field: 'hometown' },
      { key: 'residence', label: '常居地', value: userProfile.residence, field: 'residence' },
      { key: 'email', label: '邮箱地址', value: '添加', link: true },
      { key: 'addr', label: '收货地址', value: '修改/添加', link: true },
    ],
    [
      { key: 'level', label: '我的等级', value: 'Lv 1' },
      { key: 'vip', label: '会员身份', value: '成为VIP 尊享特权', link: true },
      { key: 'deco', label: '头像挂件', value: '未设置' },
    ],
  ];

  const save = () => {
    if (!editing) return;
    const v = draft.trim();
    if (v) updateUserProfile({ [editing]: v } as Partial<UserProfile>);
    showToast('已保存');
    back();
  };

  return (
    <div className="relative flex h-full flex-col bg-[#F5F5F5]" data-status-bar-foreground="dark">
      <div className="relative flex h-11 items-center justify-center bg-white px-1">
        <button type="button" className="absolute left-1 border-none bg-transparent p-1.5 cursor-pointer" {...bindBack()}>
          <IcBack size={22} />
        </button>
        <div className="text-[16px] font-semibold text-[#222]">个人资料</div>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="profile-edit" data-scroll-direction="vertical">
        {rows.map((group, gi) => (
          <div key={gi} className="mt-2 bg-white">
            {group.map((row) => (
              <button
                key={row.key}
                type="button"
                className="flex w-full items-center justify-between border-none border-b border-[#F5F5F5] bg-transparent px-4 py-3.5 text-left last:border-none cursor-pointer"
                {...(row.field
                  ? bindTap('profileedit.edit-open', { params: { field: row.field } })
                  : action('profileedit.item.open.disabled', () => showToast(s.notOpen)))}
              >
                <span className="text-[15px] text-[#222]">{row.label}</span>
                <span className="flex items-center gap-1.5">
                  {row.avatar ? (
                    <IcPear size={32} className="rounded-full" />
                  ) : row.bg ? (
                    <span className="h-6 w-12 rounded bg-gradient-to-r from-[#FFD9C0] to-[#FFB499]" />
                  ) : (
                    <span className={`text-[14px] ${row.link ? 'text-[#3A6EA5]' : 'text-[#999]'}`}>{row.value}</span>
                  )}
                  <IcChevronRight size={14} className="text-[#CCC]" />
                </span>
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* 编辑弹层 */}
      {editing && EDITABLE.includes(editing) ? (
        <div className="absolute inset-0 z-20 flex flex-col justify-end">
          <button type="button" aria-label="close" className="absolute inset-0 border-none bg-black/40 cursor-pointer" {...bindBack()} />
          <div className="relative rounded-t-[16px] bg-white p-4">
            <div className="mb-3 text-center text-[15px] font-semibold text-[#222]">修改{FIELD_LABEL[editing]}</div>
            {editing === 'gender' ? (
              <div className="flex gap-2">
                {['女', '男', '保密'].map((g) => (
                  <button
                    key={g}
                    type="button"
                    className={`flex-1 rounded-full border py-2 text-[14px] cursor-pointer ${
                      draft === g ? 'border-[#FF6633] bg-[#FFF1EA] text-[#FF6633]' : 'border-[#EEE] bg-white text-[#666]'
                    }`}
                    {...action('profileedit.gender.select.target', () => setDraft(g), { params: { target: g } })}
                  >
                    {g}
                  </button>
                ))}
              </div>
            ) : (
              <input
                className="w-full rounded-[8px] border border-[#EEE] bg-[#FAFAFA] px-3 py-2.5 text-[14px] outline-none"
                value={draft}
                placeholder={`请输入${FIELD_LABEL[editing]}`}
                onChange={(e) => setDraft(e.target.value)}
                data-keep-keyboard="true"
              />
            )}
            <button
              type="button"
              className="mt-4 w-full rounded-full border-none bg-[#FF6633] py-3 text-[15px] font-semibold text-white cursor-pointer"
              {...action('profileedit.save.action', save)}
            >
              保存
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
