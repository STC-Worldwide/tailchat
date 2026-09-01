import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { ChatMessageHeader } from '../ChatMessageHeader';
import { ExpandableMessage } from '../ExpandableMessage';
import { ScrollToBottom } from '../ScrollToBottom';

class ResizeObserverMock implements ResizeObserver {
  constructor(private readonly callback: ResizeObserverCallback) {}

  observe(target: Element) {
    this.callback(
      [
        {
          target,
          contentRect: target.getBoundingClientRect(),
        } as ResizeObserverEntry,
      ],
      this
    );
  }

  unobserve() {}

  disconnect() {}
}

describe('modern chat chrome', () => {
  const originalResizeObserver = global.ResizeObserver;
  const scrollHeightDescriptor = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    'scrollHeight'
  );

  beforeEach(() => {
    global.ResizeObserver = ResizeObserverMock;
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
      configurable: true,
      get: () => 400,
    });
  });

  afterEach(() => {
    global.ResizeObserver = originalResizeObserver;
    if (scrollHeightDescriptor) {
      Object.defineProperty(
        HTMLElement.prototype,
        'scrollHeight',
        scrollHeightDescriptor
      );
    } else {
      delete (HTMLElement.prototype as { scrollHeight?: number }).scrollHeight;
    }
  });

  it('renders the conversation introduction with a semantic heading', () => {
    render(<ChatMessageHeader title="Lobby" />);

    expect(screen.getByRole('heading', { name: 'Lobby' })).not.toBeNull();
  });

  it('expands a long message from an accessible button', async () => {
    render(
      <ExpandableMessage maxHeight={100} expandLabel="Show full message">
        <p>Long message</p>
      </ExpandableMessage>
    );

    const expandButton = await screen.findByRole('button', {
      name: 'Show full message',
    });
    fireEvent.click(expandButton);

    expect(
      screen.queryByRole('button', { name: 'Show full message' })
    ).toBeNull();
    expect(screen.getByText('Long message').textContent).toBe('Long message');
  });

  it('exposes the scroll-to-bottom action as a button', () => {
    const onClick = jest.fn();
    render(<ScrollToBottom onClick={onClick} />);

    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
