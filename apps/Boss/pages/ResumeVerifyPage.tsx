import React, { useState } from 'react';
import { useBossGestures } from '../hooks/useBossGestures';
import { useBossStore } from '../state';
import { PageHeader } from '../components/common';
import { COLORS } from '../res/colors';
import { IcCamera } from '../res/icons';
import { useStrings } from '../hooks/useStrings';
import { pickImages } from '@/os/albumBridge';
import AsyncFsImage from '@/os/components/AsyncFsImage';

/** 简历认证(IMG_8441)+ 上传学历认证报告(IMG_8442),uiState 切换 */
const ResumeVerifyPage: React.FC = () => {
  const { action } = useBossGestures();
  const store = useBossStore();
  const user = useBossStore((s) => s.user);
  const verifySubmitted = useBossStore((s) => s.verifySubmitted);
  const storedReportImage = useBossStore((s) => s.verificationReportImage);
  const t = useStrings();
  const [uploadMode, setUploadMode] = useState(false);
  const [reportImage, setReportImage] = useState(storedReportImage);

  if (uploadMode) {
    return (
      <div className="flex h-full flex-col bg-white">
        <PageHeader title="" onBeforeBack={() => setUploadMode(false)} right={<button onClick={() => setUploadMode(false)} className="pr-2 text-gray-700" aria-label="关闭">✕</button>} />
        <div className="min-h-0 flex-1 overflow-y-auto px-5" data-scroll-container="main" data-scroll-direction="vertical">
          <div className="text-[24px] font-bold text-gray-900">上传学历认证报告</div>
          <div className="mt-4 text-[15px] text-gray-700">认证学校:</div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[20px] font-bold text-gray-900">{user.school}</span>
            <span className="rounded border px-1.5 py-0.5 text-[11px]" style={{ color: COLORS.accent, borderColor: COLORS.accent }}>{user.degree}</span>
          </div>
          <div className="mt-5 rounded-2xl bg-[#F5F6F7] p-5">
            <div className="relative mx-auto w-56 rounded-lg border border-dashed border-gray-300 bg-white p-3">
              {reportImage
                ? reportImage.startsWith('/sdcard/')
                  ? <AsyncFsImage path={reportImage} alt="学历认证报告" className="h-48 w-full rounded object-cover" />
                  : <img src={reportImage} alt="学历认证报告" className="h-48 w-full rounded object-cover" />
                : <>
                    <div className="text-center text-[11px] font-semibold text-gray-700">教育部学历证书电子注册备案表</div>
                    <div className="mt-2 space-y-1">
                      {[...Array(6)].map((_, i) => <div key={i} className="h-1.5 rounded bg-gray-100" />)}
                    </div>
                  </>}
              <button
                {...action('verify.report.pick', () => {
                  void pickImages({ multiple: false, maxSelect: 1 }).then((r) => {
                    const selected = r.selected[0];
                    if (!r.cancelled && selected) setReportImage(selected.path || selected.uri);
                  });
                }, { params: {} })}
                className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full px-4 py-2 text-[14px] text-white"
                style={{ backgroundColor: COLORS.primaryBtn }}
              >
                <IcCamera size={16} /> 上传报告
              </button>
            </div>
            <div className="mt-3 text-center text-[15px] font-medium text-gray-700">教育部学籍在线验证报告</div>
            <button onClick={() => store.showNotice('示例报告暂未开放，请点击“我知道了”返回。')} className="mx-auto mt-2 block rounded-full border px-4 py-1.5 text-[13px]" style={{ borderColor: COLORS.primary, color: COLORS.primary }}>查看示例</button>
          </div>
          <p className="mt-4 text-[12px] leading-relaxed text-gray-400">
            ⓘ 了解获取流程,可查看学信网报告 <span style={{ color: COLORS.accent }}>获取教程</span><br />
            了解可认证范围及注意事项 <span style={{ color: COLORS.accent }}>认证范围</span>
          </p>
        </div>
        <div className="shrink-0 px-4 pb-6">
          <button
            {...action('verify.submit.commit', () => {
              if (!reportImage) { store.showToast(t.uploadReportFirst); return; }
              store.submitVerification(reportImage);
              store.showToast(t.materialSubmitted);
              setUploadMode(false);
            }, { params: {} })}
            className="w-full rounded-full bg-[#BFE8E6] py-3 text-center text-[16px] font-medium text-white"
          >
            提交材料
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title="简历认证" />
      <div className="min-h-0 flex-1 px-4" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="pt-2 text-[14px] text-gray-700">已认证学历将在简历中展示 <span style={{ color: COLORS.accent }}>查看效果</span></div>
        <div className="mt-4 rounded-2xl border border-gray-100 p-4 shadow-sm">
          <span className={`rounded px-2 py-0.5 text-[11px] ${verifySubmitted ? 'bg-[#EAF6F5] text-[#119FA4]' : 'bg-[#FFF1E8] text-[#FF5F2E]'}`}>{verifySubmitted ? '审核中' : '待认证'}</span>
          <div className="mt-2 flex items-center justify-between">
            <span>
              <span className="flex items-center gap-2 text-[18px] font-bold text-gray-900">
                {user.school}
                <span className="rounded border px-1.5 py-0.5 text-[11px] font-normal" style={{ color: COLORS.accent, borderColor: COLORS.accent }}>{user.degree}</span>
              </span>
              <span className="mt-0.5 block text-[13px] text-gray-400">Jiangdong University</span>
            </span>
            <button
              {...action('verify.upload.open', () => setUploadMode(true), { params: {} })}
              className="shrink-0 rounded-full px-4 py-2 text-[14px] font-medium text-white"
              style={{ backgroundColor: COLORS.primaryBtn }}
            >
              {verifySubmitted ? '查看材料' : '立即上传'}
            </button>
          </div>
        </div>
        <div className="mt-6 text-[15px] font-semibold text-gray-900">温馨提醒:</div>
        <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-gray-500">
          <li>· 认证信息与在线简历同步,若简历内删减教育经历/证书,将会影响认证状态展示。</li>
          <li>· <span style={{ color: COLORS.accent }}>遇到问题,前往了解</span></li>
        </ul>
      </div>
    </div>
  );
};

export default ResumeVerifyPage;
