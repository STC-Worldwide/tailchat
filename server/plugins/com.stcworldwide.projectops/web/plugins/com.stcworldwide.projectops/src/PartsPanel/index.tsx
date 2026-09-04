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
import { useProjectOpsSettings } from '../Settings';
import { partsRequest } from '../request';
import { formatDate, formatRef, STATUS_COLOR } from '../shared';
import { AddPartModal } from './AddPartModal';

interface PartLine {
  _id: string;
  seq: number;
  manufacturer?: string;
  partNumber?: string;
  description: string;
  quantity: number;
  unit: string;
  status: string;
  poNumber?: string;
  expectedAt?: string;
  deviceName?: string;
  serialNumber?: string;
}

/**
 * Parts panel.
 *
 * Receive and install are buttons rather than a status dropdown because they
 * are the two moments someone is standing there with the box, and both record
 * who and when — which a dropdown would not.
 */
const PartsPanel: React.FC = React.memo(() => {
  const groupId = useGroupIdContext();
  const { refPrefix } = useProjectOpsSettings(groupId);

  const [{ value, loading }, fetch] = useAsyncFn(
    () => partsRequest.post('list', { groupId }).then(({ data }) => data),
    [groupId]
  );
  const parts: PartLine[] = Array.isArray(value) ? value : [];

  useEffect(() => {
    fetch();
  }, [fetch]);

  const handleAdd = useCallback(() => {
    const key = openModal(
      <AddPartModal
        groupId={groupId}
        onSuccess={() => {
          closeModal(key);
          fetch();
        }}
      />
    );
  }, [groupId, fetch]);

  const act = useCallback(
    async (action: string, partId: string) => {
      try {
        await partsRequest.post(action, { groupId, partId });
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
        render: (seq: number) => <code>{formatRef(refPrefix, 'PT', seq)}</code>,
      },
      {
        title: Translate.part,
        dataIndex: 'description',
        render: (description: string, record: PartLine) => (
          <div>
            <div>
              {record.partNumber ? (
                <code>{record.partNumber}</code>
              ) : (
                description
              )}
            </div>
            <div style={{ fontSize: 12, opacity: 0.6 }}>
              {[record.manufacturer, record.partNumber ? description : null]
                .filter(Boolean)
                .join(' · ')}
            </div>
          </div>
        ),
      },
      {
        title: Translate.quantity,
        dataIndex: 'quantity',
        width: 60,
        align: 'right',
        render: (quantity: number, record: PartLine) =>
          `${quantity ?? 1} ${record.unit ?? 'ea'}`,
      },
      {
        title: Translate.status,
        dataIndex: 'status',
        width: 110,
        render: (status: string) => (
          <Tag color={STATUS_COLOR[status] ?? 'default'}>{status}</Tag>
        ),
      },
      {
        title: Translate.destination,
        dataIndex: 'deviceName',
        width: 130,
        render: (deviceName: string) =>
          deviceName ? <code>{deviceName}</code> : '-',
      },
      {
        title: Translate.poNumber,
        dataIndex: 'poNumber',
        width: 110,
        render: (poNumber: string) => poNumber ?? '-',
      },
      {
        title: Translate.expected,
        dataIndex: 'expectedAt',
        width: 110,
        render: (expectedAt: string) => formatDate(expectedAt),
      },
      {
        title: Translate.actions,
        width: 160,
        render: (_: unknown, record: PartLine) => (
          <Space size={4}>
            {record.status !== 'received' && record.status !== 'installed' && (
              <Button size="small" onClick={() => act('receive', record._id)}>
                {Translate.receive}
              </Button>
            )}
            {record.status !== 'installed' && (
              <Button
                size="small"
                type="primary"
                onClick={() => act('install', record._id)}
              >
                {Translate.install}
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
        <h2 style={{ margin: 0 }}>{Translate.parts}</h2>
        <Button type="primary" onClick={handleAdd}>
          {Translate.addPart}
        </Button>
      </div>

      <Table
        rowKey="_id"
        loading={loading}
        columns={columns}
        dataSource={parts}
        pagination={false}
        size="small"
        scroll={{ x: true }}
      />
    </div>
  );
});
PartsPanel.displayName = 'PartsPanel';

export default PartsPanel;
