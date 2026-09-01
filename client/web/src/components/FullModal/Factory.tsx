import React from 'react';
import {
  DefaultFullModalInputEditorRender,
  DefaultFullModalTextAreaEditorRender,
  FullModalField,
} from './Field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/official/select';
import { Switch } from '@/components/ui/official/switch';

export type FullModalFactoryConfig = {
  name: string;
  label: string;
  desc?: string;
  defaultValue?: any;
} & (
  | {
      type: 'text';
    }
  | {
      type: 'textarea';
    }
  | {
      type: 'boolean';
    }
  | {
      type: 'select';
      options: { label: string; value: string }[];
    }
);

interface FullModalFactoryProps<T = any> {
  value: T;
  onChange: (val: T) => void;
  config: FullModalFactoryConfig;
}

/**
 * 输入配置输出组件
 */
export const FullModalFactory: React.FC<FullModalFactoryProps> = React.memo(
  (props) => {
    const { value, onChange, config } = props;
    if (config.type === 'text') {
      return (
        <FullModalField
          title={config.label}
          value={value}
          editable={true}
          renderEditor={DefaultFullModalInputEditorRender}
          onSave={(val) => onChange(val)}
        />
      );
    }
    if (config.type === 'textarea') {
      return (
        <FullModalField
          title={config.label}
          value={value}
          editable={true}
          renderEditor={DefaultFullModalTextAreaEditorRender}
          onSave={(val) => onChange(val)}
        />
      );
    }

    if (config.type === 'boolean') {
      return (
        <FullModalField
          title={config.label}
          tip={config.desc}
          content={
            <Switch
              aria-label={config.label}
              checked={value ?? false}
              onCheckedChange={(checked) => onChange(checked)}
            />
          }
        />
      );
    }

    if (config.type === 'select') {
      return (
        <FullModalField
          title={config.label}
          tip={config.desc}
          content={
            <Select
              value={value ?? config.options[0]?.value ?? ''}
              onValueChange={(val) => val !== null && onChange(val)}
              items={config.options}
            >
              <SelectTrigger
                aria-label={config.label}
                className="w-full sm:w-[280px]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {config.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />
      );
    }

    return null;
  }
);
FullModalFactory.displayName = 'FullModalFactory';
