import React from 'react';
import { useDidiGestures } from '../hooks/useDidiGestures';
import { useDidiStore } from '../state';
import { TopBar, Card, ToggleRow, C } from '../components/ui';

/** 紧急联系人 —— 证据 m04(添加态)/m05(管理态):蓝hero+手机号输入+能力说明 */
export default function SafetyContactsPage() {
  const { bindTap } = useDidiGestures();
  const toast = useDidiStore((s) => s.toast);
  const contacts = useDidiStore((s) => s.settings.emergencyContacts);
  const autoShare = useDidiStore((s) => s.settings.autoShareTrip);
  const addEmergencyContact = useDidiStore((s) => s.addEmergencyContact);
  const toggleSetting = useDidiStore((s) => s.toggleSetting);
  const [phone, setPhone] = React.useState('');
  const [adding, setAdding] = React.useState(false);

  const empty = contacts.length === 0;
  const showForm = empty || adding;
  const contactDisplay = (contact: string) => {
    const digits = contact.replace(/\D/g, '');
    return digits.length === 11
      ? `守护人 ${digits.slice(0, 3)}****${digits.slice(-4)}`
      : contact;
  };

  return (
    <div className="flex flex-col h-full" style={{ background: '#EFF4FF' }} data-status-bar-foreground="dark">
      <TopBar title="紧急联系人" transparent />
      <div className="flex-1 overflow-y-auto p-3">
        {/* 蓝色 hero */}
        <div className="rounded-t-2xl p-4 text-white" style={{ background: `linear-gradient(135deg, ${C.blue}, #6FA3FF)` }}>
          <div className="text-[18px] font-bold">{empty ? '添加紧急联系人' : '管理紧急联系人'}</div>
          <div className="text-[12px] opacity-85 mt-1">
            {empty ? '添加或修改在滴滴出行的紧急联系人信息,请及时告知对方' : '添加或修改紧急联系人后,会主动通知您的守护人'}
          </div>
        </div>

        <div className="bg-app-surface rounded-b-2xl p-4 mb-3">
          {!empty && (
            <>
              {contacts.map((c) => (
                <div key={c} className="flex items-center py-3 border-b border-app-border">
                  <span
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[15px] mr-3 shrink-0"
                    style={{ background: C.blue }}
                  >
                    守
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[15px] text-app-text">{contactDisplay(c)}</span>
                    <span className="block text-[11px] text-app-text-muted">
                      {autoShare ? '已开启自动行程分享' : '未开启自动行程分享'}
                    </span>
                  </span>
                </div>
              ))}
              {!showForm && (
                <button
                  data-testid="safety-contacts-add-more"
                  onClick={() => setAdding(true)}
                  className="flex items-center w-full py-3.5 bg-transparent border-none text-left text-[15px]"
                  style={{ color: C.blue }}
                >
                  ⊕ 添加紧急联系人
                </button>
              )}
            </>
          )}
          {showForm && (
            <>
              <div className="flex items-center rounded-lg px-3 py-3 mt-2 mb-3" style={{ background: '#F5F6FA' }}>
                <input
                  data-action="safety.contacts.input"
                  data-action-type="input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  placeholder="请输入联系人手机号码"
                  inputMode="numeric"
                  maxLength={11}
                  className="flex-1 bg-transparent border-none outline-none text-[15px] text-app-text"
                />
                <button onClick={() => toast('通讯录读取暂未开放')} className="bg-transparent border-none text-[13px] shrink-0" style={{ color: C.blue }}>
                  🗂通讯录
                </button>
              </div>
              {phone.length === 11 ? (
                <button
                  {...bindTap({ kind: 'action', id: 'safety.contacts.add' }, {
                    onTrigger: () => {
                      // Persist the verifiable source value; mask only while rendering.
                      addEmergencyContact(phone);
                      setPhone(''); setAdding(false);
                    },
                  })}
                  className="w-full py-3 rounded-full text-white text-[15px] border-none"
                  style={{ background: C.blue }}
                >
                  确认添加
                </button>
              ) : (
                <button
                  onClick={() => toast('请输入完整手机号')}
                  className="w-full py-3 rounded-full text-white text-[15px] border-none"
                  style={{ background: '#B9CBE8' }}
                >
                  确认添加
                </button>
              )}
            </>
          )}
        </div>

        {/* 自动分享开关 */}
        <Card className="mb-3">
          <ToggleRow
            label="行程自动分享给紧急联系人"
            desc="夜间/长途行程自动同步车辆位置"
            on={autoShare}
            bind={bindTap(
              { kind: 'action', id: 'safety.contacts.auto.toggle' },
              { onTrigger: () => toggleSetting('autoShareTrip') },
            )}
            last
          />
        </Card>

        {/* 能力说明(m04) */}
        <div className="px-1 text-[13px] font-semibold text-app-text mb-1.5">紧急联系人能力</div>
        <div className="px-1 text-[12px] text-app-text-muted leading-relaxed">
          <p>· 您设置的紧急联系人将用于滴滴网约车(快车、优享、专车、豪华车、拼车、D1、优价)、出租车、顺风车、代驾、货运、滴滴企业app,如您开启亲友守护,也会针对以上业务生效</p>
          <p className="mt-1.5">· 仅在使用110报警或紧急联系时,会主动通知紧急联系人(货运不生效)</p>
          <p className="mt-1.5">· 您可针对不同的紧急联系人开启或关闭亲友守护</p>
        </div>
      </div>
    </div>
  );
}
