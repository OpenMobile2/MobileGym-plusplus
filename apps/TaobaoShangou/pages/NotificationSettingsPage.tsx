import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { useTbsgGestures } from '../hooks/useTbsgGestures';
import { useTbsgStore } from '../state';
import { CenterDialog, TopBar, showToast } from '../components/common';
import { IcAlert, IcBell, IcChat, IcOrders, IcRight, IcShield, IcTicket } from '../res/icons';

const PLATFORM_ROWS = [
  { label: '订单交易', sub: '订单动态、履约信息等内容,您的订单助理', Icon: IcOrders, color: '#ED6C2C' },
  { label: '权益通知', sub: '超会权益、红包卡券等内容,资产实时掌握', Icon: IcShield, color: '#F0B13C' },
  { label: '服务通知', sub: '账户安全、订阅消息等内容,给您更好体验', Icon: IcBell, color: '#4CB958' },
  { label: '活动优惠', sub: '福利促销、互动玩法等内容,热门活动资讯', Icon: IcTicket, color: '#EB493B' },
];

const CHAT_ROWS = [
  { label: '聊天消息', sub: '与骑士、商家、药师等对话内容', Icon: IcChat, color: '#ED6C2C' },
  { label: '消息号', sub: '平台官方消息号', Icon: IcAlert, color: '#4DB8C4' },
];

/** 消息通知设置页(spec settings.notifications,证据 IMG_6029/6030) */
export default function NotificationSettingsPage() {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap, bindBack, back } = useTbsgGestures();
  const [sp, setSp] = useSearchParams();

  const settings = useTbsgStore((st) => st.settings);
  const updateSettings = useTbsgStore((st) => st.updateSettings);
  const clearMessages = useTbsgStore((st) => st.clearMessages);

  const stub = () => bindTap<HTMLButtonElement>(
    { kind: 'action', id: 'notif.misc.stub' },
    { onTrigger: () => showToast(s.notOpen) },
  );

  /** 各通知渠道:默认开启,点击行内开关切换(本地状态) */
  const IconRow = ({ label, sub, Icon, color }: (typeof PLATFORM_ROWS)[number]) => {
    const on = settings.notifSwitches[label] ?? true;
    return (
      <button
        {...bindTap<HTMLButtonElement>(
          { kind: 'action', id: 'notif.channel.toggle' },
          { params: { channel: label }, onTrigger: () => updateSettings({ notifSwitches: { ...settings.notifSwitches, [label]: !on } }) },
        )}
        className="w-full flex items-center px-4 py-3.5 bg-transparent border-x-0 border-t-0 border-b border-solid border-[#F5F5F5] cursor-pointer text-left"
      >
        <span className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: color }}>
          <Icon size={20} className="text-white" />
        </span>
        <div className="ml-3 flex-1 min-w-0">
          <div className="text-[16px] font-semibold text-[#1A1A1A]">{label}</div>
          <div className="text-[13px] text-[#999999] mt-0.5 truncate">{sub}</div>
        </div>
        <span className={`w-11 h-6 rounded-full flex items-center px-0.5 shrink-0 ${on ? 'bg-[#ED6C2C] justify-end' : 'bg-[#DDDDDD] justify-start'}`}>
          <span className="w-5 h-5 rounded-full bg-white" />
        </span>
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#F3F6F8]">
      <TopBar title="消息通知设置" titleLeft />
      <div data-scroll-container="main" data-scroll-direction="vertical" className="flex-1 overflow-y-auto">
        <div className="text-[13px] text-[#999999] px-4 pt-3 pb-2">消息通知设置</div>
        {/* 系统消息通知 */}
        <button
          {...stub()}
          className="w-full flex items-center px-4 py-4 bg-white border-none cursor-pointer text-left"
        >
          <span className="text-[16px] text-[#1A1A1A]">系统消息通知</span>
          <div className="flex-1" />
          <span className="text-[15px] text-[#ED6C2C]">去开启</span>
          <IcRight size={15} className="text-[#ED6C2C]" />
        </button>
        <div className="text-[13px] text-[#999999] px-4 py-2.5 leading-relaxed">
          目前无法获取订单、优惠等消息,请在「系统设置-通知-淘宝闪购」中,打开允许通知
        </div>

        {/* APP打开时 */}
        <div className="text-[13px] text-[#999999] px-4 pb-2">APP打开时</div>
        <button
          {...bindTap<HTMLButtonElement>(
            { kind: 'action', id: 'notif.banner.toggle' },
            { onTrigger: () => updateSettings({ bannerNotify: !settings.bannerNotify }) },
          )}
          className="w-full flex items-center px-4 py-4 bg-white border-none cursor-pointer text-left"
        >
          <span className="text-[16px] text-[#1A1A1A]">淘宝闪购内横幅通知</span>
          <div className="flex-1" />
          <span className={`w-11 h-6 rounded-full flex items-center px-0.5 shrink-0 ${settings.bannerNotify ? 'bg-[#ED6C2C] justify-end' : 'bg-[#DDDDDD] justify-start'}`}>
            <span className="w-5 h-5 rounded-full bg-white" />
          </span>
        </button>

        {/* 平台消息通知 */}
        <div className="text-[13px] text-[#999999] px-4 pt-4 pb-2">平台消息通知</div>
        <div className="bg-white">
          {PLATFORM_ROWS.map((r) => <IconRow key={r.label} {...r} />)}
        </div>

        {/* 聊天动态通知 */}
        <div className="text-[13px] text-[#999999] px-4 pt-4 pb-2">聊天动态通知</div>
        <div className="bg-white">
          {CHAT_ROWS.map((r) => <IconRow key={r.label} {...r} />)}
        </div>

        {/* 短信通知 */}
        <div className="text-[13px] text-[#999999] px-4 pt-4 pb-2">短信通知</div>
        <div className="bg-white">
          <IconRow label="短信通知" sub="优惠福利、平台活动等短信通知" Icon={IcChat} color="#E85C8A" />
        </div>

        {/* 订阅消息管理 / 清空消息列表 */}
        <div className="text-[13px] text-[#999999] px-4 pt-4 pb-2">订阅消息管理</div>
        <div className="bg-white mb-6">
          <button
            {...stub()}
            className="w-full flex items-center px-4 py-4 bg-transparent border-x-0 border-t-0 border-b border-solid border-[#F5F5F5] cursor-pointer text-left"
          >
            <span className="text-[16px] text-[#1A1A1A]">订阅消息管理</span>
            <div className="flex-1" />
            <IcRight size={16} className="text-[#BBBBBB]" />
          </button>
          <button
            {...bindTap<HTMLButtonElement>(
              { kind: 'action', id: 'notif.clearall.confirm' },
              { onTrigger: () => setSp((p) => { p.set('confirm', 'clear'); return p; }) },
            )}
            className="w-full flex items-center px-4 py-4 bg-transparent border-none cursor-pointer text-left"
          >
            <span className="text-[16px] text-[#1A1A1A]">清空消息列表</span>
            <div className="flex-1" />
            <IcRight size={16} className="text-[#BBBBBB]" />
          </button>
        </div>
      </div>

      {/* 清空确认弹窗 */}
      {sp.get('confirm') === 'clear' && (
        <CenterDialog>
          <div className="text-[16px] font-semibold text-[#1A1A1A] text-center py-3">确认清空消息列表?</div>
          <div className="flex gap-3 mt-2">
            <button
              {...bindBack<HTMLButtonElement>()}
              className="flex-1 h-10 rounded-full bg-[#F3F6F8] text-[#1A1A1A] text-[15px] border-none cursor-pointer"
            >
              {s.cancel}
            </button>
            <button
              onClick={() => {
                clearMessages();
                showToast('已清空');
                back();
              }}
              className="flex-1 h-10 rounded-full bg-[#ED6C2C] text-white text-[15px] font-semibold border-none cursor-pointer"
            >
              {s.confirm}
            </button>
          </div>
        </CenterDialog>
      )}
    </div>
  );
}
