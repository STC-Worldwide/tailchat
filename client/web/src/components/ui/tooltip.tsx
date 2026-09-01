import React from 'react';
import { useAppPortalContainer } from '@/hooks/useAppPortalContainer';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './official/tooltip';

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
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent side={side} sideOffset={6} portalContainer={portalContainer}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
});
TcTooltip.displayName = 'TcTooltip';

/**
 * 挂在应用根部一次即可; Base UI 的 tooltip 分组延迟共享需要 Provider
 */
export const TcTooltipProvider = TooltipProvider;

export { Tooltip, TooltipContent, TooltipTrigger };
