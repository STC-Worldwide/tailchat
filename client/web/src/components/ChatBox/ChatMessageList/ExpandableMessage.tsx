import { Button } from '@/components/ui/official/button';
import { ChevronDownIcon } from 'lucide-react';
import React, { PropsWithChildren, useEffect, useRef, useState } from 'react';

interface ExpandableMessageProps extends PropsWithChildren {
  maxHeight?: number;
  expandLabel: string;
}

/**
 * Keeps unusually long messages compact without relying on the former
 * AutoFolder implementation.
 */
export const ExpandableMessage: React.FC<ExpandableMessageProps> = React.memo(
  ({ children, expandLabel, maxHeight = 340 }) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const [expanded, setExpanded] = useState(false);
    const [overflowing, setOverflowing] = useState(false);

    useEffect(() => {
      const content = contentRef.current;
      if (!content) {
        return;
      }

      const updateOverflow = () => {
        setOverflowing(content.scrollHeight > maxHeight + 1);
      };
      const observer = new ResizeObserver(updateOverflow);

      observer.observe(content);
      updateOverflow();

      return () => observer.disconnect();
    }, [maxHeight]);

    return (
      <div
        className="relative overflow-hidden"
        style={{ maxHeight: expanded ? undefined : maxHeight }}
      >
        <div ref={contentRef}>{children}</div>

        {overflowing && !expanded && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-20 items-end justify-center bg-gradient-to-t from-background via-background/90 to-transparent pb-1">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="pointer-events-auto shadow-sm"
              onClick={() => setExpanded(true)}
            >
              <ChevronDownIcon />
              {expandLabel}
            </Button>
          </div>
        )}
      </div>
    );
  }
);
ExpandableMessage.displayName = 'ExpandableMessage';
