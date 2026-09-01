import React, { PropsWithChildren } from 'react';
import { useSidebarContext } from '../SidebarContext';
import _isNil from 'lodash/isNil';
import { EventTypes, useDrag, UserDragConfig } from '@use-gesture/react';
import { useIsMobile } from '@/hooks/useIsMobile';
import clsx from 'clsx';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { ReactDOMAttributes } from '@use-gesture/react/dist/declarations/src/types';
import { localTrans, t, useWatch } from 'tailchat-shared';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/official/sheet';
import { useAppPortalContainer } from '@/hooks/useAppPortalContainer';
import { useLocation } from 'react-router';

interface PageContentRootProps extends PropsWithChildren<ReactDOMAttributes> {
  className?: string;
  style?: React.CSSProperties;
}
const PageContentRoot: React.FC<PageContentRootProps> = ({
  className,
  style,
  children,
  ...others
}) => (
  <div
    {...others}
    style={style}
    className={clsx('flex flex-row flex-1 overflow-hidden relative', className)}
  >
    {children}
  </div>
);

const PageGestureWrapper: React.FC<PropsWithChildren> = React.memo((props) => {
  const { setShowSidebar } = useSidebarContext();

  const bind = useDrag<EventTypes['drag'], UserDragConfig>(
    (state) => {
      const { swipe } = state;
      const swipeX = swipe[0];
      if (swipeX > 0) {
        setShowSidebar(true);
      } else if (swipeX < 0) {
        setShowSidebar(false);
      }
    },
    {
      axis: 'x',
      swipe: {
        distance: 5,
      },
    }
  );

  return (
    <PageContentRoot
      style={{
        touchAction: 'pan-x',
      }}
      {...bind()}
    >
      {props.children}
    </PageContentRoot>
  );
});
PageGestureWrapper.displayName = 'PageGestureWrapper';

interface PageContentProps {
  sidebar?: React.ReactNode;
  'data-tc-role'?: string;
}
/**
 * 用于渲染实际页面的组件，即除了导航栏剩余的内容
 */
export const PageContent: React.FC<PropsWithChildren<PageContentProps>> =
  React.memo((props) => {
    const { sidebar, children } = props;
    const { showSidebar, setShowSidebar } = useSidebarContext();
    const isMobile = useIsMobile();
    const portalContainer = useAppPortalContainer();
    const location = useLocation();

    useWatch([isMobile, location.pathname], () => {
      // 桌面端保持导航可见；移动端默认优先展示会话内容，导航由顶部按钮或
      // 横向手势按需打开。
      setShowSidebar(isMobile === false);
    });

    const hasSidebar = !_isNil(sidebar);
    const desktopSidebar = hasSidebar ? (
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar/35 text-sidebar-foreground md:block">
        {sidebar}
      </aside>
    ) : null;

    const mobileSidebar =
      isMobile && hasSidebar ? (
        <Sheet open={showSidebar} onOpenChange={setShowSidebar}>
          <SheetContent
            portalContainer={portalContainer}
            side="left"
            className="w-72 gap-0 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground [&_[data-slot=sidebar-header]]:pr-11"
            closeLabel={t('关闭')}
          >
            <SheetHeader className="sr-only">
              <SheetTitle>
                {localTrans({
                  'zh-CN': '频道导航',
                  'en-US': 'Channel navigation',
                })}
              </SheetTitle>
              <SheetDescription>
                {localTrans({
                  'zh-CN': '浏览频道和会话',
                  'en-US': 'Browse channels and conversations',
                })}
              </SheetDescription>
            </SheetHeader>
            {sidebar}
          </SheetContent>
        </Sheet>
      ) : null;

    const contentEl = children;

    const el = (
      <ErrorBoundary>
        {desktopSidebar}
        {mobileSidebar}

        <div
          className="flex min-w-0 flex-auto overflow-hidden bg-content-light dark:bg-content-dark"
          data-tc-role={props['data-tc-role']}
        >
          <div className="tc-content-background" />

          <div className="relative flex w-full overflow-auto">
            <ErrorBoundary>{contentEl}</ErrorBoundary>
          </div>
        </div>
      </ErrorBoundary>
    );

    if (isMobile) {
      return <PageGestureWrapper>{el}</PageGestureWrapper>;
    } else {
      return <PageContentRoot>{el}</PageContentRoot>;
    }
  });
PageContent.displayName = 'PageContent';
