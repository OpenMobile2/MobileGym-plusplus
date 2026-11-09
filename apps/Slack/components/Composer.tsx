import React from 'react';
import { useI18n } from '../i18n';
import { COMPOSER_TOOLS, FORMAT_TOOLS } from '../constants';
import { NEUTRAL, GREEN, RED, HIGHLIGHT } from '../res/colors';
import { IconRenderer, IcClose, IcCheck, IcSend, IcMic, IcEdit } from '../res/icons';
import AsyncFsImage from '@/os/components/AsyncFsImage';
import type { Attachment, Bind } from '../types';

export type ComposerBinds = {
  input: Bind;
  send: Bind;
  /** 工具条各键。format 态下由 formatApply + closeFormat 接手 */
  tool: (id: string) => Bind;
  formatApply?: (id: string) => Bind;
  closeFormat?: Bind;
  mic?: Bind;
  removeAttachment?: Bind;
  editSave?: Bind;
  editCancel?: Bind;
};

/**
 * 会话输入栏。四种形态：
 * 空态（右侧麦克风）/ 输入态（工具条 + 绿色发送键）/ 格式态（✕ B I S̶ …）/ 编辑态（红 ✕ 绿 ✓）。
 */
const Composer: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  binds: ComposerBinds;
  /** 待发送的附件缩略图 */
  attachment?: Attachment | null;
  /** 格式工具条展开 */
  formatOpen?: boolean;
  /** 编辑已有消息 */
  editing?: boolean;
  /** 消息列底部的「同时发送至 #频道」勾选行 */
  aboveRow?: React.ReactNode;
  /** 该页不提供的工具键直接不画（宁可不做，不要做错） */
  hideTools?: string[];
}> = ({
  value,
  onChange,
  placeholder,
  binds,
  attachment = null,
  formatOpen = false,
  editing = false,
  aboveRow,
  hideTools = [],
}) => {
  const { t } = useI18n();
  const [engaged, setEngaged] = React.useState(false);
  const showTools = engaged || value.trim().length > 0 || Boolean(attachment) || editing;
  const canSend = value.trim().length > 0 || Boolean(attachment);

  return (
    <div
      data-keep-keyboard="true"
      className="flex-shrink-0 border-t border-[#EAEAEA] bg-white px-3 pb-2 pt-2"
    >
      {aboveRow}

      {editing && (
        <p
          className="mb-1.5 flex items-center gap-1.5 rounded px-2 py-1 text-[13px]"
          style={{ backgroundColor: HIGHLIGHT, color: NEUTRAL.textSecondary }}
        >
          <IcEdit size={13} />
          {t('composer.editing')}
        </p>
      )}

      {attachment && (
        <div className="mb-1.5 flex items-center gap-2">
          {attachment.uri ? (
            attachment.uri.startsWith('/') ? (
              <AsyncFsImage
                path={attachment.uri}
                alt=""
                className="h-14 w-14 flex-shrink-0 rounded-lg object-cover"
              />
            ) : (
              <img
                src={attachment.uri}
                alt=""
                className="h-14 w-14 flex-shrink-0 rounded-lg object-cover"
              />
            )
          ) : (
            <span
              className="h-14 w-14 flex-shrink-0 rounded-lg"
              style={{ backgroundColor: attachment.color ?? '#DDDDDD' }}
            />
          )}
          <span className="min-w-0 flex-1 truncate text-[13px]" style={{ color: NEUTRAL.textSecondary }}>
            {attachment.name ?? t('attach.imageAdded')}
          </span>
          {binds.removeAttachment && (
            <button
              {...binds.removeAttachment}
              aria-label="remove-attachment"
              className="flex h-7 w-7 items-center justify-center rounded-full border-none bg-[#F3F3F3]"
              style={{ color: NEUTRAL.textPrimary }}
            >
              <IcClose size={15} />
            </button>
          )}
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* 空态也要露出左侧 ＋（真机 IMG / scope：＋ + 输入框 + 麦克风） */}
        {!showTools && !editing && !hideTools.includes('attach') && (
          <button
            {...binds.tool('attach')}
            aria-label={t('composer.attach')}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-none bg-[#F3F3F3]"
            style={{ color: NEUTRAL.textPrimary }}
          >
            <IconRenderer name="IcPlus" size={19} />
          </button>
        )}
        <textarea
          {...binds.input}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setEngaged(true)}
          rows={1}
          placeholder={placeholder}
          className="max-h-28 min-w-0 flex-1 resize-none rounded-2xl border border-[#DDDDDD] px-3 py-2 text-[16px] outline-none"
          style={{ color: NEUTRAL.textPrimary, backgroundColor: NEUTRAL.bgInput }}
        />

        {!showTools && binds.mic && (
          <button
            {...binds.mic}
            aria-label="mic"
            className="flex h-9 w-9 items-center justify-center rounded-full border-none bg-transparent"
            style={{ color: NEUTRAL.textSecondary }}
          >
            <IcMic size={20} />
          </button>
        )}

        {editing && (
          <>
            <button
              {...(binds.editCancel ?? {})}
              aria-label="cancel-edit"
              className="flex h-9 w-9 items-center justify-center rounded-full border-none bg-transparent"
              style={{ color: RED.primary }}
            >
              <IcClose size={20} />
            </button>
            <button
              {...(binds.editSave ?? {})}
              aria-label="save-edit"
              className="flex h-9 w-9 items-center justify-center rounded-full border-none"
              style={{ backgroundColor: GREEN.primary, color: '#FFFFFF' }}
            >
              <IcCheck size={19} />
            </button>
          </>
        )}
      </div>

      {showTools && !editing && (
        <div className="mt-1.5 flex items-center gap-1">
          {formatOpen ? (
            <>
              <button
                {...(binds.closeFormat ?? {})}
                aria-label="close-format"
                className="flex h-8 w-8 items-center justify-center rounded-full border-none bg-transparent"
                style={{ color: NEUTRAL.textPrimary }}
              >
                <IcClose size={18} />
              </button>
              <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
                {FORMAT_TOOLS.map((f) => (
                  <button
                    key={f.id}
                    {...(binds.formatApply?.(f.id) ?? {})}
                    aria-label={f.id}
                    className="flex h-8 min-w-8 items-center justify-center rounded border-none bg-transparent px-1 text-[15px]"
                    style={{ color: NEUTRAL.textPrimary }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="flex min-w-0 flex-1 items-center gap-1">
              {COMPOSER_TOOLS.filter((tool) => !hideTools.includes(tool.id)).map((tool) => (
                <button
                  key={tool.id}
                  {...binds.tool(tool.id)}
                  aria-label={t(tool.labelKey)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-none bg-transparent"
                  style={{ color: NEUTRAL.textSecondary }}
                >
                  <IconRenderer name={tool.icon} size={19} />
                </button>
              ))}
            </div>
          )}

          <button
            {...binds.send}
            disabled={!canSend}
            aria-label="send"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-none"
            style={{
              backgroundColor: canSend ? GREEN.primary : '#E4E4E4',
              color: canSend ? '#FFFFFF' : '#A9A9A9',
            }}
          >
            <IcSend size={17} />
          </button>
        </div>
      )}
    </div>
  );
};

export default Composer;
