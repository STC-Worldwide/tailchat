import React from 'react';
import logoUrl from '@assets/images/logo.svg';

/** The approved Anchor family mark; the adjacent wordmark supplies its name. */
export function BrandMark({ className = 'size-9' }: { className?: string }) {
  return <img src={logoUrl} alt="" aria-hidden="true" className={className} />;
}
