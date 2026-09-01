import { cn } from '@/lib/utils';
import React, { PropsWithChildren } from 'react';

interface PanelCommonHeaderProps extends PropsWithChildren {
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  actions?: React.ReactNode[];
  actionsLabel?: string;
  className?: string;
}

/**
 * 右侧面板的头部
 */
export const PanelCommonHeader: React.FC<PanelCommonHeaderProps> = React.memo(
  (props) => {
    return (
      <header
        data-slot="panel-header"
        className={cn(
          'flex h-14 shrink-0 items-center gap-3 border-b bg-background/95 px-3 text-foreground supports-backdrop-filter:backdrop-blur-sm md:px-4',
          props.className
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {props.prefix && (
            <span className="shrink-0 text-muted-foreground">
              {props.prefix}
            </span>
          )}
          <div className="min-w-0 truncate text-sm font-semibold md:text-base">
            {props.children}
          </div>
          {props.suffix && <div className="shrink-0">{props.suffix}</div>}
        </div>

        {props.actions && props.actions.length > 0 && (
          <div
            className="ml-auto flex shrink-0 items-center gap-0.5"
            role="toolbar"
            aria-label={props.actionsLabel}
          >
            {props.actions}
          </div>
        )}
      </header>
    );
  }
);
PanelCommonHeader.displayName = 'PanelCommonHeader';
