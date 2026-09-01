import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { FullModalFactory } from '@/components/FullModal/Factory';
import { SlowModeSettings } from '@/components/modals/GroupPanel/SlowModeSettings';
import { SubmitButton } from '@/components/SubmitButton';
import { ServiceUrlSettings } from '@/components/modals/ServiceUrlSettings';
import { Dialog } from '@/components/ui/official/dialog';

beforeAll(() => {
  if (typeof DOMRect === 'undefined') {
    Object.defineProperty(globalThis, 'DOMRect', {
      configurable: true,
      value: {
        fromRect: (rect: Partial<DOMRect> = {}) => ({
          x: rect.x ?? 0,
          y: rect.y ?? 0,
          width: rect.width ?? 0,
          height: rect.height ?? 0,
          top: rect.y ?? 0,
          left: rect.x ?? 0,
          right: (rect.x ?? 0) + (rect.width ?? 0),
          bottom: (rect.y ?? 0) + (rect.height ?? 0),
          toJSON: () => ({}),
        }),
      },
    });
  }
});

describe('modern shared form controls', () => {
  test('renders plugin boolean settings with the official labelled switch', () => {
    const onChange = jest.fn();

    render(
      <FullModalFactory
        value={false}
        onChange={onChange}
        config={{
          name: 'notifications',
          label: 'Notifications',
          type: 'boolean',
        }}
      />
    );

    const control = screen.getByRole('switch', { name: 'Notifications' });
    expect(control.getAttribute('data-slot')).toBe('switch');
    fireEvent.click(control);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  test('exposes plugin select settings with direct official select primitives', async () => {
    render(
      <FullModalFactory
        value="light"
        onChange={jest.fn()}
        config={{
          name: 'theme',
          label: 'Theme',
          type: 'select',
          options: [
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ],
        }}
      />
    );

    const trigger = screen.getByRole('combobox', { name: 'Theme' });
    expect(trigger.getAttribute('data-slot')).toBe('select-trigger');
    fireEvent.click(trigger);
    const option = await screen.findByRole('option', { name: 'Dark' });
    expect(option.getAttribute('data-slot')).toBe('select-item');
    expect(document.querySelector('[data-slot="select-content"]')).toBeTruthy();
  });

  test('uses direct Shadcn controls for slow mode', () => {
    const onChange = jest.fn();
    const { rerender } = render(
      <SlowModeSettings value={undefined} onChange={onChange} />
    );

    const switchControl = screen.getByRole('switch');
    expect(switchControl.getAttribute('data-slot')).toBe('switch');
    fireEvent.click(switchControl);
    expect(onChange).toHaveBeenCalledWith({
      intervalSeconds: 60,
      maxMessages: 1,
    });

    rerender(
      <SlowModeSettings
        value={{ intervalSeconds: 60, maxMessages: 1 }}
        onChange={onChange}
      />
    );

    expect(screen.getAllByRole('combobox')).toHaveLength(2);
    expect(
      document.querySelectorAll('[data-slot="select-trigger"]')
    ).toHaveLength(2);
  });

  test('uses official accessible editors for plugin text settings', () => {
    const onTextChange = jest.fn();
    const { unmount } = render(
      <FullModalFactory
        value="Tailchat"
        onChange={onTextChange}
        config={{
          name: 'displayName',
          label: 'Display name',
          type: 'text',
        }}
      />
    );

    fireEvent.click(screen.getByRole('button'));
    const input = screen.getByRole('textbox', { name: 'Display name' });
    expect(input.getAttribute('data-slot')).toBe('input');
    fireEvent.change(input, { target: { value: 'Tailchat modern' } });
    fireEvent.click(
      screen.getByRole('button', { name: /保存变更|Save changes/ })
    );
    expect(onTextChange).toHaveBeenCalledWith('Tailchat modern');

    unmount();

    render(
      <FullModalFactory
        value="A modern collaboration space"
        onChange={jest.fn()}
        config={{
          name: 'description',
          label: 'Description',
          type: 'textarea',
        }}
      />
    );
    fireEvent.click(screen.getByRole('button'));
    expect(
      screen
        .getByRole('textbox', { name: 'Description' })
        .getAttribute('data-slot')
    ).toBe('textarea');
  });

  test('keeps async submit actions on the official button primitive', async () => {
    const onClick = jest.fn().mockResolvedValue(undefined);

    render(<SubmitButton onClick={onClick}>Save</SubmitButton>);

    const button = screen.getByRole('button', { name: 'Save' });
    expect(button.getAttribute('data-slot')).toBe('button');
    expect(button.getAttribute('type')).toBe('button');
    fireEvent.click(button);
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.querySelector('.animate-spin')).toBeTruthy();

    await waitFor(() => expect(button.getAttribute('aria-busy')).toBe('false'));
    expect(button.querySelector('.animate-spin')).toBeNull();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('gives the direct service URL input an accessible name', () => {
    render(
      <Dialog open={true}>
        <ServiceUrlSettings />
      </Dialog>
    );

    const input = screen.getByRole('textbox');
    expect(input.getAttribute('data-slot')).toBe('input');
    expect(input.getAttribute('aria-label')).toBeTruthy();
  });
});
