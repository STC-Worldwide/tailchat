import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { SectionHeader } from '../SectionHeader';

jest.mock('@/hooks/useAppPortalContainer', () => ({
  useAppPortalContainer: () => document.body,
}));

describe('SectionHeader', () => {
  test('renders sidebar actions with direct official Shadcn menu primitives', async () => {
    const handleView = jest.fn();

    render(
      <SectionHeader
        menu={{
          items: [
            {
              key: 'view',
              label: 'View details',
              onClick: handleView,
            },
            {
              key: 'leave',
              label: 'Leave group',
              danger: true,
            },
          ],
        }}
      >
        Test group
      </SectionHeader>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Test group' }));

    const viewItem = await screen.findByRole('menuitem', {
      name: 'View details',
    });
    expect(
      document.querySelector('[data-slot="dropdown-menu-content"]')
    ).toBeTruthy();
    expect(
      screen
        .getByRole('menuitem', { name: 'Leave group' })
        .getAttribute('data-variant')
    ).toBe('destructive');

    fireEvent.click(viewItem);
    await waitFor(() => expect(handleView).toHaveBeenCalledTimes(1));
  });
});
