import React, { useState } from 'react';
import { Icon } from 'tailchat-design';

interface CollapseViewProps extends React.PropsWithChildren {
  title: string;
  className?: string;
  style?: React.CSSProperties;
}
export const CollapseView: React.FC<CollapseViewProps> = React.memo((props) => {
  const [open, setOpen] = useState(true);

  return (
    <div className={props.className} style={props.style}>
      <button
        type="button"
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-body hover:bg-black/5 dark:hover:bg-white/10"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="font-medium">{props.title}</span>
        <Icon icon={open ? 'mdi:chevron-up' : 'mdi:chevron-down'} />
      </button>
      {open && <div className="px-3 py-2">{props.children}</div>}
    </div>
  );
});
CollapseView.displayName = 'CollapseView';
