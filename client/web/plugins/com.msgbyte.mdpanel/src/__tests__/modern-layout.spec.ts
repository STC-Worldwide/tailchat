import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('Markdown panel modern layout', () => {
  test('uses responsive Tailwind layout without styled-components', () => {
    const source = readFileSync(
      path.resolve(__dirname, '../group/MarkdownPanel.tsx'),
      'utf8'
    );

    expect(source).not.toContain('styled-components');
    expect(source).toContain('max-md:h-[calc(100dvh-1rem)]');
    expect(source).toContain('text-muted-foreground');
    expect(source).toContain('[&_.tailchat-markdown-editor]:h-full');
  });
});
