import React, { InputHTMLAttributes } from 'react';
import { Input } from '@/components/ui/official/input';
import { cn } from '@/lib/utils';

export const EntryInput = React.memo(
  React.forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
    ({ className, ...props }, ref) => (
      <Input
        ref={ref}
        className={cn('h-10 bg-background/80 px-3', className)}
        {...props}
      />
    )
  )
);
EntryInput.displayName = 'EntryInput';
