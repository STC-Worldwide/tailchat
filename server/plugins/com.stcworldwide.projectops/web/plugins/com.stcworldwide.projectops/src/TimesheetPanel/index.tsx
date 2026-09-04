import React, { useCallback, useEffect, useMemo } from 'react';
import {
  useGroupIdContext,
  useAsyncFn,
  showToasts,
  showErrorToasts,
} from '@capital/common';
import {
  Button,
  Space,
  Table,
  Tag,
  UserName,
  openModal,
  closeModal,
} from '@capital/component';
import { Translate } from '../translate';
import { useProjectOpsSettings } from '../Settings';
import { timesheetRequest } from '../request';
import { formatDate, formatHm, formatRef, STATUS_COLOR } from '../shared';
import { AddTimesheetModal } from './AddTimesheetModal';
import { WeekRollup } from './WeekRollup';

interface TimesheetEntry {
  _id: string;
  seq: number;
  userId: string;
  workDate: string;
  hours: number;
  hourType: string;
  area?: string;
  taskType?: string;
  description?: string;
  status: string;
  lockedAt?: string;
  currentStageIndex: number;
  approvals?: { stageName: string; decision: string }[];
}

/**
 * Timesheet panel.
 *
 * Every group member sees every entry — that is a decision, not an
 * oversight — so there is no "mine" filter by default and the rollup at the
 * top is the crew's, not the reader's.
 */
const TimesheetPanel: React.FC = React.memo(() => {
  const groupId = useGroupIdContext();
  const { refPrefix } = useProjectOpsSettings(groupId);

  const [{ value, loading }, fetch] = useAsyncFn(
    () => timesheetRequest.post('list', { groupId }).then(({ data }) => data),
    [groupId]
  );
  const entries: TimesheetEntry[] = Array.isArray(value) ? value : [];

  useEffect(() => {
    fetch();
  }, [fetch]);

  const handleAdd = useCallback(() => {
    const key = openModal(
      <AddTimesheetModal
        groupId={groupId}
        onSuccess={() => {
          closeModal(key);
          fetch();
        }}
      />
    );
  }, [groupId, fetch]);

  const act = useCallback(
    async (
      action: string,
      entryId: string,
      extra?: Record<string, unknown>
    ) => {
      try {
        await timesheetRequest.post(action, { groupId, entryId, ...extra });
        showToasts(Translate.saved, 'success');
        fetch();
      } catch (err) {
        showErrorToasts(err);
      }
    },
    [groupId, fetch]
  );

  const columns = useMemo(
    () => [
      {
        title: Translate.ref,
        dataIndex: 'seq',
        width: 92,
        render: (seq: number) => <code>{formatRef(refPrefix, 'TS', seq)}</code>,
      },
      {
        title: Translate.date,
        dataIndex: 'workDate',
        width: 108,
        render: (workDate: string) => formatDate(workDate),
      },
      {
        title: Translate.who,
        dataIndex: 'userId',
        width: 130,
        render: (userId: string) => <UserName userId={userId} />,
      },
      {
        title: Translate.hours,
        dataIndex: 'hours',
        width: 70,
        align: 'right',
        render: (hours: number) => (
          <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
            {formatHm(hours)}
          </span>
        ),
      },
      {
        title: Translate.area,
        dataIndex: 'area',
        width: 80,
        render: (area: string) => (area ? <code>{area}</code> : '-'),
      },
      { title: Translate.taskType, dataIndex: 'taskType', width: 120 },
      { title: Translate.hourType, dataIndex: 'hourType', width: 96 },
      {
        title: Translate.work,
        dataIndex: 'description',
        render: (description: string) => description ?? '-',
      },
      {
        title: Translate.status,
        dataIndex: 'status',
        width: 150,
        render: (status: string, record: TimesheetEntry) => (
          <Space size={4}>
            <Tag color={STATUS_COLOR[status] ?? 'default'}>{status}</Tag>
            {record.lockedAt && <Tag>{Translate.locked}</Tag>}
          </Space>
        ),
      },
      {
        title: Translate.actions,
        width: 200,
        render: (_: unknown, record: TimesheetEntry) => (
          <Space size={4}>
            {(record.status === 'draft' || record.status === 'rejected') && (
              <Button size="small" onClick={() => act('submit', record._id)}>
                {Translate.submit}
              </Button>
            )}
            {record.status === 'submitted' && (
              <>
                <Button
                  size="small"
                  type="primary"
                  onClick={() =>
                    act('decide', record._id, { decision: 'approved' })
                  }
                >
                  {Translate.approve}
                </Button>
                <Button
                  size="small"
                  danger
                  onClick={() =>
                    act('decide', record._id, { decision: 'rejected' })
                  }
                >
                  {Translate.reject}
                </Button>
              </>
            )}
            {record.status === 'approved' && (
              <Button size="small" onClick={() => act('reopen', record._id)}>
                {Translate.reopen}
              </Button>
            )}
          </Space>
        ),
      },
    ],
    [act, refPrefix]
  );

  return (
    <div style={{ padding: 16, height: '100%', overflow: 'auto' }}>
      <div
        style={{
          marginBottom: 12,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h2 style={{ margin: 0 }}>{Translate.timesheets}</h2>
        <Button type="primary" onClick={handleAdd}>
          {Translate.logHours}
        </Button>
      </div>

      <WeekRollup entries={entries} />

      <Table
        rowKey="_id"
        loading={loading}
        columns={columns}
        dataSource={entries}
        pagination={false}
        size="small"
        scroll={{ x: true }}
      />
    </div>
  );
});
TimesheetPanel.displayName = 'TimesheetPanel';

export default TimesheetPanel;
