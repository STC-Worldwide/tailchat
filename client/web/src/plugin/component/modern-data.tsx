import React from 'react';
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/official/button';
import { Checkbox } from '@/components/ui/official/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/official/collapsible';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
} from '@/components/ui/official/empty';
import { Separator } from '@/components/ui/official/separator';
import { Skeleton } from '@/components/ui/official/skeleton';
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group';
import {
  Table as ShadcnTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/official/table';
import { cn } from '@/lib/utils';

// Impeccable persistence exemption: this is an ordinary compatibility
// extension of Tailchat's established Operate world. It introduces no new
// visual direction, form seed, quality bar, or durable design-system rule.

type LegacyMenuMode = 'horizontal' | 'inline' | 'vertical';

export interface PluginMenuClickInfo {
  domEvent: React.MouseEvent<HTMLElement>;
  key: string;
  keyPath: string[];
}

export interface PluginMenuItem {
  children?: PluginMenuItem[];
  className?: string;
  danger?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  key: React.Key;
  label?: React.ReactNode;
  onClick?: (info: PluginMenuClickInfo) => void;
  style?: React.CSSProperties;
  title?: React.ReactNode;
  type?: 'divider' | 'group';
}

interface LegacyMenuItemProps
  extends Omit<PluginMenuItem, 'children' | 'key' | 'label'> {
  children?: React.ReactNode;
  eventKey?: React.Key;
}

interface LegacySubMenuProps extends LegacyMenuItemProps {
  popupClassName?: string;
}

interface LegacyMenuGroupProps {
  children?: React.ReactNode;
  title?: React.ReactNode;
}

const MenuItemMarker: React.FC<LegacyMenuItemProps> = () => null;
const SubMenuMarker: React.FC<LegacySubMenuProps> = () => null;
const MenuGroupMarker: React.FC<LegacyMenuGroupProps> = () => null;
const MenuDividerMarker: React.FC = () => null;

function extractMenuItems(children: React.ReactNode): PluginMenuItem[] {
  const extracted: PluginMenuItem[] = [];
  React.Children.forEach(children, (child, index) => {
    if (!React.isValidElement(child)) {
      return;
    }

    const key = child.key ?? `menu-item-${index}`;
    if (child.type === MenuDividerMarker) {
      extracted.push({ key, type: 'divider' });
      return;
    }
    if (child.type === MenuGroupMarker) {
      const props = child.props as LegacyMenuGroupProps;
      extracted.push({
        key,
        type: 'group',
        label: props.title,
        children: extractMenuItems(props.children),
      });
      return;
    }
    if (child.type === SubMenuMarker) {
      const props = child.props as LegacySubMenuProps;
      extracted.push({
        ...props,
        key: props.eventKey ?? key,
        label: props.title,
        children: extractMenuItems(props.children),
      });
      return;
    }
    if (child.type === MenuItemMarker) {
      const props = child.props as LegacyMenuItemProps;
      const { children: itemChildren, eventKey, ...itemProps } = props;
      extracted.push({
        ...itemProps,
        key: eventKey ?? key,
        label: itemChildren,
      });
    }
  });
  return extracted;
}

export interface PluginMenuProps
  extends Omit<React.HTMLAttributes<HTMLUListElement>, 'onClick' | 'onSelect'> {
  defaultOpenKeys?: React.Key[];
  defaultSelectedKeys?: React.Key[];
  inlineCollapsed?: boolean;
  items?: PluginMenuItem[];
  mode?: LegacyMenuMode;
  multiple?: boolean;
  onClick?: (info: PluginMenuClickInfo) => void;
  onDeselect?: (info: PluginMenuClickInfo) => void;
  onOpenChange?: (openKeys: string[]) => void;
  onSelect?: (info: PluginMenuClickInfo) => void;
  openKeys?: React.Key[];
  selectable?: boolean;
  selectedKeys?: React.Key[];
  theme?: 'dark' | 'light';
}

interface MenuNodeProps {
  activeKey?: string;
  ancestors: string[];
  collapsed: boolean;
  item: PluginMenuItem;
  mode: LegacyMenuMode;
  onActiveKeyChange: (key: string) => void;
  onActivate: (
    item: PluginMenuItem,
    event: React.MouseEvent<HTMLElement>,
    ancestors: string[]
  ) => void;
  onToggle: (key: string, open: boolean) => void;
  openKeys: string[];
  selectedKeys: string[];
}

const menuControlClassName =
  'h-8 w-full justify-start gap-2 overflow-hidden px-2 text-left font-normal data-[selected=true]:bg-accent data-[selected=true]:font-medium data-[selected=true]:text-accent-foreground';

function findFirstEnabledMenuKey(items: PluginMenuItem[]): string | undefined {
  for (const item of items) {
    if (item.type === 'divider') {
      continue;
    }
    if (item.type === 'group') {
      const childKey = findFirstEnabledMenuKey(item.children ?? []);
      if (childKey) {
        return childKey;
      }
      continue;
    }
    if (!item.disabled) {
      return String(item.key);
    }
  }
  return undefined;
}

function hasEnabledMenuKey(items: PluginMenuItem[], key?: string): boolean {
  if (!key) {
    return false;
  }
  return items.some((item) => {
    const isCurrentItem =
      !item.disabled && item.type !== 'divider' && String(item.key) === key;
    return isCurrentItem || hasEnabledMenuKey(item.children ?? [], key);
  });
}

const MenuNode: React.FC<MenuNodeProps> = ({
  activeKey,
  ancestors,
  collapsed,
  item,
  mode,
  onActiveKeyChange,
  onActivate,
  onToggle,
  openKeys,
  selectedKeys,
}) => {
  const key = String(item.key);
  if (item.type === 'divider') {
    return (
      <li role="none" className="my-1">
        <Separator />
      </li>
    );
  }

  if (item.type === 'group') {
    return (
      <li role="presentation" className="space-y-1">
        {item.label && (
          <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
            {item.label}
          </div>
        )}
        <ul role="group" className="space-y-0.5">
          {item.children?.map((child) => (
            <MenuNode
              key={String(child.key)}
              activeKey={activeKey}
              item={child}
              ancestors={ancestors}
              collapsed={collapsed}
              mode={mode}
              onActiveKeyChange={onActiveKeyChange}
              onActivate={onActivate}
              onToggle={onToggle}
              openKeys={openKeys}
              selectedKeys={selectedKeys}
            />
          ))}
        </ul>
      </li>
    );
  }

  if (item.children && item.children.length > 0) {
    const isOpen = openKeys.includes(key);
    return (
      <li
        role="none"
        className={cn('min-w-0', item.className)}
        style={item.style}
      >
        <Collapsible open={isOpen} onOpenChange={(open) => onToggle(key, open)}>
          <CollapsibleTrigger
            nativeButton
            role="menuitem"
            aria-haspopup="menu"
            data-menu-key={key}
            data-parent-key={ancestors[0]}
            tabIndex={activeKey === key ? 0 : -1}
            disabled={item.disabled}
            className={cn(
              menuControlClassName,
              'inline-flex items-center rounded-md text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
              item.danger && 'text-destructive hover:bg-destructive/10'
            )}
            title={typeof item.title === 'string' ? item.title : undefined}
            onFocus={() => onActiveKeyChange(key)}
          >
            {item.icon}
            {collapsed ? (
              <span className="sr-only">{item.label}</span>
            ) : (
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
            )}
            {!collapsed && (
              <ChevronDownIcon
                className={cn(
                  'ml-auto size-4 transition-transform',
                  isOpen && 'rotate-180'
                )}
              />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ul
              role="group"
              className={cn(
                'ml-3 space-y-0.5 border-l border-border py-1 pl-2',
                mode === 'horizontal' && 'min-w-40'
              )}
            >
              {item.children.map((child) => (
                <MenuNode
                  key={String(child.key)}
                  activeKey={activeKey}
                  item={child}
                  ancestors={[key, ...ancestors]}
                  collapsed={false}
                  mode={mode}
                  onActiveKeyChange={onActiveKeyChange}
                  onActivate={onActivate}
                  onToggle={onToggle}
                  openKeys={openKeys}
                  selectedKeys={selectedKeys}
                />
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      </li>
    );
  }

  return (
    <li
      role="none"
      className={cn('min-w-0', item.className)}
      style={item.style}
    >
      <Button
        type="button"
        role="menuitem"
        variant="ghost"
        size="sm"
        disabled={item.disabled}
        data-selected={selectedKeys.includes(key)}
        data-menu-key={key}
        data-parent-key={ancestors[0]}
        aria-current={selectedKeys.includes(key) ? 'page' : undefined}
        tabIndex={activeKey === key ? 0 : -1}
        title={typeof item.title === 'string' ? item.title : undefined}
        className={cn(
          menuControlClassName,
          collapsed && 'size-8 justify-center p-0',
          item.danger &&
            'text-destructive hover:bg-destructive/10 hover:text-destructive'
        )}
        onFocus={() => onActiveKeyChange(key)}
        onClick={(event) => onActivate(item, event, ancestors)}
      >
        {item.icon}
        {collapsed ? (
          <span className="sr-only">{item.label}</span>
        ) : (
          <span className="truncate">{item.label}</span>
        )}
      </Button>
    </li>
  );
};

const PluginMenu: React.FC<PluginMenuProps> = React.memo(
  ({
    children,
    className,
    defaultOpenKeys = [],
    defaultSelectedKeys = [],
    inlineCollapsed = false,
    items,
    mode = 'vertical',
    multiple = false,
    onClick,
    onDeselect,
    onKeyDown,
    onOpenChange,
    onSelect,
    openKeys,
    selectable = true,
    selectedKeys,
    theme: _theme,
    ...props
  }) => {
    const resolvedItems = items ?? extractMenuItems(children);
    const menuRef = React.useRef<HTMLUListElement>(null);
    const isSelectionControlled = selectedKeys !== undefined;
    const isOpenControlled = openKeys !== undefined;
    const [internalSelectedKeys, setInternalSelectedKeys] = React.useState(
      defaultSelectedKeys.map(String)
    );
    const [internalOpenKeys, setInternalOpenKeys] = React.useState(
      defaultOpenKeys.map(String)
    );
    const firstEnabledKey = findFirstEnabledMenuKey(resolvedItems);
    const [activeKey, setActiveKey] = React.useState(firstEnabledKey);
    const activeKeyExists = hasEnabledMenuKey(resolvedItems, activeKey);
    const currentSelectedKeys = isSelectionControlled
      ? selectedKeys.map(String)
      : internalSelectedKeys;
    const currentOpenKeys = isOpenControlled
      ? openKeys.map(String)
      : internalOpenKeys;

    React.useEffect(() => {
      if (!activeKeyExists && firstEnabledKey) {
        setActiveKey(firstEnabledKey);
      }
    }, [activeKeyExists, firstEnabledKey]);

    const handleToggle = (key: string, open: boolean) => {
      const nextKeys = open
        ? Array.from(new Set([...currentOpenKeys, key]))
        : currentOpenKeys.filter((candidate) => candidate !== key);
      if (!isOpenControlled) {
        setInternalOpenKeys(nextKeys);
      }
      onOpenChange?.(nextKeys);
    };

    const handleActivate = (
      item: PluginMenuItem,
      event: React.MouseEvent<HTMLElement>,
      ancestors: string[]
    ) => {
      const key = String(item.key);
      const info = { domEvent: event, key, keyPath: [key, ...ancestors] };
      item.onClick?.(info);
      onClick?.(info);
      if (!selectable) {
        return;
      }

      const isSelected = currentSelectedKeys.includes(key);
      const nextKeys = multiple
        ? isSelected
          ? currentSelectedKeys.filter((candidate) => candidate !== key)
          : [...currentSelectedKeys, key]
        : [key];
      if (!isSelectionControlled) {
        setInternalSelectedKeys(nextKeys);
      }
      if (isSelected && multiple) {
        onDeselect?.(info);
      } else {
        onSelect?.(info);
      }
    };

    const getVisibleMenuItems = () =>
      Array.from(
        menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ??
          []
      ).filter(
        (element) =>
          !element.hasAttribute('disabled') &&
          !element.closest('[hidden], [aria-hidden="true"]')
      );

    const focusMenuItem = (element?: HTMLElement) => {
      if (!element) {
        return;
      }
      const nextKey = element.dataset.menuKey;
      if (nextKey) {
        setActiveKey(nextKey);
      }
      element.focus();
    };

    const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented) {
        return;
      }

      const target = (event.target as HTMLElement).closest<HTMLElement>(
        '[role="menuitem"]'
      );
      if (!target) {
        return;
      }
      const menuItems = getVisibleMenuItems();
      const currentIndex = menuItems.indexOf(target);
      const focusRelative = (offset: number) => {
        if (menuItems.length === 0) {
          return;
        }
        const nextIndex =
          (Math.max(currentIndex, 0) + offset + menuItems.length) %
          menuItems.length;
        focusMenuItem(menuItems[nextIndex]);
      };

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        focusRelative(1);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        focusRelative(-1);
      } else if (event.key === 'Home') {
        event.preventDefault();
        focusMenuItem(menuItems[0]);
      } else if (event.key === 'End') {
        event.preventDefault();
        focusMenuItem(menuItems[menuItems.length - 1]);
      } else if (event.key === 'ArrowRight') {
        const key = target.dataset.menuKey;
        if (target.getAttribute('aria-haspopup') === 'menu' && key) {
          event.preventDefault();
          handleToggle(key, true);
          window.setTimeout(() => {
            focusMenuItem(
              getVisibleMenuItems().find(
                (candidate) => candidate.dataset.parentKey === key
              )
            );
          }, 0);
        } else if (mode === 'horizontal') {
          event.preventDefault();
          focusRelative(1);
        }
      } else if (event.key === 'ArrowLeft' || event.key === 'Escape') {
        const parentKey = target.dataset.parentKey;
        if (parentKey) {
          event.preventDefault();
          handleToggle(parentKey, false);
          window.setTimeout(() => {
            focusMenuItem(
              getVisibleMenuItems().find(
                (candidate) => candidate.dataset.menuKey === parentKey
              )
            );
          }, 0);
        } else if (event.key === 'ArrowLeft' && mode === 'horizontal') {
          event.preventDefault();
          focusRelative(-1);
        }
      }
    };

    return (
      <ul
        ref={menuRef}
        role="menu"
        aria-orientation={mode === 'horizontal' ? 'horizontal' : 'vertical'}
        data-slot="plugin-menu"
        data-mode={mode}
        onKeyDown={handleMenuKeyDown}
        className={cn(
          'min-w-0 rounded-lg bg-background p-1 text-foreground',
          mode === 'horizontal' ? 'flex items-start gap-1' : 'space-y-0.5',
          inlineCollapsed && 'w-10',
          className
        )}
        {...props}
      >
        {resolvedItems.map((item) => (
          <MenuNode
            key={String(item.key)}
            activeKey={activeKey}
            item={item}
            ancestors={[]}
            collapsed={inlineCollapsed}
            mode={mode}
            onActiveKeyChange={setActiveKey}
            onActivate={handleActivate}
            onToggle={handleToggle}
            openKeys={currentOpenKeys}
            selectedKeys={currentSelectedKeys}
          />
        ))}
      </ul>
    );
  }
);
PluginMenu.displayName = 'PluginMenu';

type PluginMenuComponent = typeof PluginMenu & {
  Divider: typeof MenuDividerMarker;
  Item: typeof MenuItemMarker;
  ItemGroup: typeof MenuGroupMarker;
  SubMenu: typeof SubMenuMarker;
};

export const Menu = PluginMenu as PluginMenuComponent;
Menu.Divider = MenuDividerMarker;
Menu.Item = MenuItemMarker;
Menu.ItemGroup = MenuGroupMarker;
Menu.SubMenu = SubMenuMarker;

type DataIndex = React.Key | React.Key[];

export interface PluginTableColumn<RecordType = Record<string, unknown>> {
  align?: 'center' | 'left' | 'right';
  className?: string;
  dataIndex?: DataIndex;
  ellipsis?: boolean | { showTitle?: boolean };
  key?: React.Key;
  onCell?: (
    record: RecordType,
    index?: number
  ) => React.TdHTMLAttributes<HTMLTableCellElement>;
  onHeaderCell?: () => React.ThHTMLAttributes<HTMLTableCellElement>;
  render?: (
    value: unknown,
    record: RecordType,
    index: number
  ) =>
    | React.ReactNode
    | {
        children?: React.ReactNode;
        props?: React.TdHTMLAttributes<HTMLTableCellElement>;
      };
  title?: React.ReactNode | (() => React.ReactNode);
  width?: number | string;
}

export interface PluginTablePagination {
  current?: number;
  defaultCurrent?: number;
  defaultPageSize?: number;
  onChange?: (page: number, pageSize: number) => void;
  pageSize?: number;
  total?: number;
}

export interface PluginTableRowSelection<RecordType = Record<string, unknown>> {
  defaultSelectedRowKeys?: React.Key[];
  getCheckboxProps?: (record: RecordType) => {
    disabled?: boolean;
    name?: string;
  };
  onChange?: (selectedRowKeys: React.Key[], selectedRows: RecordType[]) => void;
  onSelect?: (
    record: RecordType,
    selected: boolean,
    selectedRows: RecordType[]
  ) => void;
  selectedRowKeys?: React.Key[];
  type?: 'checkbox' | 'radio';
}

export interface PluginTableProps<RecordType = Record<string, unknown>>
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'title'> {
  bordered?: boolean;
  children?: React.ReactNode;
  columns?: PluginTableColumn<RecordType>[];
  dataSource?: RecordType[];
  footer?: (currentPageData: RecordType[]) => React.ReactNode;
  loading?: boolean | { spinning?: boolean };
  locale?: { emptyText?: React.ReactNode };
  onRow?: (
    record: RecordType,
    index?: number
  ) => React.HTMLAttributes<HTMLTableRowElement>;
  pagination?: false | PluginTablePagination;
  rowClassName?: string | ((record: RecordType, index: number) => string);
  rowKey?: keyof RecordType | ((record: RecordType) => React.Key);
  rowSelection?: PluginTableRowSelection<RecordType>;
  scroll?: { x?: number | string | true; y?: number | string };
  showHeader?: boolean;
  size?: 'large' | 'middle' | 'small';
  title?: (currentPageData: RecordType[]) => React.ReactNode;
}

interface LegacyTableColumnProps<RecordType>
  extends PluginTableColumn<RecordType> {
  children?: React.ReactNode;
}

const TableColumnMarker = <RecordType,>(
  _props: LegacyTableColumnProps<RecordType>
) => null;

function getRecordValue(record: unknown, dataIndex?: DataIndex) {
  if (dataIndex === undefined) {
    return undefined;
  }
  const path = Array.isArray(dataIndex) ? dataIndex : [dataIndex];
  return path.reduce<unknown>((value, segment) => {
    if (value === null || value === undefined || typeof value !== 'object') {
      return undefined;
    }
    return (value as Record<PropertyKey, unknown>)[segment];
  }, record);
}

function extractTableColumns<RecordType>(children: React.ReactNode) {
  return React.Children.toArray(children).flatMap((child) => {
    if (!React.isValidElement(child) || child.type !== TableColumnMarker) {
      return [];
    }
    return [child.props as PluginTableColumn<RecordType>];
  });
}

function resolveRowKey<RecordType>(
  record: RecordType,
  index: number,
  rowKey?: keyof RecordType | ((record: RecordType) => React.Key)
) {
  if (typeof rowKey === 'function') {
    return rowKey(record);
  }
  if (rowKey !== undefined) {
    return record[rowKey] as React.Key;
  }
  if (record && typeof record === 'object' && 'key' in record) {
    return (record as Record<'key', React.Key>).key;
  }
  return index;
}

const TableSelectionWrapper: React.FC<{
  children: React.ReactNode;
  onValueChange: (value: string) => void;
  radio: boolean;
  value?: string;
}> = ({ children, onValueChange, radio, value }) =>
  radio ? (
    <RadioGroup
      aria-label="Select a row"
      className="block"
      value={value ?? ''}
      onValueChange={onValueChange}
    >
      {children}
    </RadioGroup>
  ) : (
    <>{children}</>
  );

const PluginTable = <RecordType,>({
  bordered = false,
  children,
  className,
  columns,
  dataSource = [],
  footer,
  loading = false,
  locale,
  onRow,
  pagination = {},
  rowClassName,
  rowKey,
  rowSelection,
  scroll,
  showHeader = true,
  size = 'middle',
  style,
  title,
  ...props
}: PluginTableProps<RecordType>) => {
  const resolvedColumns = columns ?? extractTableColumns<RecordType>(children);
  const paginationConfig = pagination === false ? null : pagination;
  const isPageControlled = paginationConfig?.current !== undefined;
  const [internalPage, setInternalPage] = React.useState(
    paginationConfig?.defaultCurrent ?? 1
  );
  const pageSize =
    paginationConfig?.pageSize ?? paginationConfig?.defaultPageSize ?? 10;
  const total = paginationConfig?.total ?? dataSource.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(
    pageCount,
    Math.max(1, isPageControlled ? paginationConfig.current ?? 1 : internalPage)
  );
  const currentData = paginationConfig
    ? dataSource.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : dataSource;
  const isLoading =
    typeof loading === 'boolean' ? loading : loading.spinning ?? true;
  const isSelectionControlled = rowSelection?.selectedRowKeys !== undefined;
  const [internalSelectedKeys, setInternalSelectedKeys] = React.useState<
    React.Key[]
  >(rowSelection?.defaultSelectedRowKeys ?? []);
  const selectedKeys = isSelectionControlled
    ? rowSelection.selectedRowKeys ?? []
    : internalSelectedKeys;
  const selectedKeyStrings = selectedKeys.map(String);
  const currentRowEntries = currentData.map((record, index) => ({
    key: resolveRowKey(record, index, rowKey),
    record,
  }));
  const enabledCurrentRows = currentRowEntries.filter(
    ({ record }) => !rowSelection?.getCheckboxProps?.(record).disabled
  );
  const allCurrentSelected =
    enabledCurrentRows.length > 0 &&
    enabledCurrentRows.every(({ key }) =>
      selectedKeyStrings.includes(String(key))
    );
  const someCurrentSelected =
    !allCurrentSelected &&
    enabledCurrentRows.some(({ key }) =>
      selectedKeyStrings.includes(String(key))
    );

  const emitSelection = (nextKeys: React.Key[], changedRecord?: RecordType) => {
    if (!isSelectionControlled) {
      setInternalSelectedKeys(nextKeys);
    }
    const rows = dataSource.filter((record, index) =>
      nextKeys
        .map(String)
        .includes(String(resolveRowKey(record, index, rowKey)))
    );
    rowSelection?.onChange?.(nextKeys, rows);
    if (changedRecord) {
      const changedKey = resolveRowKey(
        changedRecord,
        dataSource.indexOf(changedRecord),
        rowKey
      );
      rowSelection?.onSelect?.(
        changedRecord,
        nextKeys.map(String).includes(String(changedKey)),
        rows
      );
    }
  };

  const changePage = (page: number) => {
    const nextPage = Math.min(pageCount, Math.max(1, page));
    if (!isPageControlled) {
      setInternalPage(nextPage);
    }
    paginationConfig?.onChange?.(nextPage, pageSize);
  };

  const selectRadioRow = (value: string) => {
    const selectedEntry = dataSource
      .map((record, index) => ({
        key: resolveRowKey(record, index, rowKey),
        record,
      }))
      .find(({ key }) => String(key) === value);
    if (selectedEntry) {
      emitSelection([selectedEntry.key], selectedEntry.record);
    }
  };

  return (
    <div
      data-slot="plugin-table"
      className={cn('w-full min-w-0 space-y-3', className)}
      style={style}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {title?.(currentData)}
      <div
        data-slot="plugin-table-scroll"
        className={cn(
          'relative overflow-x-hidden rounded-lg',
          scroll?.y && 'overflow-y-auto',
          bordered && 'ring-1 ring-border'
        )}
        style={{ maxHeight: scroll?.y }}
      >
        <TableSelectionWrapper
          radio={rowSelection?.type === 'radio'}
          value={selectedKeyStrings[0]}
          onValueChange={selectRadioRow}
        >
          <ShadcnTable
          className={cn(
            scroll?.x && 'min-w-max',
            isLoading && dataSource.length > 0 && 'opacity-60'
          )}
          style={{
            minWidth: typeof scroll?.x === 'number' ? scroll.x : undefined,
          }}
          >
          {showHeader && (
            <TableHeader className="bg-muted/40">
              <TableRow>
                {rowSelection && (
                  <TableHead className="w-10 px-3">
                    {rowSelection.type === 'radio' ? null : (
                      <Checkbox
                        aria-label="Select all rows"
                        checked={allCurrentSelected}
                        indeterminate={someCurrentSelected}
                        onCheckedChange={(checked) => {
                          const currentKeys = enabledCurrentRows.map(
                            ({ key }) => key
                          );
                          const nextKeys = checked
                            ? Array.from(
                                new Set([...selectedKeys, ...currentKeys])
                              )
                            : selectedKeys.filter(
                                (key) =>
                                  !currentKeys.map(String).includes(String(key))
                              );
                          emitSelection(nextKeys);
                        }}
                      />
                    )}
                  </TableHead>
                )}
                {resolvedColumns.map((column, index) => {
                  const headerProps = column.onHeaderCell?.() ?? {};
                  return (
                    <TableHead
                      key={String(column.key ?? column.dataIndex ?? index)}
                      {...headerProps}
                      className={cn(
                        size === 'small'
                          ? 'h-8 px-2'
                          : size === 'large'
                          ? 'h-12 px-3'
                          : 'h-10 px-3',
                        column.align === 'center' && 'text-center',
                        column.align === 'right' && 'text-right',
                        headerProps.className
                      )}
                      style={{ width: column.width, ...headerProps.style }}
                    >
                      {typeof column.title === 'function'
                        ? column.title()
                        : column.title}
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
          )}
          <TableBody>
            {isLoading && currentData.length === 0
              ? Array.from({ length: 3 }).map((_, rowIndex) => (
                  <TableRow key={`loading-${rowIndex}`}>
                    {rowSelection && (
                      <TableCell className="px-3">
                        <Skeleton className="size-4" />
                      </TableCell>
                    )}
                    {resolvedColumns.map((column, columnIndex) => (
                      <TableCell
                        key={String(
                          column.key ?? column.dataIndex ?? columnIndex
                        )}
                        className="px-3 py-3"
                      >
                        <Skeleton className="h-4 w-full max-w-40" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : currentData.map((record, rowIndex) => {
                  const key = resolveRowKey(record, rowIndex, rowKey);
                  const rowProps = onRow?.(record, rowIndex) ?? {};
                  const resolvedRowClassName =
                    typeof rowClassName === 'function'
                      ? rowClassName(record, rowIndex)
                      : rowClassName;
                  const rowSelected = selectedKeyStrings.includes(String(key));
                  const selectionProps =
                    rowSelection?.getCheckboxProps?.(record) ?? {};
                  return (
                    <TableRow
                      key={String(key)}
                      data-state={rowSelected ? 'selected' : undefined}
                      {...rowProps}
                      className={cn(resolvedRowClassName, rowProps.className)}
                    >
                      {rowSelection && (
                        <TableCell className="px-3">
                          {rowSelection.type === 'radio' ? (
                            <RadioGroupItem
                              aria-label={`Select row ${rowIndex + 1}`}
                              value={String(key)}
                              disabled={selectionProps.disabled}
                            />
                          ) : (
                            <Checkbox
                              aria-label={`Select row ${rowIndex + 1}`}
                              checked={rowSelected}
                              disabled={selectionProps.disabled}
                              onCheckedChange={(checked) => {
                                const nextKeys = checked
                                  ? Array.from(
                                      new Set([...selectedKeys, key])
                                    )
                                  : selectedKeys.filter(
                                      (candidate) =>
                                        String(candidate) !== String(key)
                                    );
                                emitSelection(nextKeys, record);
                              }}
                            />
                          )}
                        </TableCell>
                      )}
                      {resolvedColumns.map((column, columnIndex) => {
                        const value = getRecordValue(record, column.dataIndex);
                        const rendered =
                          column.render?.(value, record, rowIndex) ??
                          (value as React.ReactNode);
                        const renderResult: {
                          children?: React.ReactNode;
                          props?: React.TdHTMLAttributes<HTMLTableCellElement>;
                        } | null =
                          rendered &&
                          typeof rendered === 'object' &&
                          !React.isValidElement(rendered) &&
                          'props' in rendered
                            ? (rendered as {
                                children?: React.ReactNode;
                                props?: React.TdHTMLAttributes<HTMLTableCellElement>;
                              })
                            : null;
                        const cellProps = {
                          ...(column.onCell?.(record, rowIndex) ?? {}),
                          ...(renderResult?.props ?? {}),
                        };
                        const cellContent: React.ReactNode = renderResult
                          ? renderResult.children
                          : (rendered as React.ReactNode);
                        return (
                          <TableCell
                            key={String(
                              column.key ?? column.dataIndex ?? columnIndex
                            )}
                            {...cellProps}
                            className={cn(
                              size === 'small'
                                ? 'px-2 py-1.5'
                                : size === 'large'
                                ? 'px-3 py-3'
                                : 'px-3 py-2',
                              bordered && 'border-r last:border-r-0',
                              column.align === 'center' && 'text-center',
                              column.align === 'right' && 'text-right',
                              column.ellipsis && 'max-w-0 truncate',
                              column.className,
                              cellProps.className
                            )}
                            style={{ width: column.width, ...cellProps.style }}
                          >
                            {cellContent}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
            {!isLoading && currentData.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={resolvedColumns.length + (rowSelection ? 1 : 0)}
                  className="h-28"
                >
                  <Empty className="min-h-24 border-0 p-3">
                    <EmptyHeader>
                      <EmptyDescription>
                        {locale?.emptyText ?? 'No data'}
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          </ShadcnTable>
        </TableSelectionWrapper>
      </div>
      {paginationConfig && pageCount > 1 && (
        <nav
          aria-label="Table pagination"
          className="flex items-center justify-end gap-2"
        >
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Previous page"
            disabled={currentPage <= 1}
            onClick={() => changePage(currentPage - 1)}
          >
            <ChevronLeftIcon />
          </Button>
          <span className="min-w-14 text-center text-sm tabular-nums text-muted-foreground">
            {currentPage} / {pageCount}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Next page"
            disabled={currentPage >= pageCount}
            onClick={() => changePage(currentPage + 1)}
          >
            <ChevronRightIcon />
          </Button>
        </nav>
      )}
      {footer?.(currentData)}
    </div>
  );
};

type PluginTableComponent = typeof PluginTable & {
  Column: typeof TableColumnMarker;
};

export const Table = PluginTable as PluginTableComponent;
Table.Column = TableColumnMarker;
