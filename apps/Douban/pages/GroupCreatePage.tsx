// 创建小组(group.create,IMG_0345-0351,frame:1779a1@t0058/t0060,qa:Q5):
// 入口实名认证底部弹窗(跳过→表单 / 去认证→静态认证页 wontfix)→ 表单(名称/简介/标签网格/同意勾选/提交)
// → 提交成功页(我知道了→group.discover)。规定长文页可从表单打开。内部页态 URL 驱动。
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C } from '../components/ui';
import { Sheet } from '../components/Sheet';

const TAGS = [
  '美食', '家居', '宠物', '闲趣',
  '校园', '职场', '艺术创作', '写作',
  '书影音', '游戏', '二次元', '娱乐',
  '追剧', '艺术', '学习', '人文社科',
  '科学自然', '理财', '育儿', '时尚',
  '科技', '体育', '运动健身', '素材',
  '旅行', '汽车', '健康', '情感',
  '生活记录', '兴趣', '故事',
];
const MAX_TAGS = 5;

export default function GroupCreatePage() {
  const { bindBack, bindTap } = useDoubanGestures();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useDoubanStore((s) => s.toast);

  // page: 'realname'(默认弹窗) | 'idVerify' | 'form' | 'rules' | 'success'
  const page = searchParams.get('page') ?? 'realname';

  const [name, setName] = useState('');
  const [intro, setIntro] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [agreed, setAgreed] = useState(false);
  const customOpen = searchParams.get('custom') === '1';
  const [customText, setCustomText] = useState('');

  const goPage = (p: string, replace = false) =>
    setSearchParams(
      (sp) => {
        sp.set('page', p);
        sp.delete('custom');
        return sp;
      },
      { replace },
    );
  const setParam = (key: string, value: string | null) =>
    setSearchParams(
      (sp) => {
        if (value === null) sp.delete(key);
        else sp.set(key, value);
        return sp;
      },
      { replace: true },
    );

  const toggleTag = (t: string) =>
    setTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : prev.length >= MAX_TAGS ? prev : [...prev, t],
    );

  const allTags = [...TAGS, ...customTags];
  const canSubmit = name.trim().length > 0 && intro.trim().length > 0 && (tags.length > 0) && agreed;

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      {/* 顶栏(表单/规定/认证页可见) */}
      {page !== 'realname' && page !== 'success' && (
        <div className="flex items-center h-11 px-1 shrink-0 bg-white border-b" style={{ borderColor: C.border }}>
          <button {...bindBack()} className="w-10 flex items-center justify-center text-2xl bg-transparent border-none cursor-pointer" style={{ color: C.text }}>‹</button>
          {page === 'form' ? (
            // 表单页顶栏:‹ + × + …,无标题文字
            <>
              <div className="flex-1" />
              <button {...bindBack()} className="w-9 flex items-center justify-center text-xl bg-transparent border-none cursor-pointer" style={{ color: C.text }}>×</button>
              <button
                {...bindTap({ kind: 'action', id: 'groupCreate.idVerify.wontfix' }, { params: { menu: 1 }, onTrigger: () => toast('该功能暂未开放') })}
                className="w-9 flex items-center justify-center text-lg bg-transparent border-none cursor-pointer"
                style={{ color: C.text }}
              >
                ⋯
              </button>
            </>
          ) : (
            <>
              <div className="flex-1 text-center font-semibold text-base" style={{ color: C.text }}>
                {page === 'idVerify' ? '账号实名制认证' : '小组创建管理规定'}
              </div>
              <div className="w-10" />
            </>
          )}
        </div>
      )}

      {/* 表单页 */}
      {page === 'form' && (
        <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
          <div className="bg-white mt-2 px-4 py-3.5">
            <div className="text-[15px] font-bold" style={{ color: C.text }}>小组名称</div>
            <div className="text-xs mt-1 mb-2 leading-relaxed" style={{ color: C.sub }}>小组名称代表小组主要讨论主题,鲜明、独特的组名有助于提高小组的辨识度</div>
            <input
              {...bindTap({ kind: 'action', id: 'groupCreate.form.input' }, { params: { field: 'name' }, onTrigger: () => {} })}
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 20))}
              placeholder="请输入小组名称"
              className="w-full h-10 px-3 rounded-lg text-sm outline-none border"
              style={{ background: '#F7F7F7', color: C.text, borderColor: C.border }}
            />
          </div>
          <div className="bg-white mt-2 px-4 py-3.5">
            <div className="text-[15px] font-bold" style={{ color: C.text }}>小组简介</div>
            <div className="text-xs mt-1 mb-2 leading-relaxed" style={{ color: C.sub }}>详细介绍小组的主题、用法,帮助新成员快速了解、融入你的小组</div>
            <textarea
              {...bindTap({ kind: 'action', id: 'groupCreate.form.input' }, { params: { field: 'intro' }, onTrigger: () => {} })}
              value={intro}
              onChange={(e) => setIntro(e.target.value.slice(0, 140))}
              placeholder="请输入小组简介"
              rows={3}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none border resize-none"
              style={{ background: '#F7F7F7', color: C.text, borderColor: C.border }}
            />
          </div>
          <div className="bg-white mt-2 px-4 py-3.5">
            <div className="text-[15px] font-bold" style={{ color: C.text }}>小组分类标签</div>
            {/* 3 条圆点 bullet 说明 */}
            <div className="mt-1.5 mb-2.5 space-y-1">
              {[
                <><span className="font-semibold" style={{ color: C.text }}>不超过 5 个标签</span>,标签越精准越有助于豆友发现你的小组</>,
                <>可自定义标签,如「植物」「手账」等,概括小组的讨论主题</>,
                <>示例:美食组可选「美食」并自定义「北京这家店好好吃」</>,
              ].map((line, i) => (
                <div key={i} className="flex gap-1.5 text-xs leading-relaxed" style={{ color: C.sub }}>
                  <span className="shrink-0" style={{ color: '#C3C9D1' }}>·</span>
                  <span>{line}</span>
                </div>
              ))}
            </div>
            <div className="mb-2">
              <span className="text-xs" style={{ color: C.text }}>请选择标签:</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {allTags.map((t) => {
                const active = tags.includes(t);
                const disabled = !active && tags.length >= MAX_TAGS;
                return (
                  <button
                    key={t}
                    {...bindTap({ kind: 'action', id: 'groupCreate.tag.select.target' }, {
                      params: { target: t },
                      onTrigger: () => toggleTag(t),
                    })}
                    className="h-8 rounded-full text-xs border truncate"
                    style={{
                      background: active ? C.greenSoft : '#F7F7F7',
                      color: active ? C.green : C.sub,
                      borderColor: active ? C.green : 'transparent',
                      opacity: disabled ? 0.4 : 1,
                      cursor: disabled ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
            {/* 更多相关标签:独立「+ 自定义标签」入口 */}
            <div className="mt-3 text-xs" style={{ color: C.sub }}>更多相关标签:</div>
            <button
              {...bindTap({ kind: 'action', id: 'groupCreate.tag.custom' }, {
                onTrigger: () => {
                  setCustomText('');
                  setParam('custom', '1');
                },
              })}
              className="mt-1.5 px-3 h-8 rounded-full text-xs cursor-pointer"
              style={{ background: '#F7F7F7', color: C.sub, borderColor: C.border, borderStyle: 'dashed', borderWidth: 1 }}
            >
              + 自定义标签
            </button>
          </div>
          {/* 提交按钮(禁用态灰底灰字) */}
          <div className="px-4 pt-5 pb-2">
            <button
              {...bindTap({ kind: 'action', id: 'groupCreate.form.submit' }, {
                onTrigger: () => {
                  if (!canSubmit) {
                    toast('请填写完整并同意社区指导原则');
                    return;
                  }
                  goPage('success');
                },
              })}
              className="w-full h-11 rounded-full text-sm border-none cursor-pointer"
              style={canSubmit ? { background: C.green, color: '#fff' } : { background: '#F2F3F5', color: '#B9BEC6' }}
            >
              提交
            </button>
          </div>

          {/* 协议勾选(提交按钮下方,链接蓝色) */}
          <div className="px-4 pb-6">
            <button
              {...bindTap({ kind: 'action', id: 'groupCreate.agree.toggle' }, { onTrigger: () => setAgreed((v) => !v) })}
              className="flex items-center gap-2 bg-transparent border-none cursor-pointer text-left w-full"
            >
              <span
                className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                style={{ border: agreed ? 'none' : `1.5px solid ${C.border}`, background: agreed ? C.green : 'transparent' }}
              >
                {agreed && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5"><path d="M20 6L9 17l-5-5" /></svg>
                )}
              </span>
              <span className="text-xs" style={{ color: C.sub }}>
                我已认真阅读并同意
                <span
                  {...bindTap({ kind: 'action', id: 'groupCreate.rules.open' }, { stopPropagation: true, onTrigger: () => goPage('rules') })}
                  style={{ color: '#3E7BF2' }}
                >
                  《社区指导原则》
                </span>
                和
                <span
                  {...bindTap({ kind: 'action', id: 'groupCreate.rules.open' }, { stopPropagation: true, onTrigger: () => goPage('rules') })}
                  style={{ color: '#3E7BF2' }}
                >
                  《法律声明》
                </span>
                。
              </span>
            </button>
          </div>

          {/* 自定义标签输入弹层 */}
          {customOpen && (
            <Sheet title="添加自定义标签">
              <div className="px-5 pb-3">
                <input
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value.slice(0, 8))}
                  placeholder="标签名(≤8字)"
                  className="w-full h-10 px-3 rounded-lg text-sm outline-none border"
                  style={{ background: '#F7F7F7', color: C.text, borderColor: C.border }}
                />
                <button
                  {...bindTap({ kind: 'action', id: 'groupCreate.tag.custom' }, {
                    params: { confirm: 1 },
                    onTrigger: () => {
                      const t = customText.trim();
                      if (t && !allTags.includes(t)) {
                        setCustomTags((prev) => [...prev, t]);
                        setTags((prev) => (prev.length >= MAX_TAGS ? prev : [...prev, t]));
                      }
                      setParam('custom', null);
                    },
                  })}
                  className="w-full h-10 mt-3 rounded-full text-sm text-white border-none cursor-pointer"
                  style={{ background: customText.trim() ? C.green : '#B7E5BE' }}
                >
                  添加
                </button>
              </div>
            </Sheet>
          )}
        </div>
      )}

      {/* 规定长文页 */}
      {page === 'rules' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-4" data-scroll-container="rules" data-scroll-direction="vertical">
            {[
              ['一、创建前的准备', '创建小组前,请先明确小组的主题与讨论范围,确保内容健康、积极,符合社区规范。'],
              ['二、账号要求', '创建小组的账号需完成实名认证,且无严重违规记录;单个账号可创建的小组数量有限。'],
              ['三、创建的规则', '小组名称、简介、标签不得含违法违规、低俗、引战或误导性内容,不得冒用他人或机构名义。'],
              ['四、默认管理机制', '创建者默认成为组长,负责小组日常管理;系统对长期无活跃的小组保留回收权利。'],
              ['五、管理权利和义务', '组长/管理员有权管理成员与讨论,须公正行使权利、维护良好氛围,不得滥用管理权限。'],
            ].map(([h, body]) => (
              <div key={h} className="mb-4">
                <div className="text-sm font-bold mb-1" style={{ color: C.text }}>{h}</div>
                <div className="text-sm leading-relaxed" style={{ color: C.sub }}>{body}</div>
              </div>
            ))}
          </div>
          <div className="px-4 py-4 shrink-0 bg-white border-t" style={{ borderColor: C.border }}>
            <button
              {...bindTap({ kind: 'action', id: 'groupCreate.rules.agree' }, {
                onTrigger: () => {
                  setAgreed(true);
                  goPage('form', true);
                },
              })}
              className="w-full h-11 rounded-full text-sm text-white border-none cursor-pointer"
              style={{ background: C.green }}
            >
              已阅读并同意
            </button>
          </div>
        </div>
      )}

      {/* 实名认证静态页(wontfix) */}
      {page === 'idVerify' && (
        <div className="flex-1 overflow-y-auto px-5 py-4" data-scroll-container="main" data-scroll-direction="vertical">
          <div className="text-sm leading-relaxed mb-4" style={{ color: C.sub }}>
            根据相关规定,创建小组需完成身份证件实名认证。请上传本人身份证件照片。
          </div>
          <div className="flex gap-3 mb-4">
            {['证件人像面', '证件国徽面'].map((label) => (
              <button
                key={label}
                {...bindTap({ kind: 'action', id: 'groupCreate.idVerify.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
                className="flex-1 aspect-4/3 rounded-xl border flex flex-col items-center justify-center bg-white cursor-pointer"
                style={{ borderColor: C.border, borderStyle: 'dashed', borderWidth: 1 }}
              >
                <span className="text-2xl" style={{ color: C.sub }}>+</span>
                <span className="text-xs mt-1" style={{ color: C.sub }}>{label}</span>
              </button>
            ))}
          </div>
          <div className="space-y-2.5 mb-6">
            {['我承诺上传的证件为本人所有', '我知晓虚假认证的法律责任', '我已阅读并同意《实名认证协议》'].map((t) => (
              <div key={t} className="flex items-center gap-2 text-xs" style={{ color: C.sub }}>
                <span className="w-4 h-4 rounded-full shrink-0" style={{ border: `1.5px solid ${C.border}` }} />
                {t}
              </div>
            ))}
          </div>
          <button
            {...bindTap({ kind: 'action', id: 'groupCreate.idVerify.wontfix' }, { params: { submit: 1 }, onTrigger: () => toast('该功能暂未开放') })}
            className="w-full h-11 rounded-full text-sm text-white border-none cursor-pointer"
            style={{ background: C.green }}
          >
            提交认证
          </button>
          <div className="text-center text-xs mt-3" style={{ color: C.sub }}>如有疑问请联系客服</div>
        </div>
      )}

      {/* 提交成功页(文档式:顶栏 ‹ × … + 大标题 + 说明段 + 蓝色「我知道了」链接) */}
      {page === 'success' && (
        <>
          <div className="flex items-center h-11 px-1 shrink-0 bg-white" style={{ borderBottom: `1px solid ${C.border}` }}>
            <button {...bindBack()} className="w-10 flex items-center justify-center text-2xl bg-transparent border-none cursor-pointer" style={{ color: C.text }}>‹</button>
            <div className="flex-1" />
            <button
              {...bindTap('groupCreate.done-back')}
              className="w-9 flex items-center justify-center text-xl bg-transparent border-none cursor-pointer"
              style={{ color: C.text }}
            >
              ×
            </button>
            <span className="w-9 flex items-center justify-center text-lg" style={{ color: C.text }}>⋯</span>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-6" data-scroll-container="main" data-scroll-direction="vertical">
            <div className="text-xl font-bold" style={{ color: C.text }}>小组申请提交成功</div>
            <div className="text-sm mt-4 leading-relaxed" style={{ color: C.sub }}>
              创建小组的申请已经提交,工作人员将尽快处理,处理结果会通过豆邮告知你,请耐心等待。
            </div>
            <button
              {...bindTap('groupCreate.done-back')}
              className="mt-6 bg-transparent border-none cursor-pointer text-sm p-0"
              style={{ color: '#3E7BF2' }}
            >
              我知道了
            </button>
          </div>
        </>
      )}

      {/* 入口实名认证底部弹窗(覆盖在发现小组之上) */}
      {page === 'realname' && (
        <>
          <div className="flex-1" style={{ background: 'rgba(0,0,0,0.4)' }} />
          <div className="rounded-t-2xl bg-white px-5 pt-5 pb-8 shrink-0">
            <div className="text-base font-bold text-center mb-2" style={{ color: C.text }}>实名认证</div>
            <div className="text-sm leading-relaxed text-center mb-5" style={{ color: C.sub }}>
              根据豆瓣管理规则,创建小组需先进行身份证实名认证。
            </div>
            <div className="flex gap-3">
              <button
                {...bindTap({ kind: 'action', id: 'groupCreate.realname.skip' }, { onTrigger: () => goPage('form', true) })}
                className="flex-1 h-11 rounded-full text-sm border cursor-pointer"
                style={{ background: '#fff', color: C.sub, borderColor: C.border }}
              >
                跳过
              </button>
              <button
                {...bindTap({ kind: 'action', id: 'groupCreate.realname.verify' }, { onTrigger: () => goPage('idVerify', true) })}
                className="flex-1 h-11 rounded-full text-sm text-white border-none cursor-pointer"
                style={{ background: C.green }}
              >
                去认证
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
