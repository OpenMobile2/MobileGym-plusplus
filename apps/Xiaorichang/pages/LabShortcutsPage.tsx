import React from 'react';
import { useXiaorichangStore } from '../state';
import { useXiaorichangGestures } from '../hooks/useXiaorichangGestures';
import { useStrings } from '../hooks/useStrings';
import { PageHeader } from '../components/common';
import { IcRight, IcHelp } from '../res/icons';

/**
 * 快捷指令(Gate4 补拍 s249)。原裁定整页 wontfix,证明有误:
 * 两条快捷指令实质就是跳到小事快捷输入 / 笔记编辑,App 内完全可实现。
 * 仅『查看使用教程』需外部页面,保留 toast。
 */
export default function LabShortcutsPage() {
  const st = useXiaorichangStore();
  const { bindTap, action } = useXiaorichangGestures();
  const s = useStrings();
  return (
    <div className="flex h-full flex-col bg-[#F5F6F7]" data-status-bar-foreground="dark">
      <PageHeader title="快捷指令" />
      <div className="px-4">
        <div className="rounded-2xl bg-white p-4 text-xs leading-relaxed text-[#9AA5B1]">
          快捷方式可以使您在 APP 外完成一些操作,譬如快速添加小事、快速记录笔记等。
          您可以将快捷方式放置在桌面,点击即可使用。具体可以参见以下教程。
        </div>
        <button {...action('lab.shortcuts.tutorial.wontfixToast', () => st.showNotice(s.notAvailable))}
          className="mt-3 flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3.5 text-sm text-[#424242]">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#4FB0AF] text-white">
            <IcHelp size={13} />
          </span>
          <span className="flex-1 text-left">查看快捷指令使用教程</span>
          <IcRight size={15} className="text-[#C9CDD3]" />
        </button>

        <div className="mt-4 text-xs text-[#9AA5B1]">快捷指令</div>
        <button {...bindTap('lab.shortcuts.todo')}
          className="mt-2 flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3.5 text-left text-sm text-[#424242]">
          <span className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#3A2A6B] to-[#1B1740]" />
          快速添加小事
        </button>
        <button {...bindTap('lab.shortcuts.note')}
          className="mt-2 flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3.5 text-left text-sm text-[#424242]">
          <span className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#3A2A6B] to-[#1B1740]" />
          快速写笔记
        </button>
      </div>
    </div>
  );
}
