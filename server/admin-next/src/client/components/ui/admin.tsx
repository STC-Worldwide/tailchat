import * as React from 'react';
import { LoaderCircle, XIcon } from 'lucide-react';
import { Alert as AlertPrimitive, AlertDescription } from './alert';
import { Badge } from './badge';
import { Button } from './button';
import { Checkbox as CheckboxPrimitive } from './checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { Input as InputPrimitive } from './input';
import { RadioGroup, RadioGroupItem } from './radio-group';
import { Switch as SwitchPrimitive } from './switch';
import {
  Table as TablePrimitive,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table';
import { Textarea } from './textarea';
import {
  Tooltip as TooltipPrimitive,
  TooltipContent,
  TooltipTrigger,
} from './tooltip';
import { useI18n } from '../../i18n';

export function Alert({
  className,
  content,
  type = 'info',
}: {
  className?: string;
  content: React.ReactNode;
  type?: 'info' | 'warning' | 'error' | 'success';
}) {
  return (
    <AlertPrimitive
      className={className}
      variant={
        type === 'error'
          ? 'destructive'
          : type === 'warning'
          ? 'warning'
          : 'default'
      }
    >
      <AlertDescription>{content}</AlertDescription>
    </AlertPrimitive>
  );
}

type InputProps = Omit<
  React.ComponentProps<typeof InputPrimitive>,
  'onChange' | 'prefix'
> & {
  allowClear?: boolean;
  onChange?: (value: string) => void;
  prefix?: React.ReactNode;
};

function TextInput({
  allowClear,
  className,
  onChange,
  prefix,
  value,
  ...props
}: InputProps) {
  const { t } = useI18n();
  const input = (
    <InputPrimitive
      className={className}
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
      {...props}
    />
  );
  if (!prefix && !allowClear) return input;
  return (
    <div className={`input-with-icon ${className || ''}`}>
      {prefix}
      {React.cloneElement(input, { className: undefined })}
      {allowClear && Boolean(value) && (
        <button
          type="button"
          className="input-clear"
          aria-label={t('common.clear')}
          onClick={() => onChange?.('')}
        >
          <XIcon aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

function TextAreaInput({
  onChange,
  ...props
}: Omit<React.ComponentProps<typeof Textarea>, 'onChange'> & {
  onChange?: (value: string) => void;
}) {
  return (
    <Textarea
      {...props}
      onChange={(event) => onChange?.(event.target.value)}
    />
  );
}

export const Input = Object.assign(TextInput, { TextArea: TextAreaInput });

export function Switch({
  onChange,
  ...props
}: Omit<React.ComponentProps<typeof SwitchPrimitive>, 'onCheckedChange'> & {
  onChange?: (checked: boolean) => void;
}) {
  return <SwitchPrimitive {...props} onCheckedChange={onChange} />;
}

export function Checkbox({
  children,
  onChange,
  ...props
}: Omit<React.ComponentProps<typeof CheckboxPrimitive>, 'onCheckedChange'> & {
  children?: React.ReactNode;
  onChange?: (checked: boolean) => void;
}) {
  const control = (
    <CheckboxPrimitive {...props} onCheckedChange={onChange} />
  );
  return children ? (
    <label className="check-label">
      {control}
      <span>{children}</span>
    </label>
  ) : (
    control
  );
}

export function Tag({
  children,
  closable,
  color = 'gray',
  icon,
  onClose,
}: React.PropsWithChildren<{
  closable?: boolean;
  color?: 'green' | 'red' | 'gray';
  icon?: React.ReactNode;
  onClose?: () => void;
}>) {
  const { t } = useI18n();
  return (
    <Badge
      variant={
        color === 'green'
          ? 'success'
          : color === 'red'
          ? 'destructive'
          : 'secondary'
      }
    >
      {icon}
      {children}
      {closable && (
        <button
          type="button"
          className="badge-close"
          aria-label={t('common.remove')}
          onClick={onClose}
        >
          <XIcon aria-hidden="true" />
        </button>
      )}
    </Badge>
  );
}

export function Popconfirm({
  children,
  onOk,
  onVisibleChange,
  popupVisible,
  title,
}: React.PropsWithChildren<{
  onOk: () => void | Promise<void>;
  onVisibleChange?: (visible: boolean) => void;
  popupVisible?: boolean;
  title: React.ReactNode;
}>) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const { t } = useI18n();
  const controlled = popupVisible !== undefined;
  const open = controlled ? popupVisible : internalOpen;
  const setOpen = (next: boolean) => {
    if (!controlled) setInternalOpen(next);
    onVisibleChange?.(next);
  };
  const trigger = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<{ onClick?: React.MouseEventHandler }>, {
        onClick: (event) => {
          children.props.onClick?.(event);
          if (!event.defaultPrevented) setOpen(true);
        },
      })
    : children;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('common.confirm')}</DialogTitle>
          <DialogDescription>{title}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={async () => {
              await onOk();
              setOpen(false);
            }}
          >
            {t('common.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RadioItem({
  children,
  value,
}: React.PropsWithChildren<{ value: string }>) {
  return <RadioGroupItem value={value}>{children}</RadioGroupItem>;
}

function RadioGroupCompat({
  children,
  onChange,
  value,
}: React.PropsWithChildren<{
  onChange?: (value: string) => void;
  type?: string;
  value?: string;
}>) {
  return (
    <RadioGroup value={value} onValueChange={onChange}>
      {children}
    </RadioGroup>
  );
}

export const Radio = Object.assign(RadioItem, { Group: RadioGroupCompat });

export function Upload({
  accept,
  children,
  className,
  disabled,
  onChange,
}: React.PropsWithChildren<{
  accept?: string;
  autoUpload?: boolean;
  className?: string;
  disabled?: boolean;
  onChange?: (
    files: unknown[],
    file: { originFile?: File; status: 'init' }
  ) => void;
  showUploadList?: boolean;
}>) {
  return (
    <label className={className} aria-disabled={disabled}>
      <input
        className="sr-only"
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onChange?.([], { originFile: file, status: 'init' });
          event.target.value = '';
        }}
      />
      {children}
    </label>
  );
}

export interface TableColumnProps<T> {
  dataIndex?: string;
  ellipsis?: boolean;
  fixed?: 'right';
  key?: string;
  render?: (value: unknown, record: T) => React.ReactNode;
  sortDirections?: string[];
  sorter?: boolean;
  sortOrder?: 'ascend' | 'descend';
  title: React.ReactNode;
  width?: number;
}

export function Table<T>({
  className,
  columns,
  data,
  loading,
  noDataElement,
  onChange,
  rowKey,
  rowSelection,
  scroll,
}: {
  className?: string;
  columns: TableColumnProps<T>[];
  data: T[];
  loading?: boolean;
  noDataElement?: React.ReactNode;
  onChange?: (
    pagination: unknown,
    sorter: { direction?: 'ascend' | 'descend'; field?: string }
  ) => void;
  pagination?: false;
  rowKey: (record: T) => string;
  rowSelection?: {
    onChange: (keys: string[]) => void;
    selectedRowKeys: string[];
  };
  scroll?: { x?: number };
}) {
  const { t } = useI18n();
  const allSelected = Boolean(
    data.length &&
      rowSelection &&
      data.every((record) => rowSelection.selectedRowKeys.includes(rowKey(record)))
  );
  return (
    <div className={`admin-table ${className || ''}`} style={{ minWidth: 0 }}>
      <TablePrimitive style={{ minWidth: scroll?.x }}>
        <TableHeader>
          <TableRow>
            {rowSelection && (
              <TableHead className="selection-cell">
                <CheckboxPrimitive
                  checked={allSelected}
                  onCheckedChange={(checked) =>
                    rowSelection.onChange(
                      checked ? data.map((record) => rowKey(record)) : []
                    )
                  }
                />
              </TableHead>
            )}
            {columns.map((column, index) => (
              <TableHead key={column.key || column.dataIndex || index} style={{ width: column.width }}>
                {column.sorter && column.dataIndex ? (
                  <button
                    type="button"
                    className="sort-button"
                    onClick={() =>
                      onChange?.({}, {
                        field: column.dataIndex,
                        direction:
                          column.sortOrder === 'ascend' ? 'descend' : 'ascend',
                      })
                    }
                  >
                    {column.title}
                    <span aria-hidden="true">
                      {column.sortOrder === 'ascend'
                        ? '↑'
                        : column.sortOrder === 'descend'
                        ? '↓'
                        : '↕'}
                    </span>
                  </button>
                ) : (
                  column.title
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={columns.length + (rowSelection ? 1 : 0)}>
                <div className="table-state" role="status">
                  <LoaderCircle className="size-4 animate-spin" />
                  {t('common.loading')}
                </div>
              </TableCell>
            </TableRow>
          ) : data.length ? (
            data.map((record) => {
              const key = rowKey(record);
              const selected = rowSelection?.selectedRowKeys.includes(key);
              return (
                <TableRow key={key} data-state={selected ? 'selected' : undefined}>
                  {rowSelection && (
                    <TableCell className="selection-cell">
                      <CheckboxPrimitive
                        checked={selected}
                        onCheckedChange={(checked) =>
                          rowSelection.onChange(
                            checked
                              ? [...rowSelection.selectedRowKeys, key]
                              : rowSelection.selectedRowKeys.filter((item) => item !== key)
                          )
                        }
                      />
                    </TableCell>
                  )}
                  {columns.map((column, index) => {
                    const value = column.dataIndex
                      ? (record as Record<string, unknown>)[column.dataIndex]
                      : undefined;
                    return (
                      <TableCell key={column.key || column.dataIndex || index}>
                        {column.render ? column.render(value, record) : String(value ?? '—')}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length + (rowSelection ? 1 : 0)}>
                {noDataElement}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </TablePrimitive>
    </div>
  );
}

export function Pagination({
  current,
  onChange,
  pageSize,
  showTotal,
  sizeOptions = [20, 50, 100],
  total,
}: {
  current: number;
  onChange: (page: number, size: number) => void;
  pageSize: number;
  showTotal?: (total: number) => React.ReactNode;
  sizeCanChange?: boolean;
  sizeOptions?: number[];
  total: number;
}) {
  const { t } = useI18n();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="pagination-controls">
      <span>{showTotal?.(total)}</span>
      <select
        aria-label={t('resource.pageSize')}
        value={pageSize}
        onChange={(event) => onChange(1, Number(event.target.value))}
      >
        {sizeOptions.map((size) => (
          <option key={size} value={size}>{size}</option>
        ))}
      </select>
      <Button variant="outline" size="sm" disabled={current <= 1} onClick={() => onChange(current - 1, pageSize)}>
        {t('common.previous')}
      </Button>
      <span>{current} / {pages}</span>
      <Button variant="outline" size="sm" disabled={current >= pages} onClick={() => onChange(current + 1, pageSize)}>
        {t('common.next')}
      </Button>
    </div>
  );
}

export function Tooltip({
  children,
  content,
}: React.PropsWithChildren<{ content: React.ReactNode }>) {
  return (
    <TooltipPrimitive>
      <TooltipTrigger render={children as React.ReactElement} />
      <TooltipContent>{content}</TooltipContent>
    </TooltipPrimitive>
  );
}

function MenuItem({ children, className }: React.PropsWithChildren<{ className?: string }>) {
  return <>{children}</>;
}

function MenuRoot({
  children,
  className,
  onClickMenuItem,
}: React.PropsWithChildren<{
  className?: string;
  onClickMenuItem?: (key: string) => void;
}>) {
  return (
    <div className={className}>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        return (
          <DropdownMenuItem
            variant={child.props.className?.includes('danger') ? 'destructive' : 'default'}
            onClick={() => onClickMenuItem?.(String(child.key))}
          >
            {child.props.children}
          </DropdownMenuItem>
        );
      })}
    </div>
  );
}

export const Menu = Object.assign(MenuRoot, { Item: MenuItem });

export function Dropdown({
  children,
  droplist,
}: React.PropsWithChildren<{ droplist: React.ReactNode; position?: string; trigger?: string }>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={children as React.ReactElement} />
      <DropdownMenuContent>{droplist}</DropdownMenuContent>
    </DropdownMenu>
  );
}
