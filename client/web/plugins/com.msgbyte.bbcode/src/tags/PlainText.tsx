import React, { PropsWithChildren } from 'react';
import type { TagProps } from '../bbcode/type';

export const PlainText: React.FC<PropsWithChildren<TagProps>> = React.memo(
  (props) => (
    <span style={{ whiteSpace: 'break-spaces' }}>
      {props.children}
    </span>
  )
);
PlainText.displayName = 'PlainText';
