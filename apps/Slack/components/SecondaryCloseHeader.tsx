import React from 'react';
import { useSlackGestures } from '../hooks/useSlackGestures';
import { NEUTRAL } from '../res/colors';
import { IcClose } from '../res/icons';

const SecondaryCloseHeader: React.FC<{
  title: string;
  right?: React.ReactNode;
}> = ({ title, right }) => {
  const { bindBack } = useSlackGestures();
  return (
    <div className="flex flex-shrink-0 items-center gap-2 px-4 pb-2 pt-11">
      <button
        {...bindBack()}
        aria-label="close"
        className="flex h-9 w-9 items-center justify-center rounded-full border-none bg-[#F3F3F3]"
        style={{ color: NEUTRAL.textPrimary }}
      >
        <IcClose size={19} />
      </button>
      <h1 className="flex-1 text-center text-[17px] font-bold" style={{ color: NEUTRAL.textPrimary }}>
        {title}
      </h1>
      {right ?? <span className="w-9" />}
    </div>
  );
};

export default SecondaryCloseHeader;
