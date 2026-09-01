import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import {
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/official/sidebar';

const SidebarState: React.FC = () => {
  const { isMobile, openMobile } = useSidebar();

  return <output>{`${isMobile ? 'mobile' : 'desktop'}:${openMobile}`}</output>;
};

describe('official SidebarTrigger', () => {
  test('opens the mobile sidebar state from the header trigger', async () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 390,
    });
    window.matchMedia = jest.fn().mockImplementation(() => ({
      matches: true,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));

    render(
      <SidebarProvider>
        <SidebarTrigger label="Toggle app navigation" />
        <SidebarState />
      </SidebarProvider>
    );

    await waitFor(() => expect(screen.getByText('mobile:false')).toBeTruthy());
    fireEvent.click(
      screen.getByRole('button', { name: 'Toggle app navigation' })
    );
    expect(screen.getByText('mobile:true')).toBeTruthy();
  });
});
