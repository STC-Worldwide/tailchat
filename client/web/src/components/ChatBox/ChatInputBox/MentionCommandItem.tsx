import React from 'react';
import { HashIcon } from 'lucide-react';

/**
 * 提及命令列表项
 */
export const MentionCommandItem: React.FC<{
  label: string;
}> = React.memo((props) => {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 text-sm">
      <HashIcon className="size-4 text-muted-foreground" />
      <div className="truncate">{props.label}</div>
    </div>
  );
});
MentionCommandItem.displayName = 'MentionCommandItem';
