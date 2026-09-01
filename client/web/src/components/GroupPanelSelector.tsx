import React, { useMemo } from 'react';
import { GroupPanelType, t, useGroupPanels } from 'tailchat-shared';
import { useGroupIdContext } from '@/context/GroupIdContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/official/select';

interface GroupPanelSelectorProps {
  className?: string;
  style?: React.CSSProperties;
  value: string;
  onChange: (value: string) => void;
  groupId?: string;
  panelType?: GroupPanelType;
}

/**
 * 群组面板选择器
 */
export const GroupPanelSelector: React.FC<GroupPanelSelectorProps> = React.memo(
  (props) => {
    const contextGroupId = useGroupIdContext();
    const groupId = props.groupId ?? contextGroupId;
    const panelType = props.panelType ?? GroupPanelType.TEXT;
    const panels = useGroupPanels(groupId);

    const filteredPanels = useMemo(
      () => panels.filter((panel) => panel.type === panelType),
      [panels, panelType]
    );
    const options = filteredPanels.map((panel) => ({
      value: panel.id,
      label: panel.name,
    }));

    return (
      <Select
        value={props.value}
        onValueChange={(value) => value !== null && props.onChange(value)}
        items={options}
      >
        <SelectTrigger
          aria-label={t('选择面板')}
          className={props.className}
          style={props.style}
        >
          <SelectValue placeholder={t('请选择面板')} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
);
GroupPanelSelector.displayName = 'GroupPanelSelector';
