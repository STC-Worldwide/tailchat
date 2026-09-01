import React, { ButtonHTMLAttributes } from 'react';
import { Button } from '@/components/ui/official/button';
import { cn } from '@/lib/utils';

export const SecondaryBtn: React.FC<ButtonHTMLAttributes<HTMLButtonElement>> =
  React.memo((props) => {
    return (
      <Button
        type={props.type ?? 'button'}
        variant="ghost"
        {...props}
        className={cn(
          'h-9 w-full justify-center text-muted-foreground hover:text-foreground',
          props.className
        )}
      >
        {props.children}
      </Button>
    );
  });
SecondaryBtn.displayName = 'SecondaryBtn';
