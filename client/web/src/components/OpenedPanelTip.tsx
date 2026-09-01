import React from 'react';
import { t } from 'tailchat-shared';
import { Button } from '@/components/ui/official/button';

interface OpenedPanelTipProps {
  onClosePanelWindow: () => void;
}

/**
 * 该面板已被打开提示
 */
export const OpenedPanelTip: React.FC<OpenedPanelTipProps> = React.memo(
  (props) => {
    return (
      <div className="flex w-full flex-col items-center gap-4 p-8 text-center">
        <h3 className="text-lg font-semibold">
          {t('当前面板已在独立窗口打开')}
        </h3>
        <Button
          type="button"
          variant="secondary"
          onClick={props.onClosePanelWindow}
        >
          {t('关闭独立窗口')}
        </Button>
      </div>
    );
  }
);
OpenedPanelTip.displayName = 'OpenedPanelTip';
