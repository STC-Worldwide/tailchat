import React, { useState } from 'react';
import { Button } from '@/components/ui/official/button';
import { LoaderCircleIcon } from 'lucide-react';

interface SubmitButtonProps
  extends Omit<React.ComponentProps<typeof Button>, 'onClick'> {
  onClick: (event: React.MouseEvent) => void | Promise<void>;
}

/**
 * Submit Button, use for submit somthing to server
 * auto add loading state in onClick
 */
export const SubmitButton: React.FC<SubmitButtonProps> = React.memo((props) => {
  const [loading, setLoading] = useState(false);
  const {
    children,
    disabled,
    onClick,
    type = 'button',
    ...buttonProps
  } = props;

  return (
    <Button
      {...buttonProps}
      type={type}
      disabled={loading || disabled}
      aria-busy={loading}
      onClick={async (e) => {
        setLoading(true);
        try {
          await onClick(e);
        } finally {
          setLoading(false);
        }
      }}
    >
      {loading && <LoaderCircleIcon className="animate-spin" />}
      {children}
    </Button>
  );
});
SubmitButton.displayName = 'SubmitButton';
