import React from 'react';
import { Switch as BaseSwitch } from '@base-ui-components/react/switch';
import { cn } from '@/lib/utils';

/**
 * 基于 Base UI 的 token 化 Switch (facelift ui/ 基础组件) — 替代 antd Switch
 */
export interface TcSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const TcSwitch: React.FC<TcSwitchProps> = React.memo(
  ({ checked, onChange, disabled, className }) => (
    <BaseSwitch.Root
      checked={checked}
      onCheckedChange={onChange}
      disabled={disabled}
      className={cn(
        'relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors',
        // dark: 与 data-[checked]: 编译后特异性相同, 源码顺序决定胜负 (dark: 恒后于 data-*),
        // 用 not-data-[checked]: 让两组选择器互斥, 避免深色模式下 checked 态被 track 色覆盖
        'not-data-[checked]:bg-black/20 not-data-[checked]:dark:bg-white/20 data-[checked]:bg-primary',
        'focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
        className
      )}
    >
      <BaseSwitch.Thumb className="block h-4.5 w-4.5 translate-x-1 rounded-full bg-white shadow-sm transition-transform data-[checked]:translate-x-5" />
    </BaseSwitch.Root>
  )
);
TcSwitch.displayName = 'TcSwitch';
