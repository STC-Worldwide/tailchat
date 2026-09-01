import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('AI assistant modern popover', () => {
  test('uses semantic responsive Shadcn surfaces without styled-components', () => {
    const source = readFileSync(path.resolve(__dirname, '../popover.tsx'), 'utf8');
    const indexSource = readFileSync(path.resolve(__dirname, '../index.tsx'), 'utf8');

    expect(source).not.toContain('styled-components');
    expect(source).toContain('className="w-full space-y-3 p-3"');
    expect(source).toContain('aria-live="polite"');
    expect(source).toContain('role="alert"');
    expect(source).toContain('type="text"');
    expect(indexSource).toContain('ariaLabel={Translate.name}');
    expect(indexSource).toContain(
      'overlayClassName="w-[min(22rem,calc(100vw-1.5rem))]"'
    );
  });
});
