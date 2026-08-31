import React from 'react';
import { Dialog } from '@base-ui-components/react/dialog';
import clsx from 'clsx';

/**
 * 基于 Base UI 的 token 化 Dialog (facelift ui/ 基础组件)
 * 受控用法: <TcDialog open={open} onOpenChange={setOpen} title={...}>...</TcDialog>
 */
export const TcDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}> = React.memo(({ open, onOpenChange, title, className, children }) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/60 z-40" />
        <Dialog.Popup
          className={clsx(
            'fixed left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 z-50',
            'w-[480px] max-w-[92vw] rounded-lg bg-raised text-body',
            'border border-subtle shadow-elevationHigh p-4',
            className
          )}
        >
          {title && (
            <Dialog.Title className="text-lg font-bold mb-3">
              {title}
            </Dialog.Title>
          )}
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
});
TcDialog.displayName = 'TcDialog';
