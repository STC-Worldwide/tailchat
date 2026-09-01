import React, { PropsWithChildren } from 'react';
import { t, useGroupPanelInfo } from 'tailchat-shared';
import {
  CommonPanelWrapper,
  CommonPanelWrapperProps,
} from '../../common/Wrapper';
import _isNil from 'lodash/isNil';
import { usePanelWindow } from '@/hooks/usePanelWindow';
import { OpenedPanelTip } from '@/components/OpenedPanelTip';
import { PanelActionButton } from '../../common/PanelActionButton';
import { PanelTopOpenIcon } from 'lucide-react';

interface GroupPanelWithHeader extends PropsWithChildren {
  groupId: string;
  panelId: string;

  prefixActions?: CommonPanelWrapperProps['actions'];
  suffixActions?: CommonPanelWrapperProps['actions'];
}
export const GroupPanelContainer: React.FC<GroupPanelWithHeader> = React.memo(
  (props) => {
    const { groupId, panelId } = props;
    const panelInfo = useGroupPanelInfo(groupId, panelId);
    const { hasOpenedPanel, openPanelWindow, closePanelWindow } =
      usePanelWindow(`/panel/group/${groupId}/${panelId}`);

    if (_isNil(panelInfo)) {
      return null;
    }

    if (hasOpenedPanel) {
      return <OpenedPanelTip onClosePanelWindow={closePanelWindow} />;
    }

    return (
      <CommonPanelWrapper
        header={panelInfo.name}
        actions={(ctx) => [
          ...(props.prefixActions?.(ctx) ?? []),
          <PanelActionButton
            key="open"
            label={t('在新窗口打开')}
            icon={<PanelTopOpenIcon />}
            onClick={openPanelWindow}
          />,
          ...(props.suffixActions?.(ctx) ?? []),
        ]}
      >
        {props.children}
      </CommonPanelWrapper>
    );
  }
);
GroupPanelContainer.displayName = 'GroupPanelWithHeader';
