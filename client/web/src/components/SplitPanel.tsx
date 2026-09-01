import clsx from 'clsx';
import React, { PropsWithChildren } from 'react';
import { t, useStorage } from 'tailchat-shared';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/official/resizable';

interface SplitPanelProps extends PropsWithChildren {
  className?: string;
}
export const SplitPanel: React.FC<SplitPanelProps> = React.memo((props) => {
  const [sizes, { save: saveSizes }] = useStorage('pin-sizes', [90, 10]);
  const children = React.Children.toArray(props.children);
  const storedSizes = sizes ?? [90, 10];

  const handleLayoutChanged = (
    layout: Record<string, number>,
    meta: { isUserInteraction: boolean }
  ) => {
    if (meta.isUserInteraction) {
      saveSizes([layout.primary, layout.pinned]);
    }
  };

  return (
    <ResizablePanelGroup
      id="pinned-panel-split"
      orientation="horizontal"
      className={clsx('min-w-0', props.className)}
      defaultLayout={{ primary: storedSizes[0], pinned: storedSizes[1] }}
      onLayoutChanged={handleLayoutChanged}
    >
      <ResizablePanel id="primary" minSize={250}>
        {children[0]}
      </ResizablePanel>
      <ResizableHandle
        withHandle
        aria-label={t('调整分栏大小')}
        className="bg-border/70 transition-colors hover:bg-primary/60 focus-visible:bg-primary/60"
      />
      <ResizablePanel id="pinned" minSize={250}>
        {children[1]}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
});
SplitPanel.displayName = 'SplitPanel';
