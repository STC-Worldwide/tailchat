import React, { useMemo } from 'react';
import { Translate } from '../translate';
import { AREAS, TASK_TYPES } from '../shared';

interface Entry {
  area?: string;
  taskType?: string;
  hours: number;
}

/**
 * The building x task rollup, computed from entries.
 *
 * This is the same grid as the Subcontractor Daily Report already published
 * for this project — the point of matching it exactly is that the report stops
 * being something anyone types.
 *
 * Areas are whatever the entries actually use, unioned with the default list,
 * so a project with different buildings still gets a complete table.
 */
export const WeekMatrix: React.FC<{ entries: Entry[] }> = React.memo(
  ({ entries }) => {
    const areas = useMemo(() => {
      const used = entries
        .map((e) => e.area)
        .filter((a): a is string => Boolean(a));

      return Array.from(new Set([...AREAS, ...used]));
    }, [entries]);

    const cell = (area: string, task: string) =>
      entries
        .filter((e) => e.area === area && e.taskType === task)
        .reduce((sum, e) => sum + (e.hours ?? 0), 0);

    const columnTotal = (task: string) =>
      entries
        .filter((e) => e.taskType === task)
        .reduce((sum, e) => sum + (e.hours ?? 0), 0);

    const grand = entries.reduce((sum, e) => sum + (e.hours ?? 0), 0);

    const num = (value: number) =>
      value ? value.toFixed(1) : <span style={{ opacity: 0.4 }}>—</span>;

    const cellStyle: React.CSSProperties = {
      padding: '4px 10px',
      textAlign: 'right',
      fontVariantNumeric: 'tabular-nums',
    };
    const headStyle: React.CSSProperties = {
      padding: '4px 10px',
      textAlign: 'right',
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: '.06em',
      opacity: 0.7,
    };

    return (
      <div style={{ marginBottom: 16, overflowX: 'auto' }}>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
          {Translate.weekToDate}
        </div>
        <table style={{ borderCollapse: 'collapse', minWidth: 520 }}>
          <thead>
            <tr>
              <th style={{ ...headStyle, textAlign: 'left' }}>
                {Translate.area}
              </th>
              {TASK_TYPES.map((task) => (
                <th key={task} style={headStyle}>
                  {task}
                </th>
              ))}
              <th style={headStyle}>{Translate.total}</th>
            </tr>
          </thead>
          <tbody>
            {areas.map((area) => {
              const rowTotal = entries
                .filter((e) => e.area === area)
                .reduce((sum, e) => sum + (e.hours ?? 0), 0);

              return (
                <tr key={area}>
                  <th
                    scope="row"
                    style={{
                      ...cellStyle,
                      textAlign: 'left',
                      fontWeight: 500,
                    }}
                  >
                    <code>{area}</code>
                  </th>
                  {TASK_TYPES.map((task) => (
                    <td key={task} style={cellStyle}>
                      {num(cell(area, task))}
                    </td>
                  ))}
                  <td style={{ ...cellStyle, fontWeight: 600 }}>
                    {num(rowTotal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <th
                scope="row"
                style={{ ...cellStyle, textAlign: 'left', fontWeight: 600 }}
              >
                {Translate.totalByTask}
              </th>
              {TASK_TYPES.map((task) => (
                <td key={task} style={{ ...cellStyle, fontWeight: 600 }}>
                  {num(columnTotal(task))}
                </td>
              ))}
              <td style={{ ...cellStyle, fontWeight: 700 }}>{num(grand)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  }
);
WeekMatrix.displayName = 'WeekMatrix';
