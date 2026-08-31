import React from 'react';
import { cva } from 'class-variance-authority';
import { isValidStr } from 'tailchat-shared';
import { Icon } from 'tailchat-design';
import { cn } from '@/lib/utils';
import { TcTooltip } from '@/components/ui/tooltip';

/**
 * 图标按钮 (facelift ui/ 迁移) — 替代 antd Button(icon-only) + antd Tooltip
 *
 * ⚠️ 关于层叠层(cascade layer): antd 的样式是**无层级**的, 而 Tailwind 4 的工具类位于
 * `@layer utilities` 中。无层级样式恒定胜过任何层级样式(与特异性无关, `important: '#app'`
 * 的 ID 前缀也救不回来)。antd 的 reset 里有一条:
 *
 *     input, button, select, optgroup, textarea { color: inherit; font-size: inherit; ... }
 *
 * 因此在 <button> 元素上, **任何** Tailwind 的 text-* 颜色/字号工具类都不会生效。
 * 迁移前本组件写的 bg-black/20 / text-white/80 同样一直是死代码, 实际渲染的是
 * `.dark .ant-btn` 的 transparent + rgba(255,255,255,.65)。
 *
 * 应对方式:
 * - 背景/尺寸/圆角写在 button 上 (background-color、width、height 不在 reset 里, 正常生效);
 * - 图标字号与图标颜色写在 <svg> 上 (reset 不覆盖 svg), 这样才真正生效,
 *   同时调用方的 iconClassName 仍可通过 tailwind-merge 覆盖;
 * - 不再硬编码 text-white/80: 让图标颜色默认继承容器文字色(主题感知),
 *   硬编码白色在亮色主题下会不可见。
 */
export const iconBtnVariants = cva(
  'inline-flex items-center justify-center shrink-0 border-0 transition-colors ' +
    'cursor-pointer select-none ' +
    'disabled:opacity-50 disabled:cursor-not-allowed ' +
    'focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-1',
  {
    variants: {
      shape: {
        // 方形圆角由 size 决定(见 compoundVariants), 与 TcButton 同一套 radius 语言
        circle: 'rounded-full',
        square: '',
      },
      // 命中区域对齐迁移前 antd icon-only 的实测值(24/32/40), 避免调用点发生布局位移
      size: {
        small: 'h-6 w-6',
        middle: 'h-8 w-8',
        large: 'h-10 w-10',
      },
      tone: {
        default: 'bg-black/20 hover:bg-black/60',
        primary: 'bg-primary hover:bg-primary-hover',
        text: 'bg-transparent hover:bg-white/10',
        danger: 'bg-red-600/80 hover:bg-red-600',
      },
      active: { true: '', false: '' },
    },
    compoundVariants: [
      { shape: 'square', size: 'small', class: 'rounded-md' },
      { shape: 'square', size: 'middle', class: 'rounded-lg' },
      { shape: 'square', size: 'large', class: 'rounded-lg' },
      { tone: 'default', active: true, class: 'bg-black/60' },
      { tone: 'text', active: true, class: 'bg-white/10' },
    ],
    defaultVariants: {
      shape: 'circle',
      size: 'middle',
      tone: 'default',
      active: false,
    },
  }
);

/** 图标本体的字号/颜色 — 必须挂在 svg 上才能越过 antd reset, 见上方说明 */
const iconVariants = cva('', {
  variants: {
    // 对齐迁移前 antd icon-only 的字号 (small 14px / middle 16px / large 18px)
    size: {
      small: 'text-sm',
      middle: 'text-base',
      large: 'text-lg',
    },
    tone: {
      // 继承容器文字色, 保持主题感知
      default: '',
      text: '',
      // 实心底色上必须锁定白色, 否则继承来的深色文字在蓝/红底上不可读
      primary: 'text-white',
      danger: 'text-white',
    },
  },
  defaultVariants: { size: 'middle', tone: 'default' },
});

type IconBtnShapeType = 'circle' | 'square';
type IconBtnSizeType = 'small' | 'middle' | 'large';
/** 对应旧 antd Button 的 type(视觉变体), 不是原生 button 的 type */
type IconBtnVariantType = 'default' | 'primary' | 'text';

export interface IconBtnProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  icon: string;
  iconClassName?: string;
  shape?: IconBtnShapeType;
  size?: IconBtnSizeType;
  type?: IconBtnVariantType;
  danger?: boolean;
  title?: string;
  active?: boolean;
}

export const IconBtn = React.memo(
  React.forwardRef<HTMLButtonElement, IconBtnProps>(
    (
      {
        icon,
        iconClassName,
        className,
        title,
        shape = 'circle',
        size = 'middle',
        type = 'default',
        danger = false,
        active = false,
        ...props
      },
      ref
    ) => {
      const tone = danger ? 'danger' : type;

      const btnEl = (
        <button
          ref={ref}
          type="button"
          className={cn(
            iconBtnVariants({ shape, size, tone, active }),
            className
          )}
          {...props}
        >
          <Icon
            className={cn(iconVariants({ size, tone }), iconClassName)}
            icon={icon}
          />
        </button>
      );

      // 保留迁移前的行为: 禁用态不挂 tooltip
      if (isValidStr(title) && !props.disabled) {
        return <TcTooltip label={title}>{btnEl}</TcTooltip>;
      }

      return btnEl;
    }
  )
);
IconBtn.displayName = 'IconBtn';
