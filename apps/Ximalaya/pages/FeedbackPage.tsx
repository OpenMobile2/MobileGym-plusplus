import React, { useState } from 'react';
import { useXimalayaGestures } from '../hooks/useXimalayaGestures';
import { TopBar, showToast } from '../components/ui';
import { IcStar } from '../res/icons';

const SURVEY_OPTIONS = ['非常需要', '比较需要', '无所谓', '不需要'];
const CALLBACK_OPTIONS = ['愿意', '不愿意'];

export function FeedbackPage() {
  const { bindTap, back } = useXimalayaGestures();
  const [stars, setStars] = useState(0);
  const [survey, setSurvey] = useState<string>('');
  const [callback, setCallback] = useState<string>('');
  const [suggest, setSuggest] = useState('');

  const submit = () => { showToast('已提交'); back(); };

  return (
    <div className="h-full flex flex-col pt-10 bg-[#F5F5F5]" data-status-bar-foreground="dark">
      <TopBar title="评价反馈" />

      <div className="flex-1 overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
        {/* 星级评分 */}
        <div className="bg-white mt-2 px-4 py-4">
          <div className="text-[15px] text-[#333] font-medium">你对新版播放页满意吗?</div>
          <div className="flex items-center gap-2 mt-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                {...bindTap({ kind: 'action', id: 'feedback.stars.select.opt' }, { params: { n }, onTrigger: () => setStars(n) })}
                aria-label={`${n}星`}
                className={n <= stars ? 'text-[#FFB000]' : 'text-[#DDD]'}
              ><IcStar size={30} className={n <= stars ? 'fill-current' : ''} /></button>
            ))}
          </div>
        </div>

        {/* 小调研单选 */}
        <div className="bg-white mt-2 px-4 py-4">
          <div className="text-[15px] text-[#333] font-medium">是否需要「免开屏广告权益包」?</div>
          <div className="flex flex-col gap-2 mt-3">
            {SURVEY_OPTIONS.map((o) => {
              const active = survey === o;
              return (
                <button
                  key={o}
                  {...bindTap({ kind: 'action', id: 'feedback.choice.select.opt' }, { params: { opt: `survey:${o}` }, onTrigger: () => setSurvey(o) })}
                  className="flex items-center gap-2 text-left"
                >
                  <span className={'w-4 h-4 rounded-full border-2 ' + (active ? 'border-[#FE4543] bg-[#FE4543]' : 'border-[#CCC]')} />
                  <span className={'text-[14px] ' + (active ? 'text-[#333]' : 'text-[#666]')}>{o}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 电话回访 */}
        <div className="bg-white mt-2 px-4 py-4">
          <div className="text-[15px] text-[#333] font-medium">是否愿意接受电话回访?</div>
          <div className="flex items-center gap-3 mt-3">
            {CALLBACK_OPTIONS.map((o) => {
              const active = callback === o;
              return (
                <button
                  key={o}
                  {...bindTap({ kind: 'action', id: 'feedback.choice.select.opt' }, { params: { opt: `callback:${o}` }, onTrigger: () => setCallback(o) })}
                  className={'px-4 py-1.5 rounded-full text-[14px] border ' + (active ? 'border-[#FE4543] text-[#FE4543] bg-[#FFF0EF]' : 'border-[#DDD] text-[#666]')}
                >{o}</button>
              );
            })}
          </div>
        </div>

        {/* 建议输入 */}
        <div className="bg-white mt-2 px-4 py-4">
          <div className="text-[15px] text-[#333] font-medium mb-2">你的建议(选填)</div>
          <textarea
            value={suggest}
            onChange={(e) => setSuggest(e.target.value)}
            placeholder="说说你的想法…"
            className="w-full h-24 rounded-lg bg-[#F5F5F5] p-3 text-[14px] text-[#333] resize-none outline-none"
          />
        </div>
      </div>

      {/* 提交 */}
      <div className="shrink-0 p-3 bg-white border-t border-[#F2F2F2]">
        <button
          {...bindTap({ kind: 'action', id: 'feedback.submit.submit' }, { onTrigger: submit })}
          className="w-full h-11 rounded-full bg-[#FE4543] text-white text-[16px] font-medium"
        >提交</button>
      </div>
    </div>
  );
}
