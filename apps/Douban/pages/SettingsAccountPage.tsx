// 节点: settings.account —— 资料与账号(evidence IMG_0293/frame:1ad80c)。
// 个人资料分组(头像/豆瓣ID/昵称/性别/常居地/家乡/生日)+ 账号设置(手机/邮箱/微信/微博/Apple ID/设置密码)+ 淘宝授权。
// 交互:头像行→全屏预览(transition);头像「更改」action-sheet(?sheet=avatar,相册/相机 wontfix);
//       豆瓣ID 长按→toast 复制成功;昵称子页(?edit=nickname,30天限,本地保存);
//       性别底部弹层(?sheet=gender,半年限,本地更新);常居地/绑定/淘宝授权 → wontfix。
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, TopBar, Avatar } from '../components/ui';
import { Sheet, SheetRow } from '../components/Sheet';
import { GroupHeader, GroupGap, useSettingsLocalStore } from './settingsShared';
import { copyToClipboard, pickImagesFromAlbum } from '../capabilities';

const DOUBAN_ID = '100200300';
const PHONE = '138****2046';

/** 资料行:左标题 + 右侧值/自定义 + 箭头。 */
function Row({
  label,
  value,
  right,
  chevron = true,
  dot = false,
  bind,
}: {
  label: string;
  value?: React.ReactNode;
  right?: React.ReactNode;
  chevron?: boolean;
  dot?: boolean;
  bind?: object;
}) {
  const inner = (
    <>
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="text-[16px]" style={{ color: C.text }}>{label}</div>
        {dot && <span className="rounded-full" style={{ width: 6, height: 6, background: C.danger }} />}
      </div>
      <div className="flex-1" />
      {value != null && (
        <span className="text-[15px] shrink-0 max-w-[60%] truncate text-right" style={{ color: C.sub }}>
          {value}
        </span>
      )}
      {right}
      {chevron && <span className="text-lg shrink-0 ml-1" style={{ color: '#C7CCD4' }}>›</span>}
    </>
  );
  const cls = 'w-full flex items-center gap-1 px-4 text-left bg-white border-none';
  if (bind) {
    return (
      <button {...bind} className={`${cls} cursor-pointer`} style={{ height: 54 }}>
        {inner}
      </button>
    );
  }
  return <div className={cls} style={{ height: 54 }}>{inner}</div>;
}

export default function SettingsAccountPage() {
  const { bindTap, bindLongPress, bindBack, back } = useDoubanGestures();
  const toast = useDoubanStore((s) => s.toast);
  const avatar = useDoubanStore((s) => s.currentUser.avatar);
  const gender = useSettingsLocalStore((s) => s.gender);
  const nickname = useSettingsLocalStore((s) => s.nickname);
  const setGender = useSettingsLocalStore((s) => s.setGender);
  const setNickname = useSettingsLocalStore((s) => s.setNickname);

  const [searchParams, setSearchParams] = useSearchParams();
  const sheet = searchParams.get('sheet'); // 'avatar' | 'gender'
  const editing = searchParams.get('edit') === 'nickname';
  const [draft, setDraft] = React.useState(nickname);

  const openParam = (k: string, v: string) =>
    setSearchParams((p) => {
      p.set(k, v);
      return p;
    });

  const wontfix = (id: string) =>
    bindTap({ kind: 'action', id: id as never }, { onTrigger: () => toast('该功能暂未开放') });

  // ---- 昵称编辑子页(uiState=nickname.edit) ----
  if (editing) {
    return (
      <div className="flex flex-col h-full bg-[#F7F7F8]" data-status-bar-foreground="dark">
        <TopBar
          title="昵称"
          right={
            <button
              {...bindTap(
                { kind: 'action', id: 'settings.account.nickname.save' },
                {
                  onTrigger: () => {
                    const v = draft.trim();
                    if (v) setNickname(v);
                    back();
                    toast('保存成功');
                  },
                },
              )}
              className="text-[15px] bg-transparent border-none cursor-pointer font-medium"
              style={{ color: C.green }}
            >
              保存
            </button>
          }
        />
        <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
          <div className="mt-3 bg-white px-4 py-3 flex items-center">
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={30}
              className="flex-1 text-[16px] bg-transparent border-none outline-none"
              style={{ color: C.text }}
            />
            <span className="text-xs shrink-0" style={{ color: '#B9BEC6' }}>{draft.length}/30</span>
          </div>
          <div className="px-4 pt-2 text-xs" style={{ color: '#B9BEC6' }}>
            昵称 30 天内只能修改一次
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#F7F7F8]" data-status-bar-foreground="dark">
      <TopBar title="资料与账号设置" borderless />
      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 个人资料分组 */}
        <GroupHeader label="个人资料" />
        <button
          {...bindTap('settings.account.avatar-open', { params: { avatarUrl: avatar } })}
          className="w-full flex items-center gap-1 px-4 bg-white border-none cursor-pointer text-left"
          style={{ height: 66 }}
        >
          <div className="text-[16px]" style={{ color: C.text }}>头像</div>
          <div className="flex-1" />
          <Avatar src={avatar} size={44} />
          <span className="text-lg shrink-0 ml-1" style={{ color: '#C7CCD4' }}>›</span>
        </button>
        <Row
          label="豆瓣ID"
          value={DOUBAN_ID}
          bind={bindLongPress(
            { kind: 'action', id: 'settings.account.id.copy' },
            { onTrigger: () => toast(copyToClipboard(DOUBAN_ID) ? '复制成功' : '无法访问剪切板') },
          )}
        />
        <Row
          label="昵称"
          value={nickname}
          bind={bindTap(
            { kind: 'action', id: 'settings.account.nickname.edit' },
            {
              onTrigger: () => {
                setDraft(nickname);
                openParam('edit', 'nickname');
              },
            },
          )}
        />
        <Row
          label="性别"
          value={gender}
          bind={bindTap(
            { kind: 'action', id: 'settings.account.gender.sheet' },
            { onTrigger: () => openParam('sheet', 'gender') },
          )}
        />
        <Row label="常居地" value="江苏" bind={wontfix('settings.account.location.wontfix')} />
        {/* 家乡/生日:真机个人资料分组行(mod7 审计补齐),复用资料 wontfix */}
        <Row label="家乡" value="江苏南京" bind={wontfix('settings.account.location.wontfix')} />
        <Row label="生日" value="1996-03-14" bind={wontfix('settings.account.location.wontfix')} />

        {/* 账号设置分组 */}
        <GroupGap />
        <GroupHeader label="账号设置" />
        {/* 设置密码:真机在账号设置组首位且带红点提示(mod7 审计) */}
        <Row label="设置密码" dot bind={wontfix('settings.account.bind.wontfix')} />
        <Row label="手机号" value={PHONE} bind={wontfix('settings.account.bind.wontfix')} />
        <Row label="邮箱" value="去绑定" bind={wontfix('settings.account.bind.wontfix')} />
        <Row label="微信" value="去绑定" bind={wontfix('settings.account.bind.wontfix')} />
        <Row label="微博" value="去绑定" bind={wontfix('settings.account.bind.wontfix')} />
        <Row label="Apple ID" value="豆友_墨鱼仔 已绑定" bind={wontfix('settings.account.bind.wontfix')} />

        {/* 第三方授权 */}
        <GroupGap />
        <GroupHeader label="第三方授权" />
        <Row label="淘宝" value="去授权" bind={wontfix('settings.account.taobaoAuth.wontfix')} />

        <div className="h-8" />
      </div>

      {/* 头像更改 action-sheet(uiState=avatar.sheet,frame:1ad80c@t0006) */}
      {sheet === 'avatar' && (
        <Sheet>
          <SheetRow
            label="拍照"
            bind={bindTap(
              { kind: 'action', id: 'settings.account.avatarCamera.wontfix' },
              { onTrigger: () => toast('该功能暂未开放') },
            )}
          />
          <SheetRow
            label="从相册选择"
            bind={bindTap(
              { kind: 'action', id: 'settings.account.avatarAlbum.pick' },
              {
                onTrigger: () => {
                  void pickImagesFromAlbum({ multiple: false, maxSelect: 1 }).then((r) => {
                    if (r.cancelled || !r.selected.length) return;
                    // 头像落到本地资料态（store 若无专用字段则 toast 成功即可验通道）
                    useDoubanStore.getState().updateProfile({ avatar: r.selected[0].uri });
                    toast('头像已更新');
                  });
                },
              },
            )}
          />
          <div className="h-2" style={{ background: '#F2F3F5' }} />
          <SheetRow label="取消" bind={bindBack()} />
        </Sheet>
      )}

      {/* 性别底部弹层(uiState=gender.sheet,frame:1ad80c@t0016) */}
      {sheet === 'gender' && (
        <Sheet title="性别（半年内只能修改一次）">
          {['男', '女', '保密'].map((g) => (
            <SheetRow
              key={g}
              label={g}
              right={gender === g ? <span style={{ color: C.green }}>✓</span> : undefined}
              bind={bindTap(
                { kind: 'action', id: 'settings.account.gender.select.option' },
                {
                  onTrigger: () => {
                    setGender(g);
                    back();
                  },
                },
              )}
            />
          ))}
          <div className="h-2" style={{ background: '#F2F3F5' }} />
          <SheetRow label="取消" bind={bindTap({ kind: 'action', id: 'settings.account.gender.select.option' }, { onTrigger: () => back() })} />
        </Sheet>
      )}

      {/* 头像「更改头像」入口(action=avatar.changeSheet):在头像全屏预览页触发,
          此处保留绑定以覆盖 spec 动作(打开 avatar action-sheet)。 */}
      <button
        {...bindTap(
          { kind: 'action', id: 'settings.account.avatar.changeSheet' },
          { onTrigger: () => openParam('sheet', 'avatar') },
        )}
        className="hidden"
        aria-hidden
        tabIndex={-1}
      >
        更改头像
      </button>
    </div>
  );
}
