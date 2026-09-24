import React from 'react';
import { GREEN } from '../res/colors';
import type { Bind } from '../types';

/** iOS 风格开关。开启态用 Slack Green #007A5A（实测「自定义主页」各行开关） */
const Switch: React.FC<{ on: boolean; bindProps?: Bind }> = ({
  on,
  bindProps,
}) => (
  <button
    {...bindProps}
    role="switch"
    aria-checked={on}
    className="relative h-[31px] w-[51px] flex-shrink-0 rounded-full border-none p-0 transition-colors"
    style={{ backgroundColor: on ? GREEN.primary : '#D6D6D6' }}
  >
    <span
      className="absolute top-[2px] h-[27px] w-[27px] rounded-full bg-white transition-all"
      style={{ left: on ? 22 : 2, boxShadow: '0 1px 3px rgba(0,0,0,0.25)' }}
    />
  </button>
);

export default Switch;
