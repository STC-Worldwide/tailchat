import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import {
  SidebarContextProvider,
  useSidebarContext,
} from '../SidebarContext';

const SidebarStateProbe: React.FC = () => {
  const { showSidebar, switchSidebar } = useSidebarContext();

  return (
    <button type="button" onClick={switchSidebar}>
      {showSidebar ? 'open' : 'closed'}
    </button>
  );
};

describe('SidebarContextProvider', () => {
  test('starts closed so mobile sheets do not flash over the app shell', () => {
    render(
      <SidebarContextProvider>
        <SidebarStateProbe />
      </SidebarContextProvider>
    );

    expect(screen.getByRole('button').textContent).toBe('closed');
  });

  test('toggles the contextual navigation with a functional state update', () => {
    render(
      <SidebarContextProvider>
        <SidebarStateProbe />
      </SidebarContextProvider>
    );

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);
    expect(trigger.textContent).toBe('open');
    fireEvent.click(trigger);
    expect(trigger.textContent).toBe('closed');
  });
});
