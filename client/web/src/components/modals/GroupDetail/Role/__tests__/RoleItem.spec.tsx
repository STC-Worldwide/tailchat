import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { RoleItem } from '../RoleItem';

describe('RoleItem', () => {
  test('renders an official Shadcn button with active-page semantics', () => {
    const onClick = jest.fn();
    render(
      <RoleItem active onClick={onClick}>
        Moderators
      </RoleItem>
    );

    const button = screen.getByRole('button', { name: 'Moderators' });
    expect(button.getAttribute('data-slot')).toBe('button');
    expect(button.getAttribute('aria-current')).toBe('page');

    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
