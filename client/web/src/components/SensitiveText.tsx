import React, { useState } from 'react';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { t } from 'tailchat-shared';
import { Button } from '@/components/ui/official/button';
import { cn } from '@/lib/utils';

interface SensitiveTextProps {
  className?: string;
  text: string;
}

export const SensitiveText: React.FC<SensitiveTextProps> = React.memo(
  ({ className, text }) => {
    const [visible, setVisible] = useState(false);
    const label = visible ? t('隐藏敏感信息') : t('显示敏感信息');

    return (
      <div className={cn('flex items-center gap-1.5', className)}>
        <span className="select-text">
          {visible ? text : getMaskedText(text)}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={label}
          title={label}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </Button>
      </div>
    );
  }
);
SensitiveText.displayName = 'SensitiveText';

function getMaskedText(text: string): string {
  if (text.length > 2) {
    return `${text[0]}••••${text[text.length - 1]}`;
  }

  if (text.length === 2) {
    return `${text[0]}•`;
  }

  return '••';
}
