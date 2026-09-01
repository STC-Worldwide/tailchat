import React, { PropsWithChildren } from 'react';

export const Highlight: React.FC<PropsWithChildren> = React.memo((props) => {
  return (
    <span className="rounded-md bg-black/10 px-2 py-1 dark:bg-white/10">
      {props.children}
    </span>
  );
});
Highlight.displayName = 'Highlight';
