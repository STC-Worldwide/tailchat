import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { TcContextMenu, TcDropdown } from '../dropdown';

jest.mock('@/hooks/useAppPortalContainer', () => ({
  useAppPortalContainer: () => document.body,
}));

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

describe('Shadcn menu compatibility adapters', () => {
  test('renders dropdown actions with official Shadcn menu primitives', async () => {
    const handleItem = jest.fn();
    const handleMenu = jest.fn();

    render(
      <TcDropdown
        menu={{
          onClick: handleMenu,
          items: [
            { key: 'view', label: 'View detail', onClick: handleItem },
            { key: 'divider', type: 'divider' },
            { key: 'leave', label: 'Leave group', danger: true },
          ],
        }}
      >
        <button type="button">Open group menu</button>
      </TcDropdown>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open group menu' }));

    const item = await screen.findByRole('menuitem', { name: 'View detail' });
    expect(
      document.querySelector('[data-slot="dropdown-menu-content"]')
    ).toBeTruthy();
    expect(
      screen
        .getByRole('menuitem', { name: 'Leave group' })
        .getAttribute('data-variant')
    ).toBe('destructive');

    fireEvent.click(item);
    await waitFor(() => expect(handleItem).toHaveBeenCalledTimes(1));
    expect(handleMenu).toHaveBeenCalledTimes(1);
  });

  test('renders right-click actions with official Shadcn context-menu primitives', async () => {
    render(
      <TcContextMenu menu={{ items: [{ key: 'read', label: 'Mark as read' }] }}>
        <button type="button">Test group</button>
      </TcContextMenu>
    );

    fireEvent.contextMenu(screen.getByRole('button', { name: 'Test group' }));

    expect(
      await screen.findByRole('menuitem', { name: 'Mark as read' })
    ).toBeTruthy();
    expect(
      document.querySelector('[data-slot="context-menu-content"]')
    ).toBeTruthy();
  });
});
