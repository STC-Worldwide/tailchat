import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('Integration panel modern layout', () => {
  test('uses responsive semantic surfaces without styled-components', () => {
    const source = readFileSync(
      path.resolve(__dirname, '../IntegrationPanel.tsx'),
      'utf8'
    );

    expect(source).not.toContain('styled-components');
    expect(source).toContain('aria-labelledby="integration-find-app"');
    expect(source).toContain('max-sm:flex-col');
    expect(source).toContain('rounded-xl border border-border bg-card');
    expect(source).toContain('disabled={!appId.trim()}');
  });
});
