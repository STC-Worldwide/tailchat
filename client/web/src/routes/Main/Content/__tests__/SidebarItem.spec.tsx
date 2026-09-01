import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/official/sidebar';
import { SidebarItem } from '../SidebarItem';

describe('SidebarItem', () => {
  beforeAll(() => {
    window.matchMedia = jest.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));
  });

  test('renders an active Shadcn sidebar link with its unread badge', () => {
    render(
      <MemoryRouter initialEntries={['/main/personal/friends']}>
        <SidebarProvider>
          <SidebarItem
            name="Friends"
            to="/main/personal/friends"
            icon={<svg aria-hidden="true" />}
            badge={3}
          />
        </SidebarProvider>
      </MemoryRouter>
    );

    const link = screen.getByRole('link', { name: /friends/i });
    expect(link.getAttribute('href')).toBe('/main/personal/friends');
    expect(link.hasAttribute('data-active')).toBe(true);
    expect(link.getAttribute('aria-current')).toBe('page');
    expect(screen.getByLabelText('3 unread')).toBeTruthy();
  });

  test('uses the official avatar fallback and exposes row actions by name', () => {
    const handleRemove = jest.fn();

    render(
      <MemoryRouter initialEntries={['/main/personal/friends']}>
        <SidebarProvider>
          <SidebarItem
            name="Faye"
            to="/main/personal/converse/faye"
            action={{
              icon: <svg aria-hidden="true" />,
              label: 'Remove Faye',
              onClick: handleRemove,
            }}
          />
        </SidebarProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('F')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Remove Faye' }));
    expect(handleRemove).toHaveBeenCalledTimes(1);
  });
});
