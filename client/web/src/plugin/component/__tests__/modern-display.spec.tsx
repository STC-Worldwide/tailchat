import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  Checkbox,
  Empty,
  Popover,
  Skeleton,
  Tag,
  Tooltip,
} from '../modern-display';

jest.mock('@/hooks/useAppPortalContainer', () => ({
  useAppPortalContainer: () => document.body,
}));

describe('modern plugin display compatibility controls', () => {
  test('translates checkbox state to the legacy change event contract', () => {
    const handleChange = jest.fn();
    render(
      <Checkbox defaultChecked={false} onChange={handleChange}>
        Complete task
      </Checkbox>
    );

    const checkbox = screen.getByRole('checkbox', { name: 'Complete task' });
    fireEvent.click(checkbox);
    expect(checkbox.getAttribute('data-checked')).not.toBeNull();
    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({ checked: true }),
      })
    );
  });

  test('distinguishes indeterminate checkbox state from checked state', () => {
    render(<Checkbox indeterminate={true}>Mixed selection</Checkbox>);

    const checkbox = screen.getByRole('checkbox', {
      name: 'Mixed selection',
    });
    expect(checkbox.getAttribute('data-indeterminate')).not.toBeNull();
    expect(
      checkbox.querySelector('[data-icon="check"]')?.getAttribute('class')
    ).toContain('group-data-indeterminate/checkbox:hidden');
    expect(
      checkbox.querySelector('[data-icon="minus"]')?.getAttribute('class')
    ).toContain('group-data-indeterminate/checkbox:block');
  });

  test('renders tooltip and popover content with official Base UI slots', async () => {
    render(
      <>
        <Tooltip title="Participant name" defaultOpen={true}>
          <button type="button">Avatar</button>
        </Tooltip>
        <Popover
          title="Plugin details"
          content="Modern extension controls"
          defaultOpen={true}
        >
          <button type="button">Details</button>
        </Popover>
      </>
    );

    expect(
      (await screen.findByText('Participant name')).getAttribute('data-slot')
    ).toBe('tooltip-content');
    expect(
      (await screen.findByText('Plugin details')).getAttribute('data-slot')
    ).toBe('popover-title');
    expect(await screen.findByText('Modern extension controls')).not.toBeNull();
  });

  test('wraps custom component triggers that cannot accept positioning refs', async () => {
    const CustomAvatar: React.FC = () => <span>Custom avatar</span>;
    render(
      <Tooltip title="Custom participant" defaultOpen={true}>
        <CustomAvatar />
      </Tooltip>
    );

    const trigger = screen
      .getByText('Custom avatar')
      .closest('[data-slot="tooltip-trigger"]');
    expect(trigger?.getAttribute('data-plugin-trigger-wrapper')).toBe('');
    expect(await screen.findByText('Custom participant')).not.toBeNull();
  });

  test.each([
    ['click', 'click'],
    ['hover', 'hover'],
    ['focus', 'focus'],
    ['contextMenu', 'contextMenu'],
    [['hover', 'click'], 'click'],
  ] as const)(
    'opens Popover for the %p trigger contract',
    async (trigger, interaction) => {
      const { unmount } = render(
        <Popover
          content={`Opened by ${interaction}`}
          trigger={
            trigger as 'click' | 'hover' | 'focus' | 'contextMenu' | string[]
          }
          mouseEnterDelay={0}
        >
          <button type="button">Open {interaction}</button>
        </Popover>
      );

      const control = screen.getByRole('button', {
        name: `Open ${interaction}`,
      });
      if (interaction === 'click') {
        fireEvent.click(control);
      } else if (interaction === 'hover') {
        fireEvent.mouseEnter(control);
        fireEvent.mouseMove(control);
      } else if (interaction === 'focus') {
        fireEvent.focus(control);
      } else {
        fireEvent.contextMenu(control);
      }

      expect(
        await screen.findByText(`Opened by ${interaction}`)
      ).not.toBeNull();
      unmount();
    }
  );

  test('does not let a hover-only Popover collapse to click', () => {
    render(
      <Popover content="Hover content" trigger="hover" mouseEnterDelay={0}>
        <button type="button">Hover only</button>
      </Popover>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Hover only' }));
    expect(screen.queryByText('Hover content')).toBeNull();
  });

  test('supports preset and closable modern tags', () => {
    const handleClose = jest.fn();
    render(
      <Tag color="green" closable={true} onClose={handleClose}>
        Connected
      </Tag>
    );

    const tag = screen.getByText('Connected').closest('[data-slot="badge"]');
    expect(tag?.className).toContain('bg-emerald-500/15');
    fireEvent.click(screen.getByRole('button', { name: 'Close tag' }));
    expect(handleClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Connected')).toBeNull();
  });

  test('keeps compound Skeleton and Empty plugin APIs available', () => {
    render(
      <>
        <Skeleton active={true} avatar={true} paragraph={{ rows: 2 }} />
        <Skeleton.Avatar active={true} size={40} shape="square" />
        <Empty description="No topics">
          <button type="button">Create topic</button>
        </Empty>
      </>
    );

    expect(screen.getAllByRole('status')).toHaveLength(2);
    expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBe(5);
    expect(screen.getByText('No topics')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Create topic' })).not.toBeNull();
    expect(
      screen.getByText('No topics').closest('[data-slot="empty"]')
    ).not.toBeNull();
  });
});
