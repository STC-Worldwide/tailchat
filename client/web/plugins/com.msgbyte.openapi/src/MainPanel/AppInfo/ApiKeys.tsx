import React, { useMemo, useState } from 'react';
import {
  closeModal,
  ModalWrapper,
  openModal,
  postRequest,
  showErrorToasts,
  showSuccessToasts,
  useAsyncRefresh,
  useAsyncRequest,
} from '@capital/common';
import {
  Button,
  Checkbox,
  Input,
  Loading,
  Popconfirm,
  Table,
  Tag,
} from '@capital/component';
import { useOpenAppInfo } from '../context';
import { Translate } from '../../translate';
import type { OpenAppApiKey, OpenAppApiKeyScope } from '../types';

function formatDate(value?: string, fallback = '-') {
  if (!value) {
    return fallback;
  }
  const d = new Date(value);
  return Number.isNaN(d.valueOf()) ? fallback : d.toLocaleString();
}

function isExpired(key: OpenAppApiKey) {
  return (
    Boolean(key.expiresAt) && new Date(key.expiresAt).valueOf() <= Date.now()
  );
}

/**
 * API keys of an app: list, create (key shown once), revoke.
 */
const ApiKeys: React.FC = React.memo(() => {
  const { appId, capability } = useOpenAppInfo();
  const hasBot = capability.includes('bot');
  const hasAdmin = capability.includes('admin');

  const {
    loading,
    value: keys = [],
    refresh,
  } = useAsyncRefresh(async (): Promise<OpenAppApiKey[]> => {
    if (!hasBot) {
      return [];
    }
    const { data } = await postRequest('/openapi/apikey/list', { appId });
    return data ?? [];
  }, [appId, hasBot]);

  const [, handleRevoke] = useAsyncRequest(
    async (keyId: string) => {
      await postRequest('/openapi/apikey/revoke', { appId, keyId });
      showSuccessToasts(Translate.apiKeys.revokedSuccess);
      await refresh();
    },
    [appId, refresh]
  );

  const handleCreate = () => {
    const modalKey = openModal(
      <CreateApiKeyModal
        appId={appId}
        hasAdmin={hasAdmin}
        onClose={() => {
          closeModal(modalKey);
          refresh();
        }}
      />
    );
  };

  const columns = useMemo(
    () => [
      {
        title: Translate.apiKeys.keyName,
        dataIndex: 'name',
        render: (_: unknown, record: OpenAppApiKey) => (
          <div className="min-w-0">
            <div className="truncate font-medium">{record.name}</div>
            <div className="truncate font-mono text-xs text-muted-foreground">
              tck_{record.keyId}…
            </div>
          </div>
        ),
      },
      {
        title: Translate.apiKeys.scopes,
        dataIndex: 'scopes',
        render: (_: unknown, record: OpenAppApiKey) => (
          <div className="flex flex-wrap gap-1">
            {record.scopes.map((scope) => (
              <Tag key={scope}>{scope}</Tag>
            ))}
          </div>
        ),
      },
      {
        title: Translate.apiKeys.lastUsedAt,
        dataIndex: 'lastUsedAt',
        render: (value: string) =>
          formatDate(value, Translate.apiKeys.neverUsed),
      },
      {
        title: Translate.apiKeys.expiresAt,
        dataIndex: 'expiresAt',
        render: (value: string) => formatDate(value, Translate.apiKeys.never),
      },
      {
        title: Translate.apiKeys.status,
        key: 'status',
        render: (_: unknown, record: OpenAppApiKey) =>
          record.revoked ? (
            <Tag color="red">{Translate.apiKeys.revoked}</Tag>
          ) : isExpired(record) ? (
            <Tag color="orange">{Translate.apiKeys.expired}</Tag>
          ) : (
            <Tag color="green">{Translate.apiKeys.active}</Tag>
          ),
      },
      {
        title: Translate.operation,
        key: 'action',
        render: (_: unknown, record: OpenAppApiKey) =>
          record.revoked ? null : (
            <Popconfirm
              title={Translate.apiKeys.revokeConfirm}
              onConfirm={() => handleRevoke(record.keyId)}
            >
              <Button danger={true} size="small">
                {Translate.apiKeys.revoke}
              </Button>
            </Popconfirm>
          ),
      },
    ],
    [handleRevoke]
  );

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <section aria-labelledby="openapi-api-keys" className="space-y-3">
        <div className="flex items-start justify-between gap-4 max-sm:flex-col">
          <div className="min-w-0">
            <h2 id="openapi-api-keys" className="text-base font-semibold">
              {Translate.app.apiKeys}
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {Translate.apiKeys.intro}
            </p>
          </div>
          <Button type="primary" disabled={!hasBot} onClick={handleCreate}>
            {Translate.apiKeys.create}
          </Button>
        </div>

        {!hasBot && (
          <p className="text-sm text-muted-foreground">
            {Translate.apiKeys.needBot}
          </p>
        )}

        <Loading spinning={loading}>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <Table
              columns={columns}
              dataSource={keys}
              pagination={false}
              locale={{ emptyText: Translate.apiKeys.noKeys }}
            />
          </div>
        </Loading>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">{Translate.apiKeys.usage}</h3>
        <pre className="overflow-x-auto rounded-lg border border-border bg-muted p-3 font-mono text-xs leading-5">
          {`curl -s ${window.location.origin}/api/user/whoami \\
  -H "Authorization: Bearer tck_..." \\
  -H "Content-Type: application/json" -d "{}"`}
        </pre>
      </section>
    </div>
  );
});
ApiKeys.displayName = 'ApiKeys';

interface CreateApiKeyModalProps {
  appId: string;
  hasAdmin: boolean;
  onClose: () => void;
}

const CreateApiKeyModal: React.FC<CreateApiKeyModalProps> = React.memo(
  ({ appId, hasAdmin, onClose }) => {
    const [name, setName] = useState('');
    const [expiresInDays, setExpiresInDays] = useState('');
    const [selected, setSelected] = useState<string[]>([]);
    const [createdKey, setCreatedKey] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const { loading: scopesLoading, value: scopes = [] } =
      useAsyncRefresh(async (): Promise<OpenAppApiKeyScope[]> => {
        const { data } = await postRequest('/openapi/apikey/scopes', {});
        return data ?? [];
      }, []);

    const toggle = (scope: string, checked: boolean) => {
      setSelected((prev) =>
        checked
          ? prev.includes(scope)
            ? prev
            : [...prev, scope]
          : prev.filter((s) => s !== scope)
      );
    };

    const [{ loading: creating }, handleSubmit] = useAsyncRequest(async () => {
      if (!name.trim()) {
        showErrorToasts(Translate.apiKeys.nameRequired);
        return;
      }
      if (selected.length === 0) {
        showErrorToasts(Translate.apiKeys.scopeRequired);
        return;
      }

      const days = Number(expiresInDays);
      const { data } = await postRequest('/openapi/apikey/create', {
        appId,
        name: name.trim(),
        scopes: selected,
        ...(expiresInDays.trim() && Number.isInteger(days) && days > 0
          ? { expiresInDays: days }
          : {}),
      });

      setCreatedKey(data?.key ?? null);
    }, [appId, name, selected, expiresInDays]);

    const handleCopy = async () => {
      if (!createdKey) {
        return;
      }
      try {
        await navigator.clipboard.writeText(createdKey);
        setCopied(true);
      } catch (err) {
        showErrorToasts(err);
      }
    };

    return (
      <ModalWrapper title={Translate.apiKeys.create}>
        {createdKey ? (
          <div className="space-y-4">
            <p className="text-sm leading-6">{Translate.apiKeys.created}</p>
            <pre
              data-testid="created-api-key"
              className="overflow-x-auto rounded-lg border border-border bg-muted p-3 font-mono text-xs leading-5 select-all"
            >
              {createdKey}
            </pre>
            <div className="flex justify-end gap-2">
              <Button onClick={handleCopy}>
                {copied ? Translate.apiKeys.copied : Translate.apiKeys.copy}
              </Button>
              <Button type="primary" onClick={onClose}>
                {Translate.apiKeys.done}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <label className="block space-y-1">
              <span className="text-sm font-medium">
                {Translate.apiKeys.keyName}
              </span>
              <Input
                value={name}
                maxLength={64}
                placeholder={Translate.apiKeys.keyNamePlaceholder}
                onChange={(e) => setName(e.target.value)}
              />
            </label>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">
                {Translate.apiKeys.scopes}
              </legend>
              <Loading spinning={scopesLoading}>
                <div className="space-y-2">
                  {scopes.map((scope) => {
                    const adminLocked = scope.name === 'admin' && !hasAdmin;
                    return (
                      <div key={scope.name} className="flex items-start gap-2">
                        <Checkbox
                          checked={selected.includes(scope.name)}
                          disabled={adminLocked}
                          onChange={(e) => toggle(scope.name, e.target.checked)}
                        >
                          <span className="font-mono text-sm">
                            {scope.name}
                          </span>
                        </Checkbox>
                        <span className="text-xs leading-5 text-muted-foreground">
                          {adminLocked
                            ? Translate.apiKeys.adminNeedsCapability
                            : scope.description}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Loading>
            </fieldset>

            <label className="block space-y-1">
              <span className="text-sm font-medium">
                {Translate.apiKeys.expiresInDays}
              </span>
              <Input
                type="number"
                min={1}
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value)}
              />
            </label>

            <div className="flex justify-end">
              <Button type="primary" loading={creating} onClick={handleSubmit}>
                {Translate.apiKeys.create}
              </Button>
            </div>
          </div>
        )}
      </ModalWrapper>
    );
  }
);
CreateApiKeyModal.displayName = 'CreateApiKeyModal';

export default ApiKeys;
