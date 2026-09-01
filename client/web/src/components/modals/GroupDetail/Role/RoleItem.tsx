import React, { PropsWithChildren } from 'react';
import { Button } from '@/components/ui/official/button';
import { cn } from '@/lib/utils';

export const RoleItem: React.FC<
  PropsWithChildren<{
    active: boolean;
    onClick?: () => void;
    className?: string;
  }>
> = React.memo((props) => {
  return (
    <Button
      type="button"
      variant={props.active ? 'secondary' : 'ghost'}
      className={cn('w-full justify-start', props.className)}
      aria-current={props.active ? 'page' : undefined}
      onClick={props.onClick}
    >
      {props.children}
    </Button>
  );
});
RoleItem.displayName = 'RoleItem';
