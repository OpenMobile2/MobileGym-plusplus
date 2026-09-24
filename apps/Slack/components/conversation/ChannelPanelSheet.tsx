import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSlackGestures } from '../../hooks/useSlackGestures';
import { useI18n } from '../../i18n';
import { PANEL_ACTIONS, PANEL_ROWS, PANEL_MORE_ROWS } from '../../constants';
import { NEUTRAL, RED } from '../../res/colors';
import { IconRenderer, IcClose, IcOverflow, IcChevronRight } from '../../res/icons';
import { PopoverMenu } from '../Sheet';
import type { Conversation } from '../../types';
import type { Bind } from '../../types';

const ChannelPanelSheet: React.FC<{
  conv: Conversation;
  rowBinds: Record<string, Bind | undefined>;
  moreRowBinds: Record<string, Bind | undefined>;
  starBind: Bind;
  copyLink: () => void;
}> = ({ conv, rowBinds, moreRowBinds, starBind, copyLink }) => {
  const { bindBack, bindTap, action } = useSlackGestures();
  const { t } = useI18n();
  const [params] = useSearchParams();
  const menuMore = params.get('menu') === 'more';

  const actionBinds: Record<string, Bind> = {
    add: bindTap('slack.panel.addmembers', { params: { convId: conv.id } }),
    star: starBind,
    search: bindTap('slack.panel.search'),
  };

  const rowLabel = (id: string, labelKey: string) => {
    if (id === 'members') return `${t(labelKey)} ${conv.memberIds.length}`;
    if (id === 'notifications') return `${t(labelKey)} ${t('panel.notificationsValue')}`;
    return t(labelKey);
  };

  return (
    <div className="absolute inset-0 z-50">
      <div {...bindBack()} className="absolute inset-0 bg-black/40" aria-label="close-panel" />
      <div className="relative rounded-b-2xl bg-white pb-4 shadow-lg">
        <div className="flex items-center justify-between px-4 pt-3">
          <button
            {...bindBack()}
            aria-label="close"
            className="flex h-9 w-9 items-center justify-center rounded-full border-none bg-[#F3F3F3]"
            style={{ color: NEUTRAL.textPrimary }}
          >
            <IcClose size={19} />
          </button>
          <button
            {...bindTap('slack.panel.openmore', { params: { convId: conv.id } })}
            aria-label="more"
            className="flex h-9 w-9 items-center justify-center rounded-full border-none bg-[#F3F3F3]"
            style={{ color: NEUTRAL.textPrimary }}
          >
            <IcOverflow size={20} />
          </button>
        </div>

        <div className="px-4 pb-3">
          <h2 className="text-[22px] font-bold" style={{ color: NEUTRAL.textPrimary }}>
            #{conv.name}
          </h2>
          <p className="text-[14px]" style={{ color: NEUTRAL.textSecondary }}>
            {t('conv.members', { n: conv.memberIds.length })} · {t('panel.tags', { n: 0 })}
          </p>
        </div>

        <div className="flex gap-2 px-4 pb-3">
          {PANEL_ACTIONS.map((a) => (
            <button
              key={a.id}
              {...actionBinds[a.id]}
              className="flex flex-1 flex-col items-center gap-1 rounded-xl border border-[#EAEAEA] bg-white py-2.5"
            >
              <IconRenderer name={a.icon} size={20} style={{ color: NEUTRAL.textPrimary }} />
              <span className="text-[13px]" style={{ color: NEUTRAL.textPrimary }}>
                {a.id === 'star' && conv.starred ? t('panel.starred') : t(a.labelKey)}
              </span>
            </button>
          ))}
        </div>

        <div className="border-t border-[#EAEAEA]">
          {PANEL_ROWS.map((row) => {
            const bind = rowBinds[row.id];
            const current = row.id === 'messages';
            return (
              <button
                key={row.id}
                {...(bind ?? {})}
                className="flex w-full items-center gap-3 border-none px-4 py-3 text-left"
                style={{
                  backgroundColor: current ? '#F3F3F3' : 'transparent',
                  color: NEUTRAL.textPrimary,
                }}
              >
                <IconRenderer name={row.icon} size={20} />
                <span className="flex-1 text-[16px]">{rowLabel(row.id, row.labelKey)}</span>
                {('chevron' in row && row.chevron) && (
                  <IcChevronRight size={18} style={{ color: NEUTRAL.textSecondary }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {menuMore && (
        <PopoverMenu position="top-28 right-4">
          {PANEL_MORE_ROWS.map((row) => {
            const bind =
              row.id === 'copyLink'
                ? action('slack.channel.panelmore.copylink', () => {
                    copyLink();
                  })
                : moreRowBinds[row.id];
            const danger = 'danger' in row && row.danger;
            return (
              <button
                key={row.id}
                {...(bind ?? {})}
                className="flex w-full items-center gap-3 border-t border-[#EAEAEA] bg-transparent px-4 py-3 text-left first:border-t-0"
                style={{ color: danger ? RED.destructive : NEUTRAL.textPrimary }}
              >
                <IconRenderer name={row.icon} size={18} />
                <span className="text-[16px]">{t(row.labelKey)}</span>
              </button>
            );
          })}
        </PopoverMenu>
      )}
    </div>
  );
};

export default ChannelPanelSheet;
