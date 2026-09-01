import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { SidebarView } from '@/components/SidebarView';

describe('SidebarView', () => {
  test('uses a contextual navigation label when provided', () => {
    render(
      <SidebarView
        navigationLabel="Open API applications"
        defaultContentPath="0.children.0.content"
        menu={[
          {
            type: 'group',
            title: 'Application',
            children: [
              {
                type: 'item',
                title: 'Profile',
                content: <div>Profile page</div>,
              },
            ],
          },
        ]}
      />
    );

    expect(
      screen.getByRole('navigation', { name: 'Open API applications' })
    ).toBeTruthy();
  });

  test('scrolls the active section into the mobile navigation viewport', () => {
    const scrollIntoView = jest.fn();
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 390,
    });
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    });

    render(
      <SidebarView
        defaultContentPath="0.children.1.content"
        menu={[
          {
            type: 'group',
            title: 'Settings',
            children: [
              {
                type: 'item',
                title: 'Summary',
                content: <div>Summary page</div>,
              },
              { type: 'item', title: 'Roles', content: <div>Roles page</div> },
            ],
          },
        ]}
      />
    );

    expect(
      screen.getByRole('button', { name: 'Roles' }).getAttribute('aria-current')
    ).toBe('page');
    expect(scrollIntoView).toHaveBeenCalledWith({
      block: 'nearest',
      inline: 'nearest',
    });
  });

  test('resets the content scroll position when changing sections', () => {
    const { container } = render(
      <SidebarView
        defaultContentPath="0.children.0.content"
        menu={[
          {
            type: 'group',
            title: 'Settings',
            children: [
              {
                type: 'item',
                title: 'Summary',
                content: <div>Summary page</div>,
              },
              { type: 'item', title: 'Roles', content: <div>Roles page</div> },
            ],
          },
        ]}
      />
    );
    const content = container.querySelector('main');

    expect(content).not.toBeNull();
    if (!content) {
      return;
    }

    content.scrollTop = 240;
    fireEvent.click(screen.getByRole('button', { name: 'Roles' }));

    expect(content.scrollTop).toBe(0);
    expect(screen.getByText('Roles page')).toBeTruthy();
  });
});
