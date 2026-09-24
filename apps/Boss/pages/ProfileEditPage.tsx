import React, { useState } from 'react';
import { useBossGestures } from '../hooks/useBossGestures';
import { useBossStore } from '../state';
import { PageHeader, PrimaryButton } from '../components/common';
import { IcChevronRight, IcPlus } from '../res/icons';

const INDUSTRIES = ['互联网', '人工智能', '计算机软件', '教育培训', '金融', '医疗健康'];
const CITIES = ['上海', '北京', '深圳', '杭州', '广州', '成都'];
const YEARS = ['2000年', '2001年', '2002年', '2003年', '2004年'];

/** 编辑个人资料(IMG_8450/8451) */
const ProfileEditPage: React.FC = () => {
  const { action, back } = useBossGestures();
  const store = useBossStore();
  const user = useBossStore((s) => s.user);
  const [nick, setNick] = useState(user.communityNick);
  const [intro, setIntro] = useState(user.intro);
  const [picker, setPicker] = useState<{ title: string; options: string[]; actionId: string } | null>(null);
  const [picked, setPicked] = useState<Record<string, string>>({
    birthday: user.birthday,
    industry: user.industry,
    workCity: user.workCity,
    tags: user.tags,
  });

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader />
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="text-[24px] font-bold text-gray-900">编辑个人资料</div>
        <div className="mt-1 text-[13px] text-gray-500">完善个人资料,让BOSS和牛人更好地了解你</div>

        <div className="mt-5 text-[17px] font-bold text-gray-900">基本资料</div>
        <div className="mt-3 border-b border-gray-100 pb-3">
          <div className="text-[13px] text-gray-500">社区昵称</div>
          <input
            {...({ 'data-action': 'profileedit.nickname.input', 'data-action-type': 'input' } as object)}
            data-keep-keyboard="true"
            value={nick}
            onChange={(e) => setNick(e.target.value)}
            placeholder="添加社区昵称"
            className="mt-1 w-full bg-transparent text-[17px] outline-none placeholder:text-gray-300"
          />
        </div>
        <div className="border-b border-gray-100 py-3">
          <div className="flex items-center justify-between">
            <span>
              <span className="block text-[13px] text-gray-500">职业经验</span>
              <span className="mt-1 block text-[17px] text-gray-900">算法工程师 · &lt;1年</span>
            </span>
            <IcChevronRight size={17} className="text-gray-300" />
          </div>
        </div>
        <div className="border-b border-gray-100 py-3">
          <div className="text-[13px] text-gray-500">自我介绍</div>
          <textarea
            {...({ 'data-action': 'profileedit.intro.input', 'data-action-type': 'input' } as object)}
            data-keep-keyboard="true"
            value={intro}
            onChange={(e) => setIntro(e.target.value)}
            placeholder="添加自我介绍"
            className="mt-1 h-16 w-full resize-none bg-transparent text-[17px] outline-none placeholder:text-gray-300"
          />
        </div>
        {[
          { label: '星座', field: 'birthday', placeholder: '选择出生日期', options: YEARS, actionId: 'profileedit.select.birthday' },
          { label: '行业', field: 'industry', placeholder: '选择工作行业', options: INDUSTRIES, actionId: 'profileedit.select.picker' },
          { label: '工作地点', field: 'workCity', placeholder: '选择工作地点', options: CITIES, actionId: 'profileedit.select.picker' },
          { label: '个人标签', field: 'tags', placeholder: '添加个人标签', options: ['技术宅', '爱折腾', '早起党', '健身'], actionId: 'profileedit.select.picker' },
        ].map(({ label, field, placeholder, options, actionId }) => (
          <button
            key={field}
            {...action(actionId, () => setPicker({ title: label, options, actionId: field }), { params: { field, value: picked[field] ?? '' } })}
            className="flex w-full items-center justify-between border-b border-gray-100 py-3.5"
          >
            <span className="text-left">
              <span className="block text-[13px] text-gray-500">{label}</span>
              <span className={`mt-1 block text-[17px] ${picked[field] ? 'text-gray-900' : 'text-gray-300'}`}>{picked[field] ?? placeholder}</span>
            </span>
            <IcChevronRight size={17} className="text-gray-300" />
          </button>
        ))}

        {[
          { title: '个人链接' },
          { title: '工作经历', card: '添加工作经历', sub: '展现你的独特之处' },
          { title: '教育经历', card: '添加教育经历', sub: '让校友也能找到你' },
        ].map(({ title, card, sub }) => (
          <div key={title} className="pt-5">
            <div className="flex items-center justify-between">
              <span className="text-[17px] font-bold text-gray-900">{title}</span>
              <IcPlus size={19} className="text-gray-500" />
            </div>
            {card && (
              <button {...action('profileedit.select.picker', () => store.showToast('请在在线简历中完善经历'), { params: { field: title, value: '' } })} className="mt-3 w-full rounded-2xl bg-[#F8F9FA] p-4 text-left">
                <span className="block text-[16px] font-semibold text-gray-900">{card}</span>
                <span className="mt-0.5 block text-[12px] text-gray-400">{sub}</span>
                <IcPlus size={18} className="mt-2 text-gray-400" />
              </button>
            )}
          </div>
        ))}
        <p className="mt-4 text-center text-[12px] text-gray-400">· 平台用户可以在APP内查看您填写的个人主页信息</p>
      </div>
      <div className="shrink-0 px-4 pb-6" data-keep-keyboard="true">
        <PrimaryButton
          {...action('profileedit.save.commit', () => {
            store.setUserField('communityNick', nick.trim());
            store.setUserField('intro', intro.trim());
            store.setUserField('birthday', picked.birthday ?? '');
            store.setUserField('industry', picked.industry ?? '');
            store.setUserField('workCity', picked.workCity ?? '');
            store.setUserField('tags', picked.tags ?? '');
            store.showToast('已保存');
            back();
          })}
        >
          保存
        </PrimaryButton>
      </div>

      {picker && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end bg-black/40" onClick={() => setPicker(null)}>
          <div className="rounded-t-2xl bg-white pb-6" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-gray-100 px-4 py-3 text-center text-[15px] font-semibold">选择{picker.title}</div>
            <div className="max-h-64 overflow-y-auto" data-scroll-container="picker" data-scroll-direction="vertical">
              {picker.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => { setPicked((p) => ({ ...p, [picker.actionId]: opt })); setPicker(null); }}
                  className="block w-full py-3 text-center text-[16px] text-gray-800 active:bg-gray-50"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileEditPage;
