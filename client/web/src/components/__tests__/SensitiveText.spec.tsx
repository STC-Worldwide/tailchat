import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { SensitiveText } from '../SensitiveText';

jest.mock('tailchat-shared', () => ({
  t: (value: string) => value,
}));

describe('SensitiveText', () => {
  test('masks a value by default and exposes an accessible Shadcn toggle', () => {
    render(<SensitiveText text="secret-code" />);

    expect(screen.queryByText('secret-code')).toBeNull();
    const toggle = screen.getByRole('button', { name: '显示敏感信息' });
    expect(toggle.getAttribute('data-slot')).toBe('button');

    fireEvent.click(toggle);
    expect(screen.getByText('secret-code')).toBeTruthy();
    expect(screen.getByRole('button', { name: '隐藏敏感信息' })).toBeTruthy();
  });
});
