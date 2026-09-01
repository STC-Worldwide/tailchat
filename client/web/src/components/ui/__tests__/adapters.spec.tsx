import { render, screen } from '@testing-library/react';
import React from 'react';
import { TcAlert } from '../alert';
import { TcEmpty } from '../empty';
import { TcSkeleton } from '../skeleton';
import { TcTag } from '../tag';

/**
 * 这些 Tc* 是 antd 迁移遗留的便捷封装。迁移收尾时它们被改成组合
 * components/ui/official/* 里 vendor 进来的 shadcn primitive, 而不是自己
 * 手写 markup。data-slot 是 primitive 独有的标记, 所以断言 data-slot 就等于
 * 断言「确实走了 primitive」——手抄一份 class 是骗不过去的。
 *
 * (仓库没有装 jest-dom 的 matcher, 所以这里只用原生断言。)
 */

/** 只看颜色类的 dark: 变体 — primitive 基类自带的 dark:aria-invalid:* 不算。 */
const darkColorVariants = (className: string) =>
  className.split(/\s+/).filter((c) => /^dark:(text|bg|border)-/.test(c));

describe('Shadcn primitive compatibility adapters', () => {
  test('TcAlert renders through the official Alert primitive', () => {
    render(<TcAlert title="Broken" description="Details here" />);

    expect(screen.getByRole('alert').getAttribute('data-slot')).toBe('alert');
    expect(screen.getByText('Broken').getAttribute('data-slot')).toBe(
      'alert-title'
    );
    expect(screen.getByText('Details here').getAttribute('data-slot')).toBe(
      'alert-description'
    );
  });

  test.each([
    ['error', 'danger'],
    ['warning', 'warning'],
    ['success', 'success'],
  ] as const)(
    'TcAlert %s variant colours from the --color-%s token with no dark: variant',
    (variant, token) => {
      render(<TcAlert variant={variant} title="Tone" description="Body" />);

      const alert = screen.getByRole('alert');
      expect(alert.className).toContain(`border-${token}/30`);
      expect(alert.className).toContain(`bg-${token}/10`);
      // the tone token is already theme-aware, so no paired dark: utility
      expect(darkColorVariants(alert.className)).toEqual([]);
      // tailwind-merge must have dropped the primitive's own surface colour
      expect(alert.className.split(/\s+/)).not.toContain('bg-card');

      const description = screen.getByText('Body');
      expect(description.className).toContain(`text-${token}/90`);
      expect(description.className).not.toContain('text-muted-foreground');
    }
  );

  test('TcEmpty renders through the official Empty primitive and does not stretch', () => {
    render(<TcEmpty description="Nothing here" />);

    const empty = screen.getByRole('status');
    expect(empty.getAttribute('data-slot')).toBe('empty');
    // shadcn Empty defaults to flex-1; NoData/NotFound sit inside flex
    // containers that it would reflow, so the adapter pins flex-none.
    expect(empty.className).toContain('flex-none');
    expect(empty.className.split(/\s+/)).not.toContain('flex-1');
    expect(screen.getByText('Nothing here').getAttribute('data-slot')).toBe(
      'empty-description'
    );
  });

  test('TcSkeleton builds every block from the official Skeleton primitive', () => {
    const { container } = render(
      <TcSkeleton avatar={true} title={true} lines={2} />
    );

    const blocks = Array.from(
      container.querySelectorAll('[data-slot="skeleton"]')
    );
    expect(blocks).toHaveLength(4); // avatar + title + 2 lines
    blocks.forEach((block) => {
      expect(block.className).toContain('animate-pulse');
      expect(block.className).toContain('bg-muted');
      // the hand-rolled version used untokenized bg-black/10 dark:bg-white/10
      expect(block.className).not.toContain('bg-black/10');
      expect(darkColorVariants(block.className)).toEqual([]);
    });
  });

  test('TcSkeleton renders children instead of blocks once loaded', () => {
    const { container } = render(
      <TcSkeleton loading={false}>
        <span>Loaded</span>
      </TcSkeleton>
    );

    expect(screen.getByText('Loaded').textContent).toBe('Loaded');
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(
      0
    );
  });

  test('TcTag renders through the official Badge primitive and keeps pass-through props', () => {
    render(
      <TcTag variant="warning" style={{ color: '#ff0000' }}>
        Owner
      </TcTag>
    );

    const tag = screen.getByText('Owner');
    expect(tag.getAttribute('data-slot')).toBe('badge');
    expect(tag.className).toContain('text-warning');
    expect(darkColorVariants(tag.className)).toEqual([]);
    // Badge's own secondary surface must have been merged away (the
    // variant-scoped [a]:hover:bg-secondary/80 is a different utility and stays)
    expect(tag.className.split(/\s+/)).not.toContain('bg-secondary');
    // arbitrary HTML props (the per-role colour in GroupUserPopover) survive
    expect((tag as HTMLElement).style.color).toBe('rgb(255, 0, 0)');
  });
});
