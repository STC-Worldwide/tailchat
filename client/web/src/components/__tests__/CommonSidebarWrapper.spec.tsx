import { render, screen } from '@testing-library/react';
import React from 'react';
import { CommonSidebarWrapper } from '../CommonSidebarWrapper';
import { SidebarProvider } from '@/components/ui/official/sidebar';

describe('CommonSidebarWrapper', () => {
  beforeAll(() => {
    window.matchMedia = jest.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));
  });

  test('marks contextual navigation as a distinct Shadcn sidebar surface', () => {
    render(
      <SidebarProvider>
        <CommonSidebarWrapper data-tc-role="sidebar-test">
          <span>Navigation</span>
        </CommonSidebarWrapper>
      </SidebarProvider>
    );

    const sidebar = screen.getByText('Navigation').parentElement;
    expect(sidebar?.getAttribute('data-slot')).toBe('context-sidebar');
    expect(sidebar?.getAttribute('data-tc-role')).toBe('sidebar-test');
    expect(sidebar?.className).toContain('bg-sidebar/35');
  });
});
