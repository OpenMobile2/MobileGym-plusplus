import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSlackGestures } from '../../hooks/useSlackGestures';
import { useI18n } from '../../i18n';
import { useSlackStore } from '../../state';
import { QUICK_VIEW_CARDS } from '../../constants';
import { NEUTRAL, BLUE } from '../../res/colors';
import { IcCheck, IcOverflow, IcHash, IcSearch, IcArrowRight, IcArrowLeft } from '../../res/icons';
import { IconRenderer } from '../../res/icons';
import Sheet, { PopoverMenu } from '../Sheet';
import Switch from '../Switch';
import type { Bind } from '../../types';

const RadioRow: React.FC<{
  label: string;
  checked: boolean;
  bindProps: Bind;
}> = ({ label, checked, bindProps }) => (
  <button
    {...bindProps}
    className="flex w-full items-center justify-between border-none bg-transparent px-5 py-3.5 text-left"
  >
    <span className="text-[16px]" style={{ color: NEUTRAL.textPrimary }}>
      {label}
    </span>
    {checked && <IcCheck size={20} style={{ color: BLUE.link }} />}
  </button>
);

/** 「排序条件」菜单（顶栏漏斗）—— 两组单选 */
export const SortMenu: React.FC = () => {
  const { action, back } = useSlackGestures();
  const { t } = useI18n();
  const homeSort = useSlackStore((s) => s.settings.homeSort);
  const unreadSort = useSlackStore((s) => s.settings.unreadSort);
  const setSetting = useSlackStore((s) => s.setSetting);

  return (
    <Sheet>
      <h3 className="px-5 pb-2 pt-1 text-[15px] font-bold" style={{ color: NEUTRAL.textSecondary }}>
        {t('sort.title')}
      </h3>
      <RadioRow
        label={t('sort.section')}
        checked={homeSort === 'section'}
        bindProps={action('slack.home.sort.select.section', () => {
          setSetting('homeSort', 'section');
          back();
        })}
      />
      <RadioRow
        label={t('sort.recent')}
        checked={homeSort === 'recent'}
        bindProps={action('slack.home.sort.select.recent', () => {
          setSetting('homeSort', 'recent');
          back();
        })}
      />
      <div className="my-1 h-px bg-[#EAEAEA]" />
      <h3 className="px-5 pb-2 pt-2 text-[15px] font-bold" style={{ color: NEUTRAL.textSecondary }}>
        {t('sort.unreadGroup')}
      </h3>
      <RadioRow
        label={t('sort.unreadTop')}
        checked={unreadSort === 'top'}
        bindProps={action('slack.home.unreadsort.select.top', () => {
          setSetting('unreadSort', 'top');
          back();
        })}
      />
      <RadioRow
        label={t('sort.unreadInline')}
        checked={unreadSort === 'inline'}
        bindProps={action('slack.home.unreadsort.select.inline', () => {
          setSetting('unreadSort', 'inline');
          back();
        })}
      />
    </Sheet>
  );
};

/** 「自定义主页」弹层（IMG_2381/2382） */
export const CustomizeSheet: React.FC = () => {
  const { bindTap, action } = useSlackGestures();
  const { t } = useI18n();
  const order = useSlackStore((s) => s.settings.customizeOrder);
  const enabled = useSlackStore((s) => s.settings.customizeEnabled);
  const toggleCard = useSlackStore((s) => s.toggleCustomizeCard);

  const cards = order
    .map((id) => QUICK_VIEW_CARDS.find((c) => c.id === id))
    .filter(Boolean) as (typeof QUICK_VIEW_CARDS)[number][];

  return (
    <Sheet>
      <div className="px-5 pb-3 pt-1">
        <h3 className="text-[20px] font-bold" style={{ color: NEUTRAL.textPrimary }}>
          {t('customize.title')}
        </h3>
        <p className="mt-1 text-[13px]" style={{ color: NEUTRAL.textSecondary }}>
          {t('customize.subtitle')}
        </p>
      </div>
      {cards.map((card) => (
        <div key={card.id} className="flex items-center gap-3 px-5 py-2.5">
          {card.id === 'unreadTidy' ? (
            <button
              {...bindTap('slack.customize.openunreads')}
              className="flex flex-1 items-center gap-3 border-none bg-transparent p-0 text-left"
            >
              <IconRenderer name={card.icon} size={20} style={{ color: NEUTRAL.textSecondary }} />
              <span className="text-[16px]" style={{ color: NEUTRAL.textPrimary }}>
                {t(card.labelKey)}
              </span>
            </button>
          ) : (
            <>
              <IconRenderer name={card.icon} size={20} style={{ color: NEUTRAL.textSecondary }} />
              <span className="flex-1 text-[16px]" style={{ color: NEUTRAL.textPrimary }}>
                {t(card.labelKey)}
              </span>
            </>
          )}
          {card.hasToggle && (
            <Switch
              on={enabled[card.id] ?? true}
              bindProps={action('slack.home.customize.card.toggle', () => toggleCard(card.id), {
                params: { cardId: card.id },
              })}
            />
          )}
          <button
            {...bindTap('slack.customize.openitemmenu', { params: { cardId: card.id } })}
            aria-label="move"
            className="border-none bg-transparent p-1"
            style={{ color: NEUTRAL.textSecondary }}
          >
            <IcOverflow size={20} />
          </button>
        </div>
      ))}
    </Sheet>
  );
};

/**
 * 自定义主页行 … 菜单（阶段④ 订正）：
 * 首项只有「移到该位置之后」，末项只有「移到该位置之前」，中间两项都有。
 */
export const CustomizeItemMenu: React.FC = () => {
  const { action, back } = useSlackGestures();
  const { t } = useI18n();
  const [params] = useSearchParams();
  const cardId = params.get('cardId') ?? '';
  const order = useSlackStore((s) => s.settings.customizeOrder);
  const move = useSlackStore((s) => s.moveCustomizeItem);

  const idx = order.indexOf(cardId);
  const canAfter = idx >= 0 && idx < order.length - 1;
  const canBefore = idx > 0;

  return (
    <PopoverMenu position="bottom-32 right-6">
      {canAfter && (
        <button
          {...action('slack.home.customizeitem.moveafter', () => {
            move(cardId, 'after');
            back();
          })}
          className="flex w-full items-center gap-3 border-none bg-transparent px-4 py-3 text-left"
        >
          <IcArrowRight size={18} style={{ color: NEUTRAL.textSecondary }} />
          <span className="text-[16px]" style={{ color: NEUTRAL.textPrimary }}>
            {t('customize.moveAfter')}
          </span>
        </button>
      )}
      {canBefore && (
        <button
          {...action('slack.home.customizeitem.movebefore', () => {
            move(cardId, 'before');
            back();
          })}
          className="flex w-full items-center gap-3 border-none bg-transparent px-4 py-3 text-left"
        >
          <IcArrowLeft size={18} style={{ color: NEUTRAL.textSecondary }} />
          <span className="text-[16px]" style={{ color: NEUTRAL.textPrimary }}>
            {t('customize.moveBefore')}
          </span>
        </button>
      )}
    </PopoverMenu>
  );
};

/** 「＋ 添加频道」气泡菜单（IMG_2370） */
export const AddChannelMenu: React.FC = () => {
  const { bindTap } = useSlackGestures();
  const { t } = useI18n();
  return (
    <PopoverMenu center>
      <button
        {...bindTap('slack.addchannel.create')}
        className="flex w-full items-center gap-3 border-none bg-transparent px-4 py-3.5 text-left"
      >
        <IcHash size={19} style={{ color: NEUTRAL.textSecondary }} />
        <span className="text-[16px]" style={{ color: NEUTRAL.textPrimary }}>
          {t('addChannel.create')}
        </span>
      </button>
      <button
        {...bindTap('slack.addchannel.browse')}
        className="flex w-full items-center gap-3 border-none bg-transparent px-4 py-3.5 text-left"
      >
        <IcSearch size={19} style={{ color: NEUTRAL.textSecondary }} />
        <span className="text-[16px]" style={{ color: NEUTRAL.textPrimary }}>
          {t('addChannel.browse')}
        </span>
      </button>
    </PopoverMenu>
  );
};
