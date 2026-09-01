import { fireEvent, render, screen } from '@testing-library/react';
import React, { useState } from 'react';
import { MarkdownEditor } from '../Markdown/editor';

jest.mock('../Markdown/render', () => ({
  Markdown: ({ raw }: { raw: string }) => <article>{raw}</article>,
}));

const EditorHarness: React.FC<{ initialValue?: string }> = ({
  initialValue = '',
}) => {
  const [value, setValue] = useState(initialValue);

  return <MarkdownEditor value={value} onChange={setValue} />;
};

describe('MarkdownEditor', () => {
  test('formats selected text from the Shadcn toolbar', () => {
    render(<EditorHarness initialValue="Tailchat" />);
    const editor = screen.getByRole('textbox') as HTMLTextAreaElement;
    editor.setSelectionRange(0, editor.value.length);

    fireEvent.click(screen.getByRole('button', { name: '粗体' }));

    expect(editor.value).toBe('**Tailchat**');
  });

  test('switches between write and preview views without losing content', () => {
    render(<EditorHarness initialValue="# Modern UI" />);

    fireEvent.click(screen.getByRole('button', { name: '预览' }));
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(
      screen.getByRole('region', { name: 'Markdown 预览' }).textContent
    ).toContain('# Modern UI');

    fireEvent.click(screen.getByRole('button', { name: '编辑' }));
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe(
      '# Modern UI'
    );
  });

  test('supports familiar keyboard shortcuts', () => {
    render(<EditorHarness initialValue="link" />);
    const editor = screen.getByRole('textbox') as HTMLTextAreaElement;
    editor.setSelectionRange(0, editor.value.length);

    fireEvent.keyDown(editor, { key: 'k', ctrlKey: true });

    expect(editor.value).toBe('[link](https://)');
  });
});
