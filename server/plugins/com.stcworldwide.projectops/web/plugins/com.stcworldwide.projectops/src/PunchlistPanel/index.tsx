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
  openModal,
  closeModal,
} from '@capital/component';
import { Translate } from '../translate';
import { punchlistRequest } from '../request';
import { formatDate, formatRef, PRIORITY_COLOR, STATUS_COLOR } from '../shared';
import { AddPunchlistModal } from './AddPunchlistModal';

interface PunchlistItem {
  _id: string;
  seq: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  deviceName?: string;
  systemName?: string;
  pointName?: string;
  instance?: number;
  assignee?: string[];
  dueDate?: string;
  resolvedAt?: string;
  verifiedAt?: string;
}

/**
 * Punchlist panel.
 *
 * Fix and verify are shown as one column with two states rather than two
 * columns of dates: on a phone in a mechanical room the question is only ever
 * "is this done, and has anyone checked", and two date columns answer it
 * worse than one label does.
 */
const PunchlistPanel: React.FC = React.memo(() => {
  const groupId = useGroupIdContext();

  const [{ value, loading }, fetch] = useAsyncFn(
    () => punchlistRequest.post('list', { groupId }).then(({ data }) => data),
    [groupId]
  );
  const items: PunchlistItem[] = Array.isArray(value) ? value : [];

  useEffect(() => {
    fetch();
  }, [fetch]);

  const handleAdd = useCallback(() => {
    const key = openModal(
      <AddPunchlistModal
        groupId={groupId}
        onSuccess={() => {
          closeModal(key);
          fetch();
        }}
      />
    );
  }, [groupId, fetch]);

  const act = useCallback(
    async (action: string, itemId: string) => {
      try {
        await punchlistRequest.post(action, { groupId, itemId });
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
        width: 96,
        render: (seq: number) => <code>{formatRef(undefined, 'PL', seq)}</code>,
      },
      {
        title: Translate.title,
        dataIndex: 'title',
        render: (title: string, record: PunchlistItem) => (
          <div>
            <div>{title}</div>
            {record.systemName && (
              <div style={{ fontSize: 12, opacity: 0.6 }}>
                {record.systemName}
                {record.pointName ? ` · ${record.pointName}` : ''}
              </div>
            )}
          </div>
        ),
      },
      {
        title: Translate.asset,
        dataIndex: 'deviceName',
        width: 150,
        render: (deviceName: string, record: PunchlistItem) =>
          deviceName ? (
            <div>
              <code>{deviceName}</code>
              {typeof record.instance === 'number' && (
                <div style={{ fontSize: 12, opacity: 0.6 }}>
                  inst {record.instance}
                </div>
              )}
            </div>
          ) : (
            '-'
          ),
      },
      {
        title: Translate.priority,
        dataIndex: 'priority',
        width: 100,
        render: (priority: string) => (
          <Tag color={PRIORITY_COLOR[priority] ?? 'default'}>{priority}</Tag>
        ),
      },
      {
        title: Translate.status,
        dataIndex: 'status',
        width: 130,
        render: (status: string) => (
          <Tag color={STATUS_COLOR[status] ?? 'default'}>{status}</Tag>
        ),
      },
      {
        title: Translate.fixVerify,
        width: 130,
        render: (_: unknown, record: PunchlistItem) => {
          if (record.verifiedAt) {
            return <span>{Translate.verified}</span>;
          }
          if (record.resolvedAt) {
            return <span>{Translate.awaitingVerify}</span>;
          }
          return <span style={{ opacity: 0.6 }}>{Translate.notFixed}</span>;
        },
      },
      {
        title: Translate.due,
        dataIndex: 'dueDate',
        width: 110,
        render: (dueDate: string) => formatDate(dueDate),
      },
      {
        title: Translate.actions,
        width: 170,
        render: (_: unknown, record: PunchlistItem) => (
          <Space>
            {!record.resolvedAt && (
              <Button size="small" onClick={() => act('resolve', record._id)}>
                {Translate.markFixed}
              </Button>
            )}
            {record.resolvedAt && !record.verifiedAt && (
              <Button
                size="small"
                type="primary"
                onClick={() => act('verify', record._id)}
              >
                {Translate.verify}
              </Button>
            )}
          </Space>
        ),
      },
    ],
    [act]
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
        <h2 style={{ margin: 0 }}>{Translate.punchlist}</h2>
        <Button type="primary" onClick={handleAdd}>
          {Translate.newItem}
        </Button>
      </div>

      <Table
        rowKey="_id"
        loading={loading}
        columns={columns}
        dataSource={items}
        pagination={false}
        size="small"
        scroll={{ x: true }}
      />
    </div>
  );
});
PunchlistPanel.displayName = 'PunchlistPanel';

export default PunchlistPanel;
