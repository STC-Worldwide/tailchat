import React from 'react';
import { Checkbox as ShadcnCheckbox } from './official/checkbox';

export interface TcCheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onCheckedChange?: (checked: boolean) => void;
}

export const TcCheckbox = React.forwardRef<HTMLInputElement, TcCheckboxProps>(
  ({ className, onCheckedChange, ...props }, ref) => (
    <ShadcnCheckbox
      ref={ref as React.Ref<HTMLElement>}
      className={className}
      onCheckedChange={onCheckedChange}
      {...(props as React.ComponentProps<typeof ShadcnCheckbox>)}
    />
  )
);
TcCheckbox.displayName = 'TcCheckbox';
