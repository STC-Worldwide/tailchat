import React, {
  useState,
  useContext,
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import _get from 'lodash/get';
import { DevContainer, t } from 'tailchat-shared';
import { Button } from '@/components/ui/official/button';
import { useIsMobile } from '@/hooks/useIsMobile';

export interface SidebarViewMenuItemType {
  type: 'item';
  title: string;
  content: React.ReactNode;
  icon?: React.ReactNode;

  /**
   * 是否是仅开发者可见
   */
  isDev?: boolean;

  /**
   * 隐藏这个项
   */
  hidden?: boolean;
}

interface SidebarViewLinkType {
  type: 'link';
  title: string;
  onClick: () => void;
  isDanger?: boolean;
  icon?: React.ReactNode;
}

const SidebarViewMenuItemTitle: React.FC<
  PropsWithChildren<{
    active?: boolean;
    isDanger?: boolean;
    icon?: React.ReactNode;
    onClick: () => void;
  }>
> = (props) => {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (props.active) {
      buttonRef.current?.scrollIntoView?.({
        block: 'nearest',
        inline: 'nearest',
      });
    }
  }, [isMobile, props.active]);

  return (
    <Button
      ref={buttonRef}
      type="button"
      variant={
        props.isDanger ? 'destructive' : props.active ? 'secondary' : 'ghost'
      }
      className="h-9 w-48 justify-start max-md:w-auto max-md:shrink-0"
      aria-current={props.active ? 'page' : undefined}
      onClick={props.onClick}
    >
      {props.icon}
      <span>{props.children}</span>
    </Button>
  );
};

interface SidebarViewContextProps {
  content: React.ReactNode;
  setContent: (content: React.ReactNode) => void;
}
export const SidebarViewContext =
  React.createContext<SidebarViewContextProps | null>(null);
SidebarViewContext.displayName = 'SidebarViewContext';

export type SidebarViewMenuItem = SidebarViewMenuItemType | SidebarViewLinkType;
export type SidebarViewMenuType =
  | {
      type: 'group';
      title: string;
      children: SidebarViewMenuItem[];
    }
  | SidebarViewMenuItem;

interface SidebarViewMenuProps {
  menu: SidebarViewMenuType;
}
const SidebarViewMenuItem: React.FC<SidebarViewMenuProps> = React.memo(
  (props) => {
    const { menu } = props;
    const context = useContext(SidebarViewContext);

    if (!context) {
      return null;
    }

    const { content, setContent } = context;

    if (menu.type === 'group') {
      return (
        <section className="mb-3 border-b border-border pb-3 last:mb-0 last:border-b-0 last:pb-0 max-md:mb-0 max-md:border-0 max-md:pb-0">
          <h2 className="px-2 pb-2 text-xs font-medium text-muted-foreground max-md:sr-only">
            {menu.title}
          </h2>
          <div className="space-y-1 max-md:flex max-md:w-max max-md:flex-row max-md:space-y-0 max-md:space-x-1">
            {menu.children.map((sub, i) => (
              <SidebarViewMenuItem key={i} menu={sub} />
            ))}
          </div>
        </section>
      );
    } else if (menu.type === 'item') {
      if (menu.hidden === true) {
        return null;
      }

      const component = (
        <SidebarViewMenuItemTitle
          active={content === menu.content}
          icon={menu.icon}
          onClick={() => setContent(menu.content)}
        >
          {menu.title}
        </SidebarViewMenuItemTitle>
      );

      if (menu.isDev === true) {
        return <DevContainer>{component}</DevContainer>;
      } else {
        return <div>{component}</div>;
      }
    } else if (menu.type === 'link') {
      return (
        <div>
          <SidebarViewMenuItemTitle
            isDanger={menu.isDanger}
            icon={menu.icon}
            onClick={menu.onClick}
          >
            {menu.title}
          </SidebarViewMenuItemTitle>
        </div>
      );
    }

    return null;
  }
);
SidebarViewMenuItem.displayName = 'SidebarViewMenuItem';

interface SidebarViewProps {
  menu: SidebarViewMenuType[];

  /** Accessible label for the section navigation. */
  navigationLabel?: string;

  /**
   * 默认内容路径
   * @default "0.children.0.content"
   */
  defaultContentPath: string;
}
export const SidebarView: React.FC<SidebarViewProps> = React.memo((props) => {
  const {
    menu,
    navigationLabel = t('系统设置'),
    defaultContentPath = '0.children.0.content',
  } = props;
  const [content, setContent] = useState<React.ReactNode>(
    _get(menu, defaultContentPath, null)
  );
  const contentRef = useRef<HTMLElement | null>(null);
  const handleChangeContent = useCallback((nextContent: React.ReactNode) => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
    setContent(nextContent);
  }, []);

  return (
    <SidebarViewContext.Provider
      value={{ content, setContent: handleChangeContent }}
    >
      <div className="flex h-full w-full overflow-hidden max-md:flex-col">
        <aside className="flex w-60 shrink-0 flex-col items-end overflow-y-auto overflow-x-hidden border-r border-border bg-sidebar px-3 py-14 text-sm max-md:w-full max-md:items-start max-md:border-r-0 max-md:border-b max-md:py-3 max-md:pr-14 max-md:pl-4">
          <nav
            aria-label={navigationLabel}
            className="w-48 max-md:w-full max-md:overflow-x-auto"
          >
            {menu.map((item, i) => (
              <SidebarViewMenuItem key={i} menu={item} />
            ))}
          </nav>
        </aside>

        <main
          ref={contentRef}
          className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-10 pt-14 pb-16 max-md:px-5 max-md:pt-6 max-md:pb-10"
        >
          {content}
        </main>
      </div>
    </SidebarViewContext.Provider>
  );
});
SidebarView.displayName = 'SidebarView';
