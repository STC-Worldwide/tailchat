import React, {
  PropsWithChildren,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';

export interface SlidesRef {
  next: () => void;
  prev: () => void;
}

export interface SlidesProps extends PropsWithChildren {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Lightweight step container for modal flows. It keeps only the active slide
 * mounted, matching the existing non-swipe workflow without pulling in a
 * carousel renderer.
 */
export const Slides = React.forwardRef<SlidesRef, SlidesProps>((props, ref) => {
  const slides = useMemo(
    () => React.Children.toArray(props.children),
    [props.children]
  );
  const [index, setIndex] = useState(0);

  useImperativeHandle(
    ref,
    () => ({
      next: () =>
        setIndex((current) => Math.min(current + 1, slides.length - 1)),
      prev: () => setIndex((current) => Math.max(current - 1, 0)),
    }),
    [slides.length]
  );

  return (
    <div
      className={`slides overflow-hidden transition-[height] duration-200 ${
        props.className ?? ''
      }`}
      style={props.style}
    >
      {slides[index]}
    </div>
  );
});
Slides.displayName = 'Slides';
