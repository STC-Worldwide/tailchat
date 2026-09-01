import React, { useCallback } from 'react';
import { showToasts, t, useLanguage } from 'tailchat-shared';
import type { AllowedLanguage } from 'tailchat-shared';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/official/select';
import { cn } from '@/lib/utils';

type LanguageSelectProps = {
  className?: string;
  style?: React.CSSProperties;
};

/**
 * 语言切换选择框
 */
export const LanguageSelect: React.FC<LanguageSelectProps> = React.memo(
  (props) => {
    const { language, setLanguage } = useLanguage();
    const selectedLanguage: AllowedLanguage = language ?? 'en-US';

    const handleChangeLanguage = useCallback(
      (newLang: AllowedLanguage) => {
        showToasts(t('刷新页面后生效'), 'info');
        setLanguage(newLang);
      },
      [setLanguage]
    );

    const options = [
      { value: 'zh-CN', label: '简体中文' },
      { value: 'en-US', label: 'English' },
    ];

    return (
      <Select
        value={selectedLanguage}
        onValueChange={(value) =>
          value !== null && handleChangeLanguage(value as AllowedLanguage)
        }
        items={options}
      >
        <SelectTrigger
          aria-label={t('系统语言')}
          className={cn('w-full sm:w-[280px]', props.className)}
          style={props.style}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
);
LanguageSelect.displayName = 'LanguageSelect';
