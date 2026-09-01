import { render, screen } from '@testing-library/react';
import React from 'react';
import { EntryError, EntryField, EntryView } from '../Form';
import { EntryInput } from '../Input';
import { PrimaryBtn } from '../PrimaryBtn';

describe('entry form primitives', () => {
  test('associates a visible label with the official Shadcn input', () => {
    render(
      <EntryView title="Sign in" description="Welcome back">
        <EntryField id="email" label="Email">
          <EntryInput id="email" type="email" />
        </EntryField>
      </EntryView>
    );

    const input = screen.getByLabelText('Email');
    expect(input.getAttribute('data-slot')).toBe('input');
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeTruthy();
  });

  test('exposes loading and error states accessibly', () => {
    render(
      <>
        <PrimaryBtn loading>Continue</PrimaryBtn>
        <EntryError error={new Error('Unable to continue')} />
      </>
    );

    const button = screen.getByRole('button', { name: 'Continue' });
    expect(button.getAttribute('data-slot')).toBe('button');
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('alert').textContent).toContain(
      'Unable to continue'
    );
  });
});
