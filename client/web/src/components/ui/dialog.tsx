import React from 'react';
import clsx from 'clsx';
import { useAppPortalContainer } from '@/hooks/useAppPortalContainer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './official/dialog';

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
  const portalContainer = useAppPortalContainer();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        portalContainer={portalContainer}
        className={clsx('w-[480px] sm:max-w-[480px]', className)}
      >
        {title && (
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
        )}
        {children}
      </DialogContent>
    </Dialog>
  );
});
TcDialog.displayName = 'TcDialog';
