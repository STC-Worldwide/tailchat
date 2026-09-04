import React, { useMemo, useState } from 'react';
import { Checkbox, UserName } from '@capital/component';
import { Translate } from '../translate';
import { AREAS, TASK_TYPES, formatHm } from '../shared';

interface Entry {
  userId: string;
  area?: string;
  taskType?: string;
  hours: number;
}

/** Anything booked without an area still has to land somewhere visible. */
const UNASSIGNED = '—';

const sum = (entries: Entry[]) =>
  entries.reduce((total, e) => total + (e.hours ?? 0), 0);

/**
 * The weekly rollup, as one card per building.
 *
 * This replaces the area x task grid. The grid matched the Subcontractor
 * Daily Report's own orientation, but a table of mostly-zero cells is a poor
 * read on a narrow panel, and the figure anyone actually wants — how much
 * went into this building — was the row total at the far right edge.
 *
 * What the grid did do well was compare one task across every area by reading
 * down a column. The strip above the cards is what carries that over; it is
 * also the line the paper report opens with.
 *
 * Cards keep a fixed order — the standing area list first, then whatever else
 * the entries used — so a card stays in the same place from one day to the
 * next and can be found by position rather than by reading.
 */
export const WeekRollup: React.FC<{ entries: Entry[] }> = React.memo(
  ({ entries }) => {
    const [showEmpty, setShowEmpty] = useState(false);
    const [expanded, setExpanded] = useState<string[]>([]);

    const byArea = useMemo(() => {
      const groups = new Map<string, Entry[]>();
      for (const area of AREAS) {
        groups.set(area, []);
      }

      for (const entry of entries) {
        const key = entry.area || UNASSIGNED;
        const bucket = groups.get(key);
        if (bucket) {
          bucket.push(entry);
        } else {
          groups.set(key, [entry]);
        }
      }

      // Anything the entries invented sorts alphabetically after the standing
      // list, so the order does not shift when the newest entry changes.
      const extras = Array.from(groups.keys())
        .filter((area) => !AREAS.includes(area))
        .sort();

      return [...AREAS, ...extras].map(
        (area) => [area, groups.get(area) ?? []] as [string, Entry[]]
      );
    }, [entries]);

    const grand = sum(entries);
    const visible = byArea.filter(([, rows]) => showEmpty || sum(rows) > 0);

    const toggle = (area: string) =>
      setExpanded((current) =>
        current.includes(area)
          ? current.filter((a) => a !== area)
          : [...current, area]
      );

    const numeric: React.CSSProperties = {
      fontVariantNumeric: 'tabular-nums',
    };
    const line = 'rgba(127, 127, 127, 0.25)';
    const softLine = 'rgba(127, 127, 127, 0.14)';

    return (
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 8,
          }}
        >
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            {Translate.weekToDate}
          </div>
          <Checkbox
            checked={showEmpty}
            onChange={(e: any) => setShowEmpty(Boolean(e?.target?.checked))}
          >
            <span style={{ fontSize: 12, opacity: 0.7 }}>
              {Translate.showEmptyAreas}
            </span>
          </Checkbox>
        </div>

        {/* One line for the whole week, and each task across every area. */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'baseline',
            gap: '4px 18px',
            padding: '8px 12px',
            marginBottom: 10,
            border: `1px solid ${line}`,
            borderRadius: 9,
          }}
        >
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
            <b style={{ ...numeric, fontSize: 18 }}>{formatHm(grand)}</b>
            <span style={{ fontSize: 11, opacity: 0.6 }}>
              {Translate.weekTotal}
            </span>
          </span>

          {TASK_TYPES.map((task) => {
            const total = sum(entries.filter((e) => e.taskType === task));
            return (
              <span
                key={task}
                style={{
                  fontSize: 12,
                  whiteSpace: 'nowrap',
                  opacity: total ? 1 : 0.45,
                }}
              >
                {task}
                <b style={{ ...numeric, marginLeft: 5 }}>{formatHm(total)}</b>
              </span>
            );
          })}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
            gap: 10,
          }}
        >
          {visible.map(([area, rows]) => {
            const areaTotal = sum(rows);
            const isOpen = expanded.includes(area);

            return (
              <div
                key={area}
                style={{
                  border: `1px solid ${line}`,
                  borderRadius: 10,
                  padding: '10px 12px 8px',
                  opacity: areaTotal ? 1 : 0.55,
                }}
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggle(area)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggle(area);
                    }
                  }}
                  title={Translate.whoWorkedHere}
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    gap: 8,
                    paddingBottom: 7,
                    marginBottom: 6,
                    borderBottom: `1px solid ${softLine}`,
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: 13 }}>
                    <span style={{ opacity: 0.5, marginRight: 5 }}>
                      {isOpen ? '▾' : '▸'}
                    </span>
                    <code>{area}</code>
                  </span>
                  <span
                    style={{
                      ...numeric,
                      fontSize: 15,
                      fontWeight: areaTotal ? 600 : 400,
                      opacity: areaTotal ? 1 : 0.5,
                    }}
                  >
                    {formatHm(areaTotal)}
                  </span>
                </div>

                {/* Every task shows, zeros included: a zero says "nothing
                    booked to software here", and a card whose rows come and
                    go cannot be read by position. */}
                {TASK_TYPES.map((task) => {
                  const taskRows = rows.filter((e) => e.taskType === task);
                  const taskTotal = sum(taskRows);

                  return (
                    <div key={task}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: 10,
                          padding: '2px 0',
                          fontSize: 12.5,
                          opacity: taskTotal ? 1 : 0.45,
                        }}
                      >
                        <span>{task}</span>
                        <span
                          style={{
                            ...numeric,
                            fontWeight: taskTotal ? 600 : 400,
                          }}
                        >
                          {formatHm(taskTotal)}
                        </span>
                      </div>

                      {isOpen &&
                        perPerson(taskRows).map(([userId, personTotal]) => (
                          <div
                            key={userId}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              gap: 10,
                              padding: '1px 0 1px 12px',
                              fontSize: 12,
                              opacity: 0.75,
                            }}
                          >
                            <UserName userId={userId} />
                            <span style={numeric}>{formatHm(personTotal)}</span>
                          </div>
                        ))}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);
WeekRollup.displayName = 'WeekRollup';

/**
 * Hours per person for one area and task, largest first. Only people who
 * booked something appear — an expanded card is a breakdown of what is there,
 * not a roll call of the crew.
 */
function perPerson(rows: Entry[]): [string, number][] {
  const totals = new Map<string, number>();

  for (const row of rows) {
    totals.set(row.userId, (totals.get(row.userId) ?? 0) + (row.hours ?? 0));
  }

  return Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
}
