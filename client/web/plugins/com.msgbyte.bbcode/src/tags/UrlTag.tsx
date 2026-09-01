import { Link } from '@capital/component';
import React from 'react';
import type { TagProps } from '../bbcode/type';

const linkClassName =
  'break-words rounded-sm text-primary underline decoration-dotted underline-offset-4 transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50';

const safeExternalProtocols = new Set(['http:', 'https:', 'mailto:', 'tel:']);

export function isSafeExternalUrl(url: string) {
  try {
    return safeExternalProtocols.has(new URL(url).protocol);
  } catch {
    return false;
  }
}

export const UrlTag: React.FC<TagProps> = React.memo((props) => {
  const { node } = props;
  const text = node.content.join('');
  const url = node.attrs.url ?? text;

  if (url.startsWith('/') && !url.startsWith('//')) {
    // 内部地址，使用 react-router 进行导航
    return (
      <Link
        className={linkClassName}
        to={url}
        onContextMenu={(e) => e.stopPropagation()}
      >
        {text}
      </Link>
    );
  }

  if (url.startsWith(window.location.origin)) {
    // 内部地址，使用 react-router 进行导航
    return (
      <Link
        className={linkClassName}
        to={url.replace(window.location.origin, '')}
        onContextMenu={(e) => e.stopPropagation()}
      >
        {text}
      </Link>
    );
  }

  if (!isSafeExternalUrl(url)) {
    return <span className="break-words">{text}</span>;
  }

  return (
    <a
      className={linkClassName}
      href={url}
      title={text}
      target="_blank"
      rel="noopener noreferrer"
      onContextMenu={(e) => e.stopPropagation()}
    >
      {text}
    </a>
  );
});
UrlTag.displayName = 'UrlTag';
