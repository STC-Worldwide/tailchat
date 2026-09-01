import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

const mockRegisterGroupConfig = jest.fn();

jest.mock('@capital/common', () => ({
  localTrans: (translations: Record<'zh-CN' | 'en-US', string>) =>
    translations['en-US'],
  regPluginGroupConfigItem: mockRegisterGroupConfig,
}));

require('../../../../../../server/plugins/com.msgbyte.welcome/web/plugins/com.msgbyte.welcome/src');

describe('Group Welcome plugin Shadcn field', () => {
  const registration = mockRegisterGroupConfig.mock.calls[0][0];
  const WelcomeField = registration.component;

  test('registers clear English metadata and renders the official textarea', () => {
    render(
      <WelcomeField value="Welcome {nickname}!" onChange={jest.fn()} loading={false} />
    );

    expect(registration.title).toBe('Welcome Text');
    expect(registration.tip).toBe(
      'Send a welcome message when a new member joins.'
    );

    const textarea = screen.getByRole('textbox', { name: 'Welcome Text' });
    expect(textarea.getAttribute('data-slot')).toBe('textarea');
    expect(textarea.className).toContain('min-h-32');
    expect((textarea as HTMLTextAreaElement).value).toBe(
      'Welcome {nickname}!'
    );
    expect(screen.getByText('19 / 2000')).not.toBeNull();
    expect(
      screen.getByText(/Leave blank to disable/).className
    ).toContain('text-muted-foreground');
  });

  test('saves the edited value on blur and respects the host loading state', () => {
    const handleChange = jest.fn();
    render(<WelcomeField value="" onChange={handleChange} loading={true} />);

    const textarea = screen.getByRole('textbox', { name: 'Welcome Text' });
    expect((textarea as HTMLTextAreaElement).disabled).toBe(true);

    fireEvent.change(textarea, {
      target: { value: 'Hello {@nickname}' },
    });
    fireEvent.blur(textarea);

    expect(handleChange).toHaveBeenCalledWith('Hello {@nickname}');
  });

  test('synchronizes when the stored group value changes externally', () => {
    const { rerender } = render(
      <WelcomeField value="First" onChange={jest.fn()} loading={false} />
    );

    rerender(
      <WelcomeField value="Updated" onChange={jest.fn()} loading={false} />
    );

    expect(
      (screen.getByRole('textbox', {
        name: 'Welcome Text',
      }) as HTMLTextAreaElement).value
    ).toBe('Updated');
  });
});
