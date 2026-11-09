import React, { useState } from 'react';
import { useAppStrings } from '@/os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { useTbsgGestures } from '../hooks/useTbsgGestures';
import { useTbsgStore } from '../state';
import { AppImg, TopBar, showToast } from '../components/common';
import { IcRight } from '../res/icons';

const AVATAR_OPTIONS = [1, 2, 3, 4, 5, 6].map((n) => `/@app-assets/TaobaoShangou/avatars/u_rev${n}.jpg`);

/** 个人资料编辑页(spec settings.profile,推断页) */
export default function ProfilePage() {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap, bindBack } = useTbsgGestures();
  const user = useTbsgStore((st) => st.user);
  const updateProfile = useTbsgStore((st) => st.updateProfile);

  const [nickname, setNickname] = useState(user.nickname);
  const [signature, setSignature] = useState(user.signature);
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="flex flex-col h-full bg-[#F3F6F8]">
      <TopBar title="个人资料" titleLeft />
      <div data-scroll-container="main" data-scroll-direction="vertical" className="flex-1 overflow-y-auto">
        <div className="bg-white">
          {/* 头像 */}
          <button
            {...bindTap<HTMLButtonElement>(
              { kind: 'action', id: 'profile.avatar.pick' },
              { onTrigger: () => setPickerOpen((v) => !v) },
            )}
            className="w-full flex items-center px-4 py-4 bg-transparent border-x-0 border-t-0 border-b border-solid border-[#F5F5F5] cursor-pointer text-left"
          >
            <span className="text-[16px] text-[#1A1A1A]">头像</span>
            <div className="flex-1" />
            <AppImg src={user.avatar} className="w-13 h-13 rounded-full object-cover" />
            <IcRight size={16} className="text-[#BBBBBB] ml-1" />
          </button>
          {pickerOpen && (
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[#F5F5F5] overflow-x-auto" data-scroll-container="avatars" data-scroll-direction="horizontal">
              {AVATAR_OPTIONS.map((src) => (
                <button
                  key={src}
                  {...bindTap<HTMLButtonElement>(
                    { kind: 'action', id: 'profile.avatar.pick' },
                    {
                      params: { avatar: src },
                      onTrigger: () => {
                        updateProfile({ avatar: src });
                        setPickerOpen(false);
                        showToast('头像已更新');
                      },
                    },
                  )}
                  className={`p-0 bg-transparent rounded-full cursor-pointer shrink-0 border-2 border-solid ${
                    user.avatar === src ? 'border-[#ED6C2C]' : 'border-transparent'
                  }`}
                >
                  <AppImg src={src} className="w-12 h-12 rounded-full object-cover block" />
                </button>
              ))}
            </div>
          )}

          {/* 昵称 */}
          <div className="flex items-center px-4 py-4 border-b border-[#F5F5F5]">
            <span className="w-20 text-[16px] text-[#1A1A1A] shrink-0">昵称</span>
            <input
              {...bindTap<HTMLInputElement>(
                { kind: 'action', id: 'profile.edit.input' },
                { onTrigger: () => {} },
              )}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="填写昵称"
              className="flex-1 min-w-0 bg-transparent border-none outline-none text-right text-[16px] text-[#1A1A1A] placeholder:text-[#BBBBBB]"
            />
          </div>

          {/* 个性签名 */}
          <div className="flex items-center px-4 py-4">
            <span className="w-20 text-[16px] text-[#1A1A1A] shrink-0">个性签名</span>
            <input
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="还没有个性签名哦"
              className="flex-1 min-w-0 bg-transparent border-none outline-none text-right text-[16px] text-[#1A1A1A] placeholder:text-[#BBBBBB]"
            />
          </div>
        </div>

        {/* 保存 */}
        <div className="px-4 mt-6">
          <button
            {...bindBack<HTMLButtonElement>({
              beforeTrigger: () => {
                updateProfile({ nickname, signature });
                showToast('已保存');
              },
            })}
            className="w-full h-12 rounded-full bg-[#ED6C2C] text-white text-[16px] font-semibold border-none cursor-pointer"
          >
            {s.save}
          </button>
        </div>
      </div>
    </div>
  );
}
