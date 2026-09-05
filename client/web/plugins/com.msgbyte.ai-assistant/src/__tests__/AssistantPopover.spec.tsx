import { render, screen } from '@testing-library/react';
import React from 'react';

let mockMessage = '';
let mockAsyncValue: any;
const mockSetMessage = jest.fn();

jest.mock('@capital/common', () => ({
  getCachedUserInfo: jest.fn(),
  getMessageTextDecorators: () => ({ serialize: (value: string) => value }),
  localTrans: (values: Record<string, string>) => values['en-US'],
  useAsyncRequest: () => [{ loading: false, value: mockAsyncValue }, jest.fn()],
  useConverseMessageContext: () => ({ messages: [] }),
}));

jest.mock('@capital/component', () => ({
  Button: ({ block, children, htmlType, icon, type, ...props }: any) => (
    <button type={htmlType ?? 'button'} {...props}>
      {icon}
      {children}
    </button>
  ),
  Divider: () => <hr />,
  Icon: () => <span aria-hidden="true" />,
  LoadingSpinner: () => <span>Loading</span>,
  Tag: ({ children }: any) => <span>{children}</span>,
  useChatInputActionContext: () => ({
    message: mockMessage,
    setMessage: mockSetMessage,
  }),
}));

import { AssistantPopover } from '../popover';

describe('AssistantPopover', () => {
  beforeEach(() => {
    mockMessage = '';
    mockAsyncValue = undefined;
    mockSetMessage.mockClear();
  });

  test('shows the concise default action state', () => {
    render(<AssistantPopover onCompleted={jest.fn()} />);

    expect(screen.getByRole('heading', { name: 'BASsie' })).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Summary Messages' })
    ).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Improve Text' })).toBeNull();
    expect(
      screen.getByText(/input message then show more actions/i)
    ).toBeTruthy();
  });

  test('shows writing actions when the composer contains text', () => {
    mockMessage = 'Draft message';
    render(<AssistantPopover onCompleted={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Improve Text' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Make Shorter' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Make Longer' })).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Translate Input' })
    ).toBeTruthy();
  });

  test('renders a labelled result with its apply action', () => {
    mockAsyncValue = {
      result: true,
      answer: 'A refined answer',
      usage: 42,
    };
    render(<AssistantPopover onCompleted={jest.fn()} />);

    expect(screen.getByRole('region', { name: 'BASsie result' })).toBeTruthy();
    expect(screen.getByText('A refined answer')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Apply' })).toBeTruthy();
  });

  test('renders the service response failure as an alert', () => {
    mockAsyncValue = { result: false };
    render(<AssistantPopover onCompleted={jest.fn()} />);

    expect(screen.getByRole('alert')).toBeTruthy();
    expect(
      screen.getByText('Server is busy, please try again later')
    ).toBeTruthy();
  });
});
