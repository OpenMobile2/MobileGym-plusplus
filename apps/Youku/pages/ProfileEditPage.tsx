import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Img from '../components/Img';
import { useYoukuGestures } from '../hooks/useYoukuGestures';
import { useYoukuStore } from '../state';
import { IcBack, IcChevron, pad2 } from './me/meShared';
import { pickImages } from '@/os/albumBridge';
import { getFileUriAsync } from '@/os/FileSystemService';

const GENDER_OPTIONS: Array<{ id: 'male' | 'female' | 'secret'; label: string }> = [
  { id: 'male', label: '男' },
  { id: 'female', label: '女' },
  { id: 'secret', label: '保密' },
];
const YEARS = Array.from({ length: 41 }, (_, i) => 1980 + i); // 1980~2020
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

/**
 * spec 节点 me.profileEdit(route /me/profile/edit)—— 编辑资料页(s211)。
 * 草稿走 _temp.profileDraft;性别枚举弹层(qa:Q2)/生日日期滚轮(qa:Q1)由 URL search 驱动,back 关闭;
 * 保存 me.profileEdit.save.commit 回填个人主页/我的页并 back。
 */
export default function ProfileEditPage() {
  const { action, bindBack, back } = useYoukuGestures();
  const [sp, setSearchParams] = useSearchParams();
  const user = useYoukuStore((s) => s.user);
  const draft = useYoukuStore((s) => s._temp.profileDraft);
  const setTemp = useYoukuStore((s) => s.setTemp);
  const saveProfile = useYoukuStore((s) => s.saveProfile);

  // 进入页面初始化草稿(StrictMode 双调用幂等:null 时才写入)
  useEffect(() => {
    if (useYoukuStore.getState()._temp.profileDraft === null) {
      const u = useYoukuStore.getState().user;
      setTemp({ profileDraft: { nickname: u.nickname, gender: u.gender, birthday: u.birthday, bio: u.bio } });
    }
  }, [setTemp]);

  const d = draft ?? { nickname: user.nickname, gender: user.gender, birthday: user.birthday, bio: user.bio };
  const patch = (p: Partial<typeof d>) => setTemp({ profileDraft: { ...d, ...p } });

  const pick = sp.get('pick'); // gender | birthday(弹层 URL 驱动,back 关闭)
  const openPick = (v: 'gender' | 'birthday') =>
    setSearchParams((prev) => {
      prev.set('pick', v);
      return prev;
    });

  // 日期滚轮本地选择态
  const [by, setBy] = useState(1998);
  const [bm, setBm] = useState(6);
  const [bd, setBd] = useState(15);

  const rowCls = 'flex min-h-[64px] items-center border-b border-[#1F1F1F] px-4';

  return (
    <div className="relative flex h-full w-full flex-col bg-(--app-c-page-bg) pt-10 text-(--app-c-text-primary)">
      {/* 顶栏:返回 / 个人资料 / 保存 */}
      <div className="flex h-12 shrink-0 items-center px-3">
        <button {...bindBack()} aria-label="返回" className="flex h-9 w-9 cursor-pointer items-center justify-center border-none bg-transparent p-0 text-(--app-c-text-primary)">
          <IcBack size={24} strokeWidth={2.2} />
        </button>
        <span className="flex-1 text-center text-[18px] font-bold">个人资料</span>
        <button
          {...action('me.profileEdit.save.commit', () => {
            saveProfile({ nickname: d.nickname.trim() || user.nickname, gender: d.gender, birthday: d.birthday, bio: d.bio });
            back();
          })}
          className="w-9 cursor-pointer border-none bg-transparent p-0 text-[16px] text-(--app-c-text-primary)"
        >
          保存
        </button>
      </div>

      <div data-scroll-container="main" data-scroll-direction="vertical" className="min-h-0 flex-1 overflow-y-auto">
        {/* 头像行：系统相册选图 */}
        <div
          {...action('me.profileEdit.avatar.pick', () => {
            void pickImages({ multiple: false, maxSelect: 1 }).then(async (r) => {
              if (r.cancelled || !r.selected.length) return;
              const selected = r.selected[0];
              const avatarUri = selected.uri || (await getFileUriAsync(selected.path)) || '';
              if (!avatarUri) return;
              useYoukuStore.setState((st) => ({
                user: { ...st.user, avatar: avatarUri },
              }));
            });
          })}
          className={`${rowCls} cursor-pointer py-3`}
        >
          <span className="w-24 text-[16px]">头像</span>
          <Img src={user.avatar} label={user.nickname} ratio="square" className="h-16 w-16 rounded-full bg-[#DDDDDD] object-cover" />
        </div>

        {/* 昵称 */}
        <div className={rowCls}>
          <span className="w-24 text-[16px]">昵称</span>
          <input
            data-action="me.profileEdit.nickname.input"
            data-action-type="input"
            value={d.nickname}
            onChange={(e) => patch({ nickname: e.target.value })}
            maxLength={20}
            className="min-w-0 flex-1 border-none bg-transparent text-[16px] text-(--app-c-text-primary) outline-none placeholder:text-[#666666]"
            placeholder="填写昵称"
          />
        </div>

        {/* 性别(枚举弹层) */}
        <div onClick={() => openPick('gender')} className={`${rowCls} cursor-pointer`}>
          <span className="w-24 text-[16px]">性别</span>
          <span className="flex-1 text-[16px]">{d.gender || <span className="text-[#666666]">选择性别</span>}</span>
          <IcChevron size={17} className="text-[#666666]" />
        </div>

        {/* 生日(日期滚轮弹层) */}
        <div onClick={() => openPick('birthday')} className={`${rowCls} cursor-pointer`}>
          <span className="w-24 text-[16px]">生日</span>
          <span className="flex-1 text-[16px]">
            {d.birthday || <span className="text-[#999999]">完善生日信息</span>}
          </span>
          <IcChevron size={17} className="text-[#666666]" />
        </div>

        {/* 个人简介 */}
        <div className="px-4 pt-5">
          <div className="text-[16px]">个人简介</div>
          <textarea
            data-action="me.profileEdit.bio.input"
            data-action-type="input"
            value={d.bio}
            onChange={(e) => patch({ bio: e.target.value.slice(0, 400) })}
            placeholder="还差一句简介,有趣的灵魂就会被发现哟~"
            className="mt-3 h-40 w-full resize-none border-none bg-transparent text-[15px] leading-6 text-(--app-c-text-primary) outline-none placeholder:text-[#666666]"
          />
          <div className="text-right text-[13px] text-[#666666]">{d.bio.length}/400</div>
        </div>
      </div>

      {/* 底部提示条 */}
      <div className="shrink-0 px-3 pb-4" data-hide-on-keyboard>
        <div className="rounded-2xl bg-(--app-c-card-bg) px-4 py-3.5 text-[14px] leading-6 text-[#CCCCCC]">
          您可以选择填充上述个人信息(性别、生日),填写后将展示在个人主页以便他人更好的了解您,同时在生日当天有生日惊喜哦~
        </div>
      </div>

      {/* ---------------- 性别枚举弹层(qa:Q2,URL 驱动,取消=back) ---------------- */}
      {pick === 'gender' && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end">
          <div {...bindBack()} className="absolute inset-0 bg-black/60" />
          <div className="relative z-10 rounded-t-2xl bg-[#1E1E1E] pb-5">
            <div className="py-4 text-center text-[16px] font-bold">选择性别</div>
            {GENDER_OPTIONS.map((g) => {
              const bind =
                g.id === 'male'
                  ? action('me.profileEdit.gender.select.male', () => {
                      patch({ gender: '男' });
                      back();
                    })
                  : g.id === 'female'
                    ? action('me.profileEdit.gender.select.female', () => {
                        patch({ gender: '女' });
                        back();
                      })
                    : action('me.profileEdit.gender.select.secret', () => {
                        patch({ gender: '保密' });
                        back();
                      });
              return (
                <button
                  key={g.id}
                  {...bind}
                  className={`block w-full cursor-pointer border-none bg-transparent py-3.5 text-[16px] ${
                    d.gender === g.label ? 'text-[#0C7BFF]' : 'text-(--app-c-text-primary)'
                  }`}
                >
                  {g.label}
                </button>
              );
            })}
            <button {...bindBack()} className="mt-2 block w-full cursor-pointer border-none bg-transparent py-3.5 text-[16px] text-[#999999]">
              取消
            </button>
          </div>
        </div>
      )}

      {/* ---------------- 生日日期滚轮弹层(qa:Q1,确认回填 YYYY-MM-DD) ---------------- */}
      {pick === 'birthday' && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end">
          <div {...bindBack()} className="absolute inset-0 bg-black/60" />
          <div className="relative z-10 rounded-t-2xl bg-[#1E1E1E] pb-5">
            <div className="flex items-center px-4 py-3">
              <button {...bindBack()} className="cursor-pointer border-none bg-transparent p-0 text-[15px] text-[#999999]">
                取消
              </button>
              <span className="flex-1 text-center text-[16px] font-bold">选择生日</span>
              <button
                {...action(
                  'me.profileEdit.birthday.input',
                  () => {
                    patch({ birthday: `${by}-${pad2(bm)}-${pad2(bd)}` });
                    back();
                  },
                  { params: { value: `${by}-${pad2(bm)}-${pad2(bd)}` } },
                )}
                className="cursor-pointer border-none bg-transparent p-0 text-[15px] text-[#0C7BFF]"
              >
                确定
              </button>
            </div>
            <div className="flex gap-2 px-6">
              {/* 年/月/日 三列滚轮(点击选中高亮) */}
              <div className="h-44 flex-1 overflow-y-auto rounded-lg bg-[#181818]">
                {YEARS.map((y) => (
                  <button
                    key={y}
                    onClick={() => setBy(y)}
                    className={`block w-full cursor-pointer border-none bg-transparent py-2 text-center text-[15px] ${
                      by === y ? 'font-bold text-[#0C7BFF]' : 'text-[#CCCCCC]'
                    }`}
                  >
                    {y}年
                  </button>
                ))}
              </div>
              <div className="h-44 flex-1 overflow-y-auto rounded-lg bg-[#181818]">
                {MONTHS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setBm(m)}
                    className={`block w-full cursor-pointer border-none bg-transparent py-2 text-center text-[15px] ${
                      bm === m ? 'font-bold text-[#0C7BFF]' : 'text-[#CCCCCC]'
                    }`}
                  >
                    {m}月
                  </button>
                ))}
              </div>
              <div className="h-44 flex-1 overflow-y-auto rounded-lg bg-[#181818]">
                {DAYS.map((dd) => (
                  <button
                    key={dd}
                    onClick={() => setBd(dd)}
                    className={`block w-full cursor-pointer border-none bg-transparent py-2 text-center text-[15px] ${
                      bd === dd ? 'font-bold text-[#0C7BFF]' : 'text-[#CCCCCC]'
                    }`}
                  >
                    {dd}日
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
