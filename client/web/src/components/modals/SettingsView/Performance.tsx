import { measure } from '@/utils/measure-helper';
import React, { useMemo } from 'react';
import { t } from 'tailchat-shared';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/official/table';
import { SettingsPage, SettingsSection } from './Layout';

function formatMetric(name: string, value: unknown): string {
  if (typeof value !== 'number') {
    return String(value);
  }

  if (name.toLowerCase().includes('ratio')) {
    return `${(value * 100).toFixed(1)}%`;
  }

  const rounded = value >= 100 ? value.toFixed(0) : value.toFixed(1);
  return `${rounded.replace(/\.0$/, '')} ms`;
}

const MetricTable: React.FC<{ values: Record<string, unknown> }> = ({
  values,
}) => (
  <div className="overflow-hidden rounded-lg border border-border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('指标')}</TableHead>
          <TableHead className="w-40 text-right">{t('耗时')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Object.entries(values).map(([name, value]) => (
          <TableRow key={name}>
            <TableCell className="font-medium">{name}</TableCell>
            <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground">
              {formatMetric(name, value)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);
MetricTable.displayName = 'MetricTable';

export const SettingsPerformance: React.FC = React.memo(() => {
  const { vitals, record, timeUsage } = useMemo(
    () => ({
      vitals: measure.getVitals(),
      record: measure.getRecord(),
      timeUsage: measure.getTimeUsage(),
    }),
    []
  );

  return (
    <SettingsPage
      title={t('性能统计')}
      description={t('查看当前客户端会话记录的性能和时间指标。')}
    >
      <SettingsSection
        title="Web Vitals"
        description={t('浏览器提供的核心页面体验指标。')}
      >
        <MetricTable values={vitals} />
      </SettingsSection>

      <SettingsSection
        title={t('渲染记录')}
        description={t('应用启动和关键界面渲染的测量结果。')}
      >
        <MetricTable values={record} />
      </SettingsSection>

      <SettingsSection
        title={t('操作耗时')}
        description={t('当前会话内记录的操作执行时间。')}
      >
        <MetricTable values={timeUsage} />
      </SettingsSection>
    </SettingsPage>
  );
});
SettingsPerformance.displayName = 'SettingsPerformance';
