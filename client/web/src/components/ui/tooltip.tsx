import React from 'react';
import { Tooltip } from '@base-ui-components/react/tooltip';
import { useAppPortalContainer } from '@/hooks/useAppPortalContainer';

/**
 * 基于 Base UI 的 token 化 Tooltip (facelift ui/ 基础组件)
 *
 * 用法: <TcTooltip label={someLabel}><button .../></TcTooltip>
 * trigger 直接渲染为传入的子元素(不会额外包一层 button)
 */
export const TcTooltip: React.FC<{
  label: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactElement;
}> = React.memo(({ label, side = 'top', children }) => {
  const portalContainer = useAppPortalContainer();

  return (
    <Tooltip.Root>
      <Tooltip.Trigger render={children} />
      <Tooltip.Portal container={portalContainer}>
        <Tooltip.Positioner side={side} sideOffset={6} className="z-50">
          <Tooltip.Popup className="rounded-md bg-raised text-body border border-subtle shadow-elevationMedium px-2 py-1 text-xs select-none">
            {label}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
});
TcTooltip.displayName = 'TcTooltip';

/**
 * 挂在应用根部一次即可; Base UI 的 tooltip 分组延迟共享需要 Provider
 */
export const TcTooltipProvider = Tooltip.Provider;
