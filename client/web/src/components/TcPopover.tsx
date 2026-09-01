import React, { useCallback, useContext, useMemo } from 'react';
import _noop from 'lodash/noop';
import { useAppPortalContainer } from '@/hooks/useAppPortalContainer';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/official/popover';

const TcPopoverContext = React.createContext({ closePopover: _noop });

export type TcPopoverPlacement =
  | 'top'
  | 'topLeft'
  | 'topRight'
  | 'bottom'
  | 'bottomLeft'
  | 'bottomRight'
  | 'left'
  | 'right';

const placementMap: Record<
  TcPopoverPlacement,
  {
    side: 'top' | 'bottom' | 'left' | 'right';
    align: 'start' | 'center' | 'end';
  }
> = {
  top: { side: 'top', align: 'center' },
  topLeft: { side: 'top', align: 'start' },
  topRight: { side: 'top', align: 'end' },
  bottom: { side: 'bottom', align: 'center' },
  bottomLeft: { side: 'bottom', align: 'start' },
  bottomRight: { side: 'bottom', align: 'end' },
  left: { side: 'left', align: 'center' },
  right: { side: 'right', align: 'center' },
};

export interface TcPopoverProps {
  /** ReactNode, 或零参数的渲染函数 (兼容旧 antd RenderFunction 用法) */
  content: React.ReactNode | (() => React.ReactNode);
  children: React.ReactElement;
  placement?: TcPopoverPlacement;
  onOpenChange?: (open: boolean) => void;
  /** Whether the trigger is a native button element. */
  nativeButton?: boolean;
  /** 对应旧 antd overlayClassName, 加在 popup 容器上 */
  overlayClassName?: string;
}

/**
 * 基于 Base UI 的 token 化 Popover (facelift ui/ 迁移) — 替代 antd Popover
 * 管理显示/隐藏; 子节点可通过 useTcPopoverContext() 主动关闭 (原 API 保留)
 */
export const TcPopover: React.FC<TcPopoverProps> = React.memo((props) => {
  const {
    content,
    children,
    placement = 'bottom',
    onOpenChange,
    nativeButton = false,
    overlayClassName,
  } = props;
  const [visible, setVisible] = React.useState(false);
  const portalContainer = useAppPortalContainer();

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setVisible(open);
      onOpenChange?.(open);
    },
    [onOpenChange]
  );

  const closePopover = useCallback(() => {
    setVisible(false);
    onOpenChange?.(false);
  }, [onOpenChange]);

  const handler = useMemo(() => ({ closePopover }), [closePopover]);
  const { side, align } = placementMap[placement];

  return (
    <TcPopoverContext.Provider value={handler}>
      <Popover open={visible} onOpenChange={handleOpenChange}>
        <PopoverTrigger nativeButton={nativeButton} render={children} />
        <PopoverContent
          side={side}
          align={align}
          sideOffset={6}
          portalContainer={portalContainer}
          className={overlayClassName}
        >
          {typeof content === 'function'
            ? React.createElement(content as React.ComponentType)
            : content}
        </PopoverContent>
      </Popover>
    </TcPopoverContext.Provider>
  );
});
TcPopover.displayName = 'TcPopover';

export function useTcPopoverContext() {
  const context = useContext(TcPopoverContext);

  return {
    closePopover: context?.closePopover ?? _noop,
  };
}
