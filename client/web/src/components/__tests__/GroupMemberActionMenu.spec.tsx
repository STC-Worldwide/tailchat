import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import {
  GroupMemberContextMenuItems,
  GroupMemberDropdownItems,
} from '../GroupMemberActionMenu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../ui/official/dropdown-menu';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from '../ui/official/context-menu';

beforeAll(() => {
  if (typeof DOMRect === 'undefined') {
    Object.defineProperty(globalThis, 'DOMRect', {
      configurable: true,
      value: {
        fromRect: (rect: Partial<DOMRect> = {}) => ({
          x: rect.x ?? 0,
          y: rect.y ?? 0,
          width: rect.width ?? 0,
          height: rect.height ?? 0,
          top: rect.y ?? 0,
          left: rect.x ?? 0,
          right: (rect.x ?? 0) + (rect.width ?? 0),
          bottom: (rect.y ?? 0) + (rect.height ?? 0),
          toJSON: () => ({}),
        }),
      },
    });
  }
});

describe('official Shadcn group member action menu', () => {
  test('renders direct action icons and destructive state', async () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger render={<button type="button">Actions</button>} />
        <DropdownMenuContent portalContainer={document.body}>
          <GroupMemberDropdownItems
            portalContainer={document.body}
            items={[
              { key: 'unmute', label: 'Unmute' },
              {
                key: 'delete',
                label: 'Remove from group',
                danger: true,
              },
            ]}
          />
        </DropdownMenuContent>
      </DropdownMenu>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Actions' }));

    const unmute = await screen.findByRole('menuitem', { name: 'Unmute' });
    const remove = screen.getByRole('menuitem', {
      name: 'Remove from group',
    });
    expect(unmute.querySelector('svg')).toBeTruthy();
    expect(remove.getAttribute('data-variant')).toBe('destructive');
    expect(
      document.querySelector('[data-slot="dropdown-menu-content"]')
    ).toBeTruthy();
  });

  test('exposes assigned roles as checked menu items', async () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger render={<button type="button">Roles</button>} />
        <DropdownMenuContent portalContainer={document.body}>
          <GroupMemberDropdownItems
            portalContainer={document.body}
            items={[{ key: 'moderator', label: 'Moderator', checked: true }]}
          />
        </DropdownMenuContent>
      </DropdownMenu>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Roles' }));

    await waitFor(() =>
      expect(
        document.querySelector('[data-slot="dropdown-menu-checkbox-item"]')
      ).toBeTruthy()
    );
    const role = document.querySelector(
      '[data-slot="dropdown-menu-checkbox-item"]'
    );
    expect(role?.textContent).toContain('Moderator');
    expect(role?.getAttribute('aria-checked')).toBe('true');
  });

  test('preserves checked role semantics in the context menu', async () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger render={<button type="button">Member</button>} />
        <ContextMenuContent portalContainer={document.body}>
          <GroupMemberContextMenuItems
            portalContainer={document.body}
            items={[{ key: 'moderator', label: 'Moderator', checked: true }]}
          />
        </ContextMenuContent>
      </ContextMenu>
    );

    fireEvent.contextMenu(screen.getByRole('button', { name: 'Member' }));

    const role = await screen.findByRole('menuitemcheckbox', {
      name: 'Moderator',
    });
    expect(role.getAttribute('aria-checked')).toBe('true');
    expect(
      document.querySelector('[data-slot="context-menu-checkbox-item"]')
    ).toBeTruthy();
  });
});
