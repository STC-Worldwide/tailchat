import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  Button,
  Divider,
  Input,
  Space,
  Switch,
  TextArea,
} from '../modern-controls';

describe('modern plugin compatibility controls', () => {
  test('maps legacy primary loading buttons to the official Shadcn primitive', () => {
    render(
      <Button type="primary" block={true} loading={true}>
        Search
      </Button>
    );

    const button = screen.getByRole('button', { name: 'Search' });
    expect(button.getAttribute('data-slot')).toBe('button');
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(button.classList.contains('w-full')).toBe(true);
    expect(button.querySelector('.animate-spin')).not.toBeNull();
    expect(button.className).not.toContain('ant-');
  });

  test('makes disabled link buttons inert and circle buttons square', () => {
    const handleClick = jest.fn();
    render(
      <>
        <Button
          href="https://example.com"
          disabled={true}
          onClick={handleClick}
        >
          Docs
        </Button>
        <Button shape="circle" aria-label="Add item">
          +
        </Button>
      </>
    );

    const link = screen.getByText('Docs').closest('a');
    expect(link).not.toBeNull();
    expect(link?.hasAttribute('href')).toBe(false);
    expect(link?.tabIndex).toBe(-1);
    fireEvent.click(link as HTMLAnchorElement);
    expect(handleClick).not.toHaveBeenCalled();

    const circleButton = screen.getByRole('button', { name: 'Add item' });
    expect(circleButton.className).toContain('size-8');
    expect(circleButton.className).toContain('rounded-full');
  });

  test('uses an opaque high-contrast treatment for dangerous actions', () => {
    render(<Button danger={true}>Delete integration</Button>);

    const button = screen.getByRole('button', {
      name: 'Delete integration',
    });
    expect(button.className).toContain('bg-destructive');
    expect(button.className).toContain('text-destructive-foreground');
  });

  test('keeps Input.TextArea and accessible direct input primitives available', () => {
    expect(Input.TextArea).toBe(TextArea);
    const inputRef = React.createRef<HTMLInputElement>();

    render(
      <>
        <Input ref={inputRef} placeholder="Application ID" />
        <div data-testid="bare-textarea-parent">
          <TextArea placeholder="Direct textarea" />
        </div>
        <TextArea
          placeholder="Custom HTML"
          showCount={true}
          value="Hello"
          onChange={() => undefined}
        />
      </>
    );

    expect(
      screen
        .getByRole('textbox', { name: 'Application ID' })
        .getAttribute('data-slot')
    ).toBe('input');
    expect(inputRef.current).toBeInstanceOf(HTMLInputElement);
    expect(
      screen
        .getByTestId('bare-textarea-parent')
        .firstElementChild?.getAttribute('data-slot')
    ).toBe('textarea');
    expect(
      screen
        .getByRole('textbox', { name: 'Custom HTML' })
        .getAttribute('data-slot')
    ).toBe('textarea');
    expect(screen.queryByText('5')).not.toBeNull();
  });

  test('translates the legacy Switch callback to the official checked state', () => {
    const handleChange = jest.fn();
    render(<Switch aria-label="Enable bot" onChange={handleChange} />);

    const control = screen.getByRole('switch', { name: 'Enable bot' });
    expect(control.getAttribute('data-slot')).toBe('switch');
    fireEvent.click(control);
    expect(handleChange).toHaveBeenCalledWith(true, expect.anything());
  });

  test('keeps uncontrolled Switch labels and clearable Input state current', () => {
    const handleInputChange = jest.fn();
    render(
      <>
        <Switch
          aria-label="Presence"
          defaultChecked={true}
          checkedChildren="Online"
          unCheckedChildren="Offline"
        />
        <Input
          aria-label="Search plugins"
          allowClear={true}
          onChange={handleInputChange}
        />
      </>
    );

    const control = screen.getByRole('switch', { name: 'Presence' });
    expect(screen.getByText('Online')).not.toBeNull();
    fireEvent.click(control);
    expect(screen.getByText('Offline')).not.toBeNull();

    const input = screen.getByRole('textbox', { name: 'Search plugins' });
    fireEvent.change(input, { target: { value: 'calendar' } });
    fireEvent.click(screen.getByRole('button', { name: 'Clear input' }));
    expect((input as HTMLInputElement).value).toBe('');
    expect(handleInputChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({ value: '' }),
      })
    );
  });

  test('renders warning status on Input and TextArea', () => {
    render(
      <>
        <Input aria-label="Warning input" status="warning" />
        <TextArea aria-label="Warning textarea" status="warning" />
      </>
    );

    const input = screen.getByRole('textbox', { name: 'Warning input' });
    const textarea = screen.getByRole('textbox', {
      name: 'Warning textarea',
    });
    expect(input.getAttribute('data-status')).toBe('warning');
    expect(input.className).toContain('border-amber-500');
    expect(textarea.getAttribute('data-status')).toBe('warning');
    expect(textarea.className).toContain('border-amber-500');
  });

  test('renders modern spacing and separator primitives without AntD chrome', () => {
    const { container } = render(
      <Space size="large">
        <span>One</span>
        <Divider type="vertical" />
        <span>Two</span>
      </Space>
    );

    expect((container.firstChild as HTMLElement).style.gap).toBe('16px');
    expect(screen.getByRole('separator').getAttribute('data-slot')).toBe(
      'separator'
    );
    expect(container.querySelector('[class*="ant-"]')).toBeNull();
  });
});
