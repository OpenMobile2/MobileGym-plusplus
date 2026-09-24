import React from 'react';
import { useDarkMode } from '../../../os/hooks/useDarkMode';
import { useLocation, useSearchParams } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { ConfirmDialog } from '../components/Sheet';
import { IcSearch, IcEdit, IcCheckCircle } from '../res/icons';
import { useCainiaoGestures } from '../hooks/useCainiaoGestures';
import { useCainiaoStore } from '../state';
import { copyToClipboard } from '../utils/clipboard';
import { useI18n } from '../i18n';

/**
 * 地址簿(spec ship.addressbook):
 * mode=recipient/sender 选择;mode=manage 管理(我的入口);mode=multi 多选(寄给多个人);
 * 页内 batchDelete 态;dialog=deleteConfirm 删除确认。
 */
export default function AddressBookPage() {
  const { isDark } = useDarkMode();
  const { bindTap, action, back } = useCainiaoGestures();
  const { t } = useI18n();
  const [sp] = useSearchParams();
  const { search } = useLocation();
  const mode = sp.get('mode') ?? 'manage';
  const showDeleteConfirm = new URLSearchParams(search).get('dialog') === 'deleteConfirm';
  const deleteTargetId = sp.get('addressId');

  const addresses = useCainiaoStore((s) => s.addresses);
  const query = useCainiaoStore((s) => s._temp.addressSearch);
  const multiSelect = useCainiaoStore((s) => s._temp.multiSelect);
  const batchSelect = useCainiaoStore((s) => s._temp.batchSelect);
  const setTemp = useCainiaoStore((s) => s.setTemp);
  const setRecipient = useCainiaoStore((s) => s.setRecipient);
  const addRecipients = useCainiaoStore((s) => s.addRecipients);
  const patchDraft = useCainiaoStore((s) => s.patchDraft);
  const deleteAddresses = useCainiaoStore((s) => s.deleteAddresses);
  const setAddressDraft = useCainiaoStore((s) => s.setAddressDraft);
  const showToast = useCainiaoStore((s) => s.showToast);
  const [batchMode, setBatchMode] = React.useState(false);

  const q = query.trim();
  const list = q
    ? addresses.filter((a) =>
        a.name.includes(q) || a.phone.includes(q) || `${a.province}${a.city}${a.district}${a.detail}`.includes(q) ||
        (a.tagAddress ?? '').includes(q) || (a.tagRelation ?? '').includes(q))
    : addresses;

  const isSelect = mode === 'recipient' || mode === 'sender';
  const isMulti = mode === 'multi';

  return (
    <div className="relative flex h-full flex-col bg-(--app-c-page-bg)" data-status-bar-foreground={isDark ? 'light' : 'dark'}>
      <TopBar title={isSelect || isMulti ? t('ship.title') : t('ship.addressbook')} />
      {/* 搜索 */}
      <div className="bg-(--app-c-card-bg) px-3 pb-2">
        <div className="flex h-10 items-center rounded-full bg-(--app-c-chip-bg) px-3">
          <IcSearch size={17} className="shrink-0 text-(--app-c-text-muted)" />
          <input
            data-action="ship.addressbook.search"
            data-action-type="input"
            value={query}
            onChange={(e) => setTemp({ addressSearch: e.target.value })}
            placeholder="搜索姓名、电话、地址、标签"
            className="ml-2 min-w-0 flex-1 border-none bg-transparent text-[14px] outline-none placeholder:text-(--app-c-text-muted)"
          />
        </div>
      </div>
      {(isSelect || isMulti) && (
        <button
          {...action('ship.addressbook.intl.wontfixToast', () => showToast(t('common.notOpen')))}
          className="cursor-pointer border-none bg-[#FFF7EC] px-4 py-2 text-left text-[13px] text-[#B4690E]"
        >
          菜鸟裹裹支持国际、港澳台寄件~ <span className="text-(--app-c-brand)">去查看 ›</span>
        </button>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3" data-scroll-container="main" data-scroll-direction="vertical">
        {list.map((a) => {
          const checked = isMulti ? multiSelect.includes(a.id) : batchSelect.includes(a.id);
          const tags = [a.tagRelation, a.tagAddress].filter(Boolean) as string[];
          const cardInner = (
            <>
              <div className="flex items-center gap-2">
                {mode === 'manage' && !batchMode && (
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00B578] text-[14px] text-white">
                    {a.name.slice(0, 1)}
                  </span>
                )}
                <span className="text-[17px] font-bold text-(--app-c-text-primary)">{a.name}</span>
                <span className="text-[16px] font-semibold text-(--app-c-text-primary)">{a.phone}</span>
              </div>
              <div className="mt-1.5 text-[13px] leading-5 text-(--app-c-text-secondary)">
                {tags.map((tg) => (
                  <span key={tg} className="mr-1 rounded bg-(--app-c-brand-soft) px-1 py-0.5 text-[11px] text-(--app-c-brand)">{tg}</span>
                ))}
                {a.province}{a.city}{a.district}{a.detail}
              </div>
            </>
          );

          return (
            <div key={a.id} className="mt-2.5 flex items-center rounded-2xl bg-(--app-c-card-bg) p-3.5">
              {(isMulti || batchMode) && (
                <button
                  {...(isMulti
                    ? action('ship.addressbook.multi.select.item', () =>
                        setTemp({ multiSelect: checked ? multiSelect.filter((x) => x !== a.id) : [...multiSelect, a.id] }),
                        { params: { addressId: a.id } })
                    : action('ship.addressbook.manage.toggle', () =>
                        setTemp({ batchSelect: checked ? batchSelect.filter((x) => x !== a.id) : [...batchSelect, a.id] })))}
                  className={`mr-3 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full border ${checked ? 'border-(--app-c-brand) bg-(--app-c-brand) text-[11px] text-white' : 'border-[#BBB] bg-(--app-c-card-bg) text-transparent'}`}
                >
                  ✓
                </button>
              )}
              {isSelect ? (
                <div
                  {...action('ship.addressbook.pick', () => {
                    if (mode === 'recipient') setRecipient([a.id]);
                    else if (mode === 'sender') patchDraft({ senderId: a.id });
                    back();
                  }, { params: { addressId: a.id } })}
                  className="min-w-0 flex-1 cursor-pointer"
                >
                  {cardInner}
                  <div className="mt-2 flex justify-end gap-4 border-t border-(--app-c-divider) pt-2 text-[13px] text-(--app-c-text-primary)">
                    <button
                      {...action('ship.addressbook.copy', () => { copyToClipboard(`${a.name} ${a.phone} ${a.province}${a.city}${a.district}${a.detail}`); showToast(t('common.copied')); })}
                      className="cursor-pointer border-none bg-transparent"
                      onClickCapture={(e) => e.stopPropagation()}
                    >
                      ⧉ 复制
                    </button>
                    <button
                      {...bindTap('ship.address.edit.open', { params: { addressId: a.id }, stopPropagation: true, beforeTrigger: () => setAddressDraft(a) })}
                      className="cursor-pointer border-none bg-transparent"
                    >
                      ✎ 编辑
                    </button>
                    <button
                      {...bindTap('ship.addressbook.delete.open', { params: { addressId: a.id }, stopPropagation: true })}
                      className="cursor-pointer border-none bg-transparent"
                    >
                      🗑 删除
                    </button>
                  </div>
                </div>
              ) : (
                <div className="min-w-0 flex-1">
                  {cardInner}
                  {mode === 'manage' && !batchMode && (
                    <div className="mt-2 flex justify-end gap-4 border-t border-(--app-c-divider) pt-2 text-[13px] text-(--app-c-text-primary)">
                      <button
                        {...action('ship.addressbook.copy', () => { copyToClipboard(`${a.name} ${a.phone} ${a.province}${a.city}${a.district}${a.detail}`); showToast(t('common.copied')); })}
                        className="cursor-pointer border-none bg-transparent"
                      >
                        ⧉ 复制
                      </button>
                    </div>
                  )}
                </div>
              )}
              {mode === 'manage' && !batchMode && (
                <button
                  {...bindTap('ship.address.edit.open', { params: { addressId: a.id }, beforeTrigger: () => setAddressDraft(a) })}
                  className="ml-2 shrink-0 cursor-pointer border-none bg-transparent p-1 text-(--app-c-text-muted)"
                >
                  <IcEdit size={17} />
                </button>
              )}
              {isMulti && checked && <IcCheckCircle size={18} className="ml-2 shrink-0 text-(--app-c-brand)" />}
            </div>
          );
        })}
        <div className="py-4 text-center text-[12px] text-(--app-c-text-muted)">{t('common.noMore')}</div>
      </div>

      {/* 底部操作栏 */}
      <div className="flex shrink-0 gap-3 bg-(--app-c-card-bg) px-4 pb-4 pt-2.5">
        {batchMode ? (
          <>
            <button
              {...action('ship.addressbook.manage.cancel', () => { setBatchMode(false); setTemp({ batchSelect: [] }); })}
              className="h-11 flex-1 cursor-pointer rounded-full border-none bg-[#E9F1FE] text-[15px] text-(--app-c-brand)"
            >
              取消
            </button>
            {batchSelect.length > 0 ? (
              <button
                {...bindTap('ship.addressbook.batchDelete.open')}
                className="h-11 flex-1 cursor-pointer rounded-full border-none bg-[#7FB2F5] text-[15px] font-semibold text-white"
              >
                删除
              </button>
            ) : (
              <div className="flex h-11 flex-1 items-center justify-center rounded-full bg-[#C9D9F2] text-[15px] text-white">删除</div>
            )}
          </>
        ) : isMulti ? (
          <>
            <button
              {...bindTap('ship.address.new.open', { beforeTrigger: () => setAddressDraft(null) })}
              className="h-11 flex-1 cursor-pointer rounded-full border border-(--app-c-brand) bg-(--app-c-card-bg) text-[15px] text-(--app-c-brand)"
            >
              {t('ship.newAddress')}
            </button>
            {multiSelect.length > 0 && (
              <button
                {...action('ship.addressbook.multi.confirm', () => { addRecipients(multiSelect); back(); })}
                className="h-11 flex-1 cursor-pointer rounded-full border-none bg-(--app-c-brand) text-[15px] font-semibold text-white"
              >
                确定({multiSelect.length})
              </button>
            )}
          </>
        ) : mode === 'manage' ? (
          <>
            <button
              {...action('ship.addressbook.manage.toggle', () => setBatchMode(true))}
              className="h-11 w-28 cursor-pointer rounded-full border-none bg-[#E9F1FE] text-[15px] text-(--app-c-brand)"
            >
              批量删除
            </button>
            <button
              {...bindTap('ship.address.new.open', { beforeTrigger: () => setAddressDraft(null) })}
              className="h-11 flex-1 cursor-pointer rounded-full border-none bg-(--app-c-brand) text-[15px] font-semibold text-white"
            >
              新建地址
            </button>
          </>
        ) : (
          <>
            <button
              {...action('ship.addressbook.manage.toggle', () => setBatchMode(true))}
              className="h-11 w-24 cursor-pointer rounded-full border-none bg-(--app-c-card-bg) text-[15px] text-(--app-c-text-primary)"
            >
              管理
            </button>
            <button
              {...bindTap('ship.address.new.open', { beforeTrigger: () => setAddressDraft(null) })}
              className="h-11 flex-1 cursor-pointer rounded-full border-none bg-(--app-c-brand) text-[15px] font-semibold text-white"
            >
              {t('ship.newAddress')}
            </button>
          </>
        )}
      </div>

      {showDeleteConfirm && (
        <ConfirmDialog
          text="确认删除该地址?"
          subText="删除后不可恢复"
          confirmLabel="删除"
          confirmBinding={action('ship.addressbook.deleteConfirm.confirm', () => {
            const ids = deleteTargetId ? [deleteTargetId] : batchSelect;
            deleteAddresses(ids);
            setBatchMode(false);
            back();
          })}
        />
      )}
    </div>
  );
}
