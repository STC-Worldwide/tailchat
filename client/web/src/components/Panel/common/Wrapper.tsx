import React, { PropsWithChildren, useState } from 'react';
import { PanelCommonHeader } from '../common/Header';
import { useIsMobile } from '@/hooks/useIsMobile';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/official/sheet';
import { useAppPortalContainer } from '@/hooks/useAppPortalContainer';
import { localTrans, t } from 'tailchat-shared';
import { PanelActionButton } from './PanelActionButton';
import { XIcon } from 'lucide-react';

interface RightPanelType {
  name: string;
  panel: React.ReactNode;
}

/**
 * 面板通用包装器
 */
export interface CommonPanelWrapperProps extends PropsWithChildren {
  header: React.ReactNode;
  actions?: (ctx: {
    setRightPanel: (info: RightPanelType) => void;
  }) => React.ReactElement[];
}
export const CommonPanelWrapper: React.FC<CommonPanelWrapperProps> = React.memo(
  (props) => {
    const [rightPanel, setRightPanel] = useState<RightPanelType>();
    const isMobile = useIsMobile();
    const portalContainer = useAppPortalContainer();
    const closeRightPanel = () => setRightPanel(undefined);

    const rightPanelContent = rightPanel ? (
      <>
        <PanelCommonHeader
          actionsLabel={localTrans({
            'zh-CN': '辅助面板操作',
            'en-US': 'Secondary panel actions',
          })}
          actions={[
            <PanelActionButton
              key="close"
              label={t('关闭')}
              icon={<XIcon />}
              onClick={closeRightPanel}
            />,
          ]}
        >
          {rightPanel.name}
        </PanelCommonHeader>
        <div className="min-h-0 flex-1 overflow-y-auto">{rightPanel.panel}</div>
      </>
    ) : null;

    return (
      <div className="flex h-full min-w-0 w-full bg-background text-foreground">
        {/* 主面板 */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <PanelCommonHeader
            actionsLabel={localTrans({
              'zh-CN': '面板操作',
              'en-US': 'Panel actions',
            })}
            actions={props.actions && props.actions({ setRightPanel })}
          >
            {props.header}
          </PanelCommonHeader>
          <div className="flex-1 overflow-hidden">{props.children}</div>
        </div>

        {/* 右侧面板 */}
        {isMobile ? (
          <Sheet
            open={Boolean(rightPanel)}
            onOpenChange={(open) => !open && closeRightPanel()}
          >
            <SheetContent
              portalContainer={portalContainer}
              side="right"
              closeLabel={t('关闭')}
              showCloseButton={false}
              className="w-full gap-0 p-0 data-[side=right]:w-full"
              style={{ maxWidth: '100%' }}
            >
              <SheetHeader className="sr-only">
                <SheetTitle>{rightPanel?.name}</SheetTitle>
                <SheetDescription>
                  {localTrans({
                    'zh-CN': '辅助面板内容',
                    'en-US': 'Secondary panel content',
                  })}
                </SheetDescription>
              </SheetHeader>
              {rightPanelContent}
            </SheetContent>
          </Sheet>
        ) : (
          rightPanel && (
            <aside className="flex h-full w-96 max-w-[40%] shrink-0 flex-col border-l bg-card">
              {rightPanelContent}
            </aside>
          )
        )}
      </div>
    );
  }
);
CommonPanelWrapper.displayName = 'CommonPanelWrapper';
