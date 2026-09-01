import { sanitizeCustomWebPanelHtml } from '../group/sanitizeCustomWebPanelHtml';

describe('sanitizeCustomWebPanelHtml', () => {
  test('preserves safe semantic and button markup', () => {
    const html = sanitizeCustomWebPanelHtml(
      '<main class="content"><h1>Title</h1><button type="button">Action</button></main>'
    );

    expect(html).toBe(
      '<main class="content"><h1>Title</h1><button type="button">Action</button></main>'
    );
  });

  test('removes executable document attributes and scripts', () => {
    const html = sanitizeCustomWebPanelHtml(
      '<html><body onload="alert(1)"><main onclick="alert(1)"><script>alert(1)</script>Safe</main></body></html>'
    );

    expect(html).not.toContain('onload');
    expect(html).not.toContain('onclick');
    expect(html).not.toContain('<script>');
    expect(html).toContain('<main>&lt;script&gt;alert(1)&lt;/script&gt;Safe</main>');
  });
});
