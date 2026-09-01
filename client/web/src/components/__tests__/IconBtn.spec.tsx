import { render, screen } from '@testing-library/react';
import React from 'react';
import { IconBtn } from '../IconBtn';

describe('IconBtn', () => {
  test('uses a supplied title as the accessible name', () => {
    render(<IconBtn icon="mdi:close" title="Close panel" />);

    expect(
      screen.getByRole('button', { name: 'Close panel' })
    ).toBeTruthy();
  });

  test('derives a readable accessible name for legacy consumers', () => {
    render(<IconBtn icon="mdi:message-text-outline" />);

    expect(
      screen.getByRole('button', { name: 'message text outline' })
    ).toBeTruthy();
  });

  test('renders the official shadcn button slot', () => {
    render(<IconBtn icon="mdi:close" />);

    expect(screen.getByRole('button').getAttribute('data-slot')).toBe('button');
  });
});
