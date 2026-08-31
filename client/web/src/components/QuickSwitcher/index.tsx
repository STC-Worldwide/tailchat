import { stopPropagation } from '@/utils/dom-helper';
import React, { useCallback } from 'react';
import { Command } from 'cmdk';
import { t } from 'tailchat-shared';
import { PortalAdd, PortalRemove } from '../Portal';
import { useGlobalKeyDown } from '@/hooks/useGlobalKeyDown';
import { isEscHotkey } from '@/utils/hot-key';
import { useQuickSwitcherActionContext } from './useQuickSwitcherActionContext';
import { useQuickSwitcherAllActions } from './useQuickSwitcherAllAction';

let currentQuickSwitcherKey: number | null = null;

const QuickSwitcher: React.FC = React.memo(() => {
  const actionContext = useQuickSwitcherActionContext();
  const allActions = useQuickSwitcherAllActions();

  const handleClose = useCallback(() => {
    if (!currentQuickSwitcherKey) {
      return;
    }

    PortalRemove(currentQuickSwitcherKey);
    currentQuickSwitcherKey = null;
  }, []);

  // 上下键/回车由 cmdk 内部处理, 这里只处理 Esc
  useGlobalKeyDown((e) => {
    if (isEscHotkey(e)) {
      handleClose();
    }
  });

  return (
    <div
      className="fixed inset-0 bg-black/60 flex justify-center z-10"
      onClick={handleClose}
    >
      <Command
        label={t('快速搜索、跳转')}
        className="self-start mt-[20vh] w-[560px] max-w-[90vw] bg-raised text-body rounded-lg shadow-elevationHigh border border-subtle overflow-hidden"
        onClick={stopPropagation}
      >
        <Command.Input
          autoFocus={true}
          placeholder={t('快速搜索、跳转')}
          className="w-full bg-transparent border-0 border-b border-subtle outline-none px-4 py-3 text-lg text-body placeholder:text-muted"
        />
        <Command.List className="max-h-[50vh] overflow-y-auto p-2 thin-scrollbar">
          <Command.Empty className="px-3 py-6 text-center text-muted">
            {t('无搜索结果')}
          </Command.Empty>
          {allActions.map((action) => (
            <Command.Item
              key={action.key}
              // key 后缀保证重名 label 的唯一性
              value={`${action.label}#${action.key}`}
              onSelect={() => {
                action.action(actionContext);
                handleClose();
              }}
              className="px-3 py-2 rounded cursor-pointer data-[selected=true]:bg-primary/15"
            >
              <div className="truncate">{action.label}</div>
              <div className="text-xs text-muted">{action.source}</div>
            </Command.Item>
          ))}
        </Command.List>
      </Command>
    </div>
  );
});
QuickSwitcher.displayName = 'QuickSwitcher';

/**
 * 打开快速开关
 */
export function openQuickSwitcher() {
  if (typeof currentQuickSwitcherKey === 'number') {
    return;
  }

  currentQuickSwitcherKey = PortalAdd(<QuickSwitcher />);
}
