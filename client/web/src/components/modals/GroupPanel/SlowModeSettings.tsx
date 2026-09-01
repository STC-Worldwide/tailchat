import React from 'react';
import {
  GROUP_PANEL_SLOW_MODE_INTERVALS,
  GROUP_PANEL_SLOW_MODE_MAX_MESSAGES,
  isGroupPanelSlowMode,
  t,
} from 'tailchat-shared';
import type { GroupPanelSlowMode } from 'tailchat-shared';
import { TimerResetIcon } from 'lucide-react';
import { Switch } from '@/components/ui/official/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/official/select';

const DEFAULT_SLOW_MODE: GroupPanelSlowMode = {
  intervalSeconds: 60,
  maxMessages: 1,
};

function formatInterval(intervalSeconds: number): string {
  return t('{{minutes}} 分钟', {
    minutes: intervalSeconds / 60,
  });
}

interface SlowModeSettingsProps {
  value?: unknown;
  onChange: (value: GroupPanelSlowMode | undefined) => void;
}

export const SlowModeSettings: React.FC<SlowModeSettingsProps> = React.memo(
  (props) => {
    const value = isGroupPanelSlowMode(props.value)
      ? props.value
      : DEFAULT_SLOW_MODE;
    const enabled = isGroupPanelSlowMode(props.value);
    const intervalOptions = GROUP_PANEL_SLOW_MODE_INTERVALS.map((seconds) => ({
      label: formatInterval(seconds),
      value: String(seconds),
    }));
    const maxMessageOptions = GROUP_PANEL_SLOW_MODE_MAX_MESSAGES.map(
      (count) => ({
        label: count,
        value: String(count),
      })
    );

    const updateValue = (patch: Partial<GroupPanelSlowMode>) => {
      props.onChange({
        ...value,
        ...patch,
      });
    };

    return (
      <div className="rounded-lg border border-border px-4 py-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 gap-3">
            <TimerResetIcon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
            <div>
              <div className="font-medium text-foreground">
                {t('限制成员的发送频率')}
              </div>
              <div className="mt-0.5 text-xs leading-5 text-muted-foreground">
                {t('每位成员独立计数，系统消息和机器人不受限制')}
              </div>
            </div>
          </div>

          <Switch
            checked={enabled}
            aria-label={t('开启慢速模式')}
            onCheckedChange={(checked) =>
              props.onChange(checked ? DEFAULT_SLOW_MODE : undefined)
            }
          />
        </div>

        {enabled && (
          <div className="mt-4 border-t border-border pt-4">
            <div className="grid gap-3 text-sm text-foreground sm:flex sm:flex-wrap sm:items-center sm:gap-2">
              <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 sm:contents">
                <span>{t('每')}</span>
                <Select
                  value={String(value.intervalSeconds)}
                  items={intervalOptions}
                  onValueChange={(intervalSeconds) =>
                    intervalSeconds !== null &&
                    updateValue({ intervalSeconds: Number(intervalSeconds) })
                  }
                >
                  <SelectTrigger
                    aria-label={`${t('慢速模式')} · ${t('每')}`}
                    className="w-full sm:w-[116px]"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {intervalOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 sm:contents">
                <span>{t('内最多发送')}</span>
                <Select
                  value={String(value.maxMessages)}
                  items={maxMessageOptions}
                  onValueChange={(maxMessages) =>
                    maxMessages !== null &&
                    updateValue({ maxMessages: Number(maxMessages) })
                  }
                >
                  <SelectTrigger
                    aria-label={`${t('慢速模式')} · ${t('内最多发送')}`}
                    className="w-full sm:w-[88px]"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {maxMessageOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span>{t('条消息')}</span>
              </div>
            </div>
            <div className="mt-2 text-xs leading-5 text-muted-foreground">
              {t('达到上限后，将从最早一条消息的发送时间开始倒计时')}
            </div>
          </div>
        )}
      </div>
    );
  }
);
SlowModeSettings.displayName = 'SlowModeSettings';
