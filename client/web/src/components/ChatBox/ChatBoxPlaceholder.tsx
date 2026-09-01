import React from 'react';
import { TcSkeleton } from '@/components/ui/skeleton';

export const ChatBoxPlaceholder: React.FC = React.memo(() => {
  return (
    <div className="px-2 w-2/3">
      {Array.from({ length: 10 }).map((_, index) => (
        <TcSkeleton key={index} className="mb-2" avatar={true} lines={1} />
      ))}
    </div>
  );
});
ChatBoxPlaceholder.displayName = 'ChatBoxPlaceholder';
