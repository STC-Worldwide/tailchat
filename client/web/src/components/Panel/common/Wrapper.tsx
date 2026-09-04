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
import { useLocalStorageState } from '@/hooks/useLocalStorage';
import { localTrans, t } from 'tailchat-shared';
import { PanelActionButton } from './PanelActionButton';
import { XIcon } from 'lucide-react';

interface RightPanelType {
  name: string;
  panel: React.ReactNode;
}

/**
 * 常驻侧边栏。
 *
 * 和 `setRightPanel` 打开的那种一次性面板不一样: 这个默认开着, 开关状态按
 * `storageKey` 记在 localStorage 里, 换频道也不会掉 —— 成员列表这种东西关一次就该
 * 一直关着, 而不是每进一个频道重新关一遍。
 */
export interface SidePanelType {
  storageKey: string;
  name: string;
  panel: React.ReactNode;
}

export interface PanelActionContext {
  setRightPanel: (info: RightPanelType) => void;
  /** 常驻侧边栏当前是否展开; 没配 sidePanel 时恒为 false */
  sidePanelOpen: boolean;
  toggleSidePanel: () => void;
}

/**
 * 面板通用包装器
 */
export interface CommonPanelWrapperProps extends PropsWithChildren {
  header: React.ReactNode;
  actions?: (ctx: PanelActionContext) => React.ReactElement[];
  sidePanel?: SidePanelType;
}
export const CommonPanelWrapper: React.FC<CommonPanelWrapperProps> = React.memo(
  (props) => {
    const [rightPanel, setRightPanel] = useState<RightPanelType>();
    const isMobile = useIsMobile();
    const portalContainer = useAppPortalContainer();
    const closeRightPanel = () => setRightPanel(undefined);

    /**
     * 没存过就用默认值: 桌面端默认展开, 手机上默认收起 —— 手机没有并排的位置, 侧
     * 边栏是盖住整屏的抽屉, 一进频道就糊上来没法看消息。存过之后两边都听用户的。
     */
    const [sidePanelStored, setSidePanelStored] = useLocalStorageState<
      boolean | undefined
    >(props.sidePanel?.storageKey ?? 'panel:sidePanel', {
      defaultValue: undefined,
    });
    const sidePanelOpen = Boolean(
      props.sidePanel && (sidePanelStored ?? !isMobile)
    );
    // 按当前呈现的状态取反, 而不是按存着的值 —— 存着的可能还是 undefined
    const toggleSidePanel = () => setSidePanelStored(!sidePanelOpen);

    /**
     * 一次性面板压过常驻侧边栏: 两者共用右边这一格, 搜索结果看完关掉就回到成员列表。
     */
    const activePanel: RightPanelType | undefined =
      rightPanel ?? (sidePanelOpen ? props.sidePanel : undefined);
    const closeActivePanel = rightPanel ? closeRightPanel : toggleSidePanel;

    const rightPanelContent = activePanel ? (
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
              onClick={closeActivePanel}
            />,
          ]}
        >
          {activePanel.name}
        </PanelCommonHeader>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {activePanel.panel}
        </div>
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
            actions={
              props.actions &&
              props.actions({ setRightPanel, sidePanelOpen, toggleSidePanel })
            }
          >
            {props.header}
          </PanelCommonHeader>
          <div className="flex-1 overflow-hidden">{props.children}</div>
        </div>

        {/* 右侧面板 */}
        {isMobile ? (
          <Sheet
            open={Boolean(activePanel)}
            onOpenChange={(open) => !open && closeActivePanel()}
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
                <SheetTitle>{activePanel?.name}</SheetTitle>
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
          activePanel && (
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
