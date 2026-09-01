import React, { useEffect, useRef, useState } from 'react';

export interface DelayTipProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'title'> {
  title?: React.ReactNode;
  overlay?: React.ReactNode;
}

/**
 * 延时提示
 */
export const DelayTip: React.FC<DelayTipProps> = React.memo((props) => {
  const { title, overlay, children, style, ...rest } = props;
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const content = overlay ?? title;

  useEffect(() => () => clearTimeout(timer.current), []);

  const handleEnter = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(true), 1000);
  };

  const handleLeave = () => {
    clearTimeout(timer.current);
    setOpen(false);
  };

  return (
    <span
      {...rest}
      style={{ position: 'relative', display: 'inline-flex', ...style }}
      onMouseEnter={(event) => {
        handleEnter();
        rest.onMouseEnter?.(event);
      }}
      onMouseLeave={(event) => {
        handleLeave();
        rest.onMouseLeave?.(event);
      }}
      onFocus={(event) => {
        handleEnter();
        rest.onFocus?.(event);
      }}
      onBlur={(event) => {
        handleLeave();
        rest.onBlur?.(event);
      }}
    >
      {children}
      {open && content && (
        <span
          role="tooltip"
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 'calc(100% + 8px)',
            zIndex: 1000,
            maxWidth: 240,
            padding: '6px 8px',
            borderRadius: 6,
            background: 'var(--tc-slate-950, #111827)',
            color: '#fff',
            fontSize: 12,
            lineHeight: 1.35,
            whiteSpace: 'nowrap',
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
          }}
        >
          {content}
        </span>
      )}
    </span>
  );
});
DelayTip.displayName = 'DelayTip';
