import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import clsx from 'clsx';
import { UserListItem } from '@/components/UserListItem';
import { MentionCommandItem } from '../MentionCommandItem';

export interface SuggestionItem {
  id: string;
  display: string;
}

export interface MentionSuggestionListRef {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

interface Props {
  kind: 'user' | 'panel';
  items: SuggestionItem[];
  hideDiscriminator?: boolean;
  command: (item: SuggestionItem) => void;
}

/**
 * tiptap mention 建议下拉 (facelift 输入框)
 */
export const MentionSuggestionList = forwardRef<
  MentionSuggestionListRef,
  Props
>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [props.items]);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command(item);
    }
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: (event) => {
      if (props.items.length === 0) {
        return false;
      }
      if (event.key === 'ArrowUp') {
        setSelectedIndex(
          (selectedIndex + props.items.length - 1) % props.items.length
        );
        return true;
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
        return true;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  if (props.items.length === 0) {
    return null;
  }

  return (
    <div className="w-72 max-h-60 overflow-y-auto rounded-md bg-raised text-body border border-subtle shadow-elevationHigh p-1">
      {props.items.map((item, index) => (
        <div
          key={item.id}
          className={clsx('rounded cursor-pointer', {
            'bg-primary/15': index === selectedIndex,
          })}
          onMouseEnter={() => setSelectedIndex(index)}
          onClick={() => selectItem(index)}
        >
          {props.kind === 'user' ? (
            <UserListItem
              userId={item.id}
              hideDiscriminator={props.hideDiscriminator}
            />
          ) : (
            <MentionCommandItem icon="mdi:pound" label={item.display} />
          )}
        </div>
      ))}
    </div>
  );
});
MentionSuggestionList.displayName = 'MentionSuggestionList';
