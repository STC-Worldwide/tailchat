import React, { ButtonHTMLAttributes } from 'react';
import { Button } from '@/components/ui/official/button';
import { LoaderCircleIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export const PrimaryBtn: React.FC<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    loading?: boolean;
  }
> = React.memo(({ loading = false, disabled, className, children, ...props }) => {
  return (
    <Button
      type={props.type ?? 'button'}
      disabled={loading || disabled}
      aria-busy={loading}
      className={cn('h-10 w-full', className)}
      {...props}
    >
      {loading && <LoaderCircleIcon className="animate-spin" />}
      {children}
    </Button>
  );
});
PrimaryBtn.displayName = 'PrimaryBtn';
