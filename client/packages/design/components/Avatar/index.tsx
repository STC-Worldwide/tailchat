import React, { useMemo, useState } from 'react';
import _head from 'lodash/head';
import _upperCase from 'lodash/upperCase';
import _isNil from 'lodash/isNil';
import { getTextColorHex, px2rem } from './utils';
import { isValidStr } from '../utils';
import { imageUrlParser } from '../Image';

export { getTextColorHex };

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string;
  isOnline?: boolean;
  src?: string | React.ReactElement | null;
  icon?: React.ReactNode;
  size?: 'small' | 'middle' | 'large' | number;
  shape?: 'circle' | 'square';
}

const _Avatar: React.FC<AvatarProps> = React.memo((props) => {
  const {
    isOnline,
    name,
    src: source,
    icon,
    size = 'middle',
    shape = 'circle',
    style: customStyle,
    ...rest
  } = props;
  const [imageFailed, setImageFailed] = useState(false);
  const src =
    typeof source === 'string' && isValidStr(source)
      ? imageUrlParser(source)
      : undefined;
  const initial = useMemo(() => _upperCase(_head(name)), [name]);
  const sizeValue = typeof size === 'number' ? size : ({ small: 24, middle: 32, large: 40 }[size] ?? 32);

  const color = useMemo(
    () =>
      (src === undefined || imageFailed) && _isNil(icon)
        ? getTextColorHex(name)
        : undefined,
    [src, imageFailed, icon, name]
  );

  const style = useMemo<React.CSSProperties>(() => {
    return {
      userSelect: 'none',
      ...customStyle,
      width: customStyle?.width ?? px2rem(sizeValue),
      height: customStyle?.height ?? px2rem(sizeValue),
      fontSize: customStyle?.fontSize ?? px2rem(sizeValue * 0.4),
      backgroundColor: color,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      borderRadius: shape === 'circle' ? '50%' : 3,
    };
  }, [customStyle, sizeValue, color, shape]);

  const inner = (
    <div {...rest} style={style}>
      {src && !imageFailed ? (
        <img
          src={src}
          alt={name}
          draggable={false}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => setImageFailed(true)}
        />
      ) : (
        icon ?? initial
      )}
    </div>
  );

  if (typeof isOnline !== 'boolean') {
    return inner;
  }

  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}>
      {inner}
      <span
        aria-label={isOnline ? 'online' : 'offline'}
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: isOnline ? '#22c55e' : '#999',
          boxShadow: '0 0 0 2px var(--tc-surface-sidebar, #fff)',
        }}
      />
    </span>
  );
});
_Avatar.displayName = 'Avatar';

type CompoundedComponent = React.FC<AvatarProps> & {
  Group: React.FC<React.HTMLAttributes<HTMLDivElement>>;
};

export const Avatar: CompoundedComponent = _Avatar as any;
Avatar.Group = ({ children, ...props }) => (
  <div {...props} style={{ display: 'flex', alignItems: 'center', ...props.style }}>
    {children}
  </div>
);
