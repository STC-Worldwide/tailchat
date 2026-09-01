import React, { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/official/tabs';

export interface PillTabItem {
  key: string;
  label: React.ReactNode;
  children?: React.ReactNode;
  disabled?: boolean;
}

export interface PillTabsProps {
  items?: PillTabItem[];
  activeKey?: string;
  defaultActiveKey?: string;
  onChange?: (activeKey: string) => void;
  className?: string;
  children?: React.ReactNode;
}

export interface PillTabPaneProps {
  tab: React.ReactNode;
  disabled?: boolean;
  children?: React.ReactNode;
}

/**
 * Compatibility wrapper for the legacy children API. New call sites should
 * prefer the `items` API, which mirrors the shadcn/Base UI tabs model.
 */
export const PillTabPane: React.FC<PillTabPaneProps> = () => null;
PillTabPane.displayName = 'PillTabPane';

function getChildItems(children: React.ReactNode): PillTabItem[] {
  const items: PillTabItem[] = [];

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement<PillTabPaneProps>(child)) {
      return;
    }

    items.push({
      key: String(child.key ?? ''),
      label: child.props.tab,
      children: child.props.children,
      disabled: child.props.disabled,
    });
  });

  return items;
}

/**
 * Tokenized pill tabs. The public component name remains unchanged so plugin
 * consumers do not need to change imports during the migration.
 */
export const PillTabs: React.FC<PillTabsProps> = React.memo((props) => {
  const items = useMemo(
    () => props.items ?? getChildItems(props.children),
    [props.items, props.children]
  );
  const firstEnabledKey = items.find((item) => !item.disabled)?.key;
  const [uncontrolledKey, setUncontrolledKey] = useState(
    props.defaultActiveKey ?? firstEnabledKey
  );
  const activeKey = props.activeKey ?? uncontrolledKey ?? firstEnabledKey;
  const activeItem = items.find((item) => item.key === activeKey) ?? items[0];

  useEffect(() => {
    if (props.activeKey === undefined && activeItem && activeItem.disabled) {
      setUncontrolledKey(firstEnabledKey);
    }
  }, [activeItem, firstEnabledKey, props.activeKey]);

  const handleChange = (key: string) => {
    const item = items.find((candidate) => candidate.key === key);
    if (!item || item.disabled) {
      return;
    }

    if (props.activeKey === undefined) {
      setUncontrolledKey(key);
    }
    props.onChange?.(key);
  };

  return (
    <Tabs
      value={activeItem?.key}
      onValueChange={handleChange}
      className={cn('pill-tabs min-h-0 min-w-0 w-full gap-0', props.className)}
    >
      <TabsList
        variant="line"
        className="h-auto w-full max-w-full shrink-0 justify-start overflow-x-auto overflow-y-hidden rounded-none border-b border-border px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => {
          return (
            <TabsTrigger
              key={item.key}
              value={item.key}
              disabled={item.disabled}
              className="h-8 flex-none px-3"
            >
              {item.label}
            </TabsTrigger>
          );
        })}
      </TabsList>

      {items.map((item) => (
        <TabsContent
          key={item.key}
          value={item.key}
          className="min-h-0 flex-1"
        >
          {item.children}
        </TabsContent>
      ))}
    </Tabs>
  );
});
PillTabs.displayName = 'PillTabs';
