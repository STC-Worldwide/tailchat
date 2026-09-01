import React from 'react';

interface CopyableTextProps extends React.PropsWithChildren {
  className?: string;
  style?: React.CSSProperties;
  config?:
    | boolean
    | {
        text?: string | (() => string);
        onCopy?: () => void;
        icon?: React.ReactNode;
      };
}

/**
 * 可复制的文本
 */
export const CopyableText: React.FC<CopyableTextProps> = React.memo((props) => {
  const config = props.config ?? true;
  const copyable = config !== false;
  const text =
    typeof config === 'object' && config.text !== undefined
      ? typeof config.text === 'function'
        ? config.text()
        : config.text
      : String(props.children ?? '');

  const handleCopy = async () => {
    await navigator.clipboard?.writeText(text);
    if (typeof config === 'object') {
      config.onCopy?.();
    }
  };

  return (
    <span className={props.className} style={props.style}>
      {props.children}
      {copyable && (
        <button
          type="button"
          aria-label="Copy text"
          onClick={handleCopy}
          style={{
            marginInlineStart: 6,
            padding: 0,
            color: 'inherit',
            background: 'transparent',
            border: 0,
            cursor: 'pointer',
            opacity: 0.7,
          }}
        >
          {typeof config === 'object' && config.icon ? config.icon : '⧉'}
        </button>
      )}
    </span>
  );
});
CopyableText.displayName = 'CopyableText';
