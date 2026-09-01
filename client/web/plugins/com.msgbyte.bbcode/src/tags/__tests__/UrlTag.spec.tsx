import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import type { AstNodeObj } from '../../bbcode/type';
import { isSafeExternalUrl, UrlTag } from '../UrlTag';

function renderUrl(url: string, text = 'Example') {
  const node: AstNodeObj = {
    tag: 'url',
    attrs: { url },
    content: [text],
  };

  return render(
    <MemoryRouter>
      <UrlTag node={node} />
    </MemoryRouter>
  );
}

describe('UrlTag', () => {
  test('renders an accessible modern external link', () => {
    renderUrl('https://example.com');

    const link = screen.getByRole('link', { name: 'Example' });
    expect(link.getAttribute('href')).toBe('https://example.com');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    expect(link.classList.contains('underline-offset-4')).toBe(true);
  });

  test('does not render executable or protocol-relative URLs as links', () => {
    const { rerender } = renderUrl('javascript:alert(1)');
    expect(screen.queryByRole('link')).toBeNull();

    const node: AstNodeObj = {
      tag: 'url',
      attrs: { url: '//example.com/unsafe' },
      content: ['Protocol relative'],
    };
    rerender(
      <MemoryRouter>
        <UrlTag node={node} />
      </MemoryRouter>
    );
    expect(screen.queryByRole('link')).toBeNull();
  });

  test('allows expected external protocols', () => {
    expect(isSafeExternalUrl('https://example.com')).toBe(true);
    expect(isSafeExternalUrl('mailto:team@example.com')).toBe(true);
    expect(isSafeExternalUrl('javascript:alert(1)')).toBe(false);
  });
});
