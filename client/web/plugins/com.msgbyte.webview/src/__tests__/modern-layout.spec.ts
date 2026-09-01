import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('Custom Webview panel modern layout', () => {
  test('uses a responsive editor and accessible iframe without styled-components', () => {
    const source = readFileSync(
      path.resolve(__dirname, '../group/GroupCustomWebPanelRender.tsx'),
      'utf8'
    );

    expect(source).not.toContain('styled-components');
    expect(source).toContain('title={Translate.customwebpanel}');
    expect(source).toContain('sandbox=""');
    expect(source).toContain('srcDoc=');
    expect(source).toContain('<ModalWrapper');
    expect(source).toContain('max-md:h-[calc(100dvh-1rem)]');
    expect(source).toContain('h-full resize-none font-mono text-sm');
  });
});
