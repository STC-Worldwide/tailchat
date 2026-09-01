import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { SidebarContextProvider } from '../../SidebarContext';
import { MobileMenuBtn } from '../MobileMenuBtn';

jest.mock('@/hooks/useIsMobile', () => ({
  useIsMobile: () => true,
}));

jest.mock('tailchat-shared', () => ({
  localTrans: (value: Record<string, string>) => value['en-US'],
}));

describe('MobileMenuBtn', () => {
  test('opens and closes contextual navigation with accessible state', () => {
    render(
      <SidebarContextProvider>
        <MobileMenuBtn />
      </SidebarContextProvider>
    );

    const openButton = screen.getByRole('button', {
      name: 'Open channel navigation',
    });
    expect(openButton.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(openButton);
    const closeButton = screen.getByRole('button', {
      name: 'Close channel navigation',
    });
    expect(closeButton.getAttribute('aria-expanded')).toBe('true');

    fireEvent.click(closeButton);
    expect(
      screen
        .getByRole('button', { name: 'Open channel navigation' })
        .getAttribute('aria-expanded')
    ).toBe('false');
  });
});
