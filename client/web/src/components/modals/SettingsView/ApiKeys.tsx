import React, { useCallback, useState } from 'react';
import copy from 'copy-to-clipboard';
import {
  request,
  showSuccessToasts,
  showToasts,
  t,
  useAsyncRefresh,
  useAsyncRequest,
} from 'tailchat-shared';
import { closeModal, ModalWrapper, openModal } from '@/components/Modal';
import { Button } from '@/components/ui/official/button';
import { Badge } from '@/components/ui/official/badge';
import { Checkbox } from '@/components/ui/official/checkbox';
import { Input } from '@/components/ui/official/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/official/table';
import { SettingsPage, SettingsSection } from './Layout';
import { PlusIcon } from 'lucide-react';

/**
 * 个人访问令牌, 详见 server/services/core/user/apikey.service.ts
 */
interface ApiKeyItem {
  keyId: string;
  name: string;
  scopes: string[];
  createdAt?: string;
  expiresAt?: string;
  lastUsedAt?: string;
  revokedAt?: string;
  revoked: boolean;
}

interface ApiKeyScope {
  name: string;
  description: string;
  actions: string[];
}

function formatDate(value: string | undefined, fallback: string): string {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);

  return Number.isNaN(date.valueOf()) ? fallback : date.toLocaleString();
}

function isExpired(item: ApiKeyItem): boolean {
  return (
    Boolean(item.expiresAt) && new Date(item.expiresAt!).valueOf() <= Date.now()
  );
}

export const SettingsApiKeys: React.FC = React.memo(() => {
  const {
    loading,
    value: keys = [],
    refresh,
  } = useAsyncRefresh(async (): Promise<ApiKeyItem[]> => {
    const { data } = await request.post('/api/user/apikey/list', {});

    return data ?? [];
  }, []);

  const [, handleRevoke] = useAsyncRequest(
    async (keyId: string) => {
      await request.post('/api/user/apikey/revoke', { keyId });
      showSuccessToasts(t('密钥已吊销'));
      await refresh();
    },
    [refresh]
  );

  const handleConfirmRevoke = useCallback(
    (item: ApiKeyItem) => {
      const key = openModal(
        <ModalWrapper title={t('吊销密钥')}>
          <p className="pb-6 text-sm leading-6">
            {t('吊销后使用此密钥的请求将立即失败，且不可恢复。')}
          </p>
          <div className="space-x-2 text-right">
            <Button variant="secondary" onClick={() => closeModal(key)}>
              {t('取消')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                closeModal(key);
                handleRevoke(item.keyId);
              }}
            >
              {t('吊销')}
            </Button>
          </div>
        </ModalWrapper>
      );
    },
    [handleRevoke]
  );

  const handleCreate = useCallback(() => {
    const key = openModal(
      <CreateApiKeyModal
        onClose={() => {
          closeModal(key);
          refresh();
        }}
      />
    );
  }, [refresh]);

  return (
    <SettingsPage
      title={t('API 密钥')}
      description={t(
        '密钥以你自己的身份调用 Anchor Chat 接口, 权限不会超过你本人, 并由所选作用域进一步限制。'
      )}
    >
      <SettingsSection
        title={t('个人访问令牌')}
        description={t('密钥只在创建时完整显示一次, 请妥善保管。')}
        action={
          <Button onClick={handleCreate}>
            <PlusIcon />
            {t('创建密钥')}
          </Button>
        }
      >
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('名称')}</TableHead>
                <TableHead>{t('作用域')}</TableHead>
                <TableHead>{t('创建时间')}</TableHead>
                <TableHead>{t('最近使用')}</TableHead>
                <TableHead>{t('过期时间')}</TableHead>
                <TableHead>{t('状态')}</TableHead>
                <TableHead>{t('操作')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    {loading ? t('加载中') : t('暂无密钥')}
                  </TableCell>
                </TableRow>
              )}

              {keys.map((item) => (
                <TableRow key={item.keyId}>
                  <TableCell>
                    <div className="min-w-0">
                      <div className="truncate font-medium">{item.name}</div>
                      <div className="truncate font-mono text-xs text-muted-foreground">
                        {`tck_${item.keyId}…`}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {item.scopes.map((scope) => (
                        <Badge key={scope} variant="secondary">
                          {scope}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(item.createdAt, '-')}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(item.lastUsedAt, t('尚未使用'))}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(item.expiresAt, t('永不'))}
                  </TableCell>
                  <TableCell>
                    {item.revoked ? (
                      <Badge variant="destructive">{t('已吊销')}</Badge>
                    ) : isExpired(item) ? (
                      <Badge variant="outline">{t('已过期')}</Badge>
                    ) : (
                      <Badge variant="secondary">{t('有效')}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {!item.revoked && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleConfirmRevoke(item)}
                      >
                        {t('吊销')}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SettingsSection>

      <SettingsSection title={t('用法')}>
        <pre className="overflow-x-auto rounded-lg border border-border bg-muted p-3 font-mono text-xs leading-5">
          {`curl -s ${window.location.origin}/api/user/whoami \\
  -H "Authorization: Bearer tck_..." \\
  -H "Content-Type: application/json" -d "{}"`}
        </pre>
      </SettingsSection>
    </SettingsPage>
  );
});
SettingsApiKeys.displayName = 'SettingsApiKeys';

interface CreateApiKeyModalProps {
  onClose: () => void;
}

const CreateApiKeyModal: React.FC<CreateApiKeyModalProps> = React.memo(
  (props) => {
    const [name, setName] = useState('');
    const [expiresInDays, setExpiresInDays] = useState('');
    const [selected, setSelected] = useState<string[]>([]);
    const [createdKey, setCreatedKey] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const { loading: scopesLoading, value: scopes = [] } =
      useAsyncRefresh(async (): Promise<ApiKeyScope[]> => {
        const { data } = await request.post('/api/user/apikey/scopes', {});

        return data ?? [];
      }, []);

    const handleToggleScope = useCallback((scope: string, checked: boolean) => {
      setSelected((prev) =>
        checked
          ? prev.includes(scope)
            ? prev
            : [...prev, scope]
          : prev.filter((item) => item !== scope)
      );
    }, []);

    const [{ loading: creating }, handleSubmit] = useAsyncRequest(async () => {
      if (!name.trim()) {
        showToasts(t('请输入名称'), 'warning');
        return;
      }

      if (selected.length === 0) {
        showToasts(t('请至少选择一个作用域'), 'warning');
        return;
      }

      const days = Number(expiresInDays);

      // 出错时(例如非管理员选择了 admin 作用域)由 useAsyncRequest 将服务端消息提示给用户
      const { data } = await request.post('/api/user/apikey/create', {
        name: name.trim(),
        scopes: selected,
        ...(expiresInDays.trim() && Number.isInteger(days) && days > 0
          ? { expiresInDays: days }
          : {}),
      });

      setCreatedKey(data?.key ?? null);
    }, [name, selected, expiresInDays]);

    const handleCopy = useCallback(() => {
      if (!createdKey) {
        return;
      }

      copy(createdKey);
      setCopied(true);
    }, [createdKey]);

    if (createdKey) {
      return (
        <ModalWrapper title={t('创建密钥')}>
          <div className="space-y-4">
            <p className="text-sm leading-6 text-destructive">
              {t('密钥已创建，请立即复制，关闭后无法再次查看。')}
            </p>
            <pre
              data-testid="created-api-key"
              className="overflow-x-auto rounded-lg border border-border bg-muted p-3 font-mono text-xs leading-5 select-all"
            >
              {createdKey}
            </pre>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCopy}>
                {copied ? t('已复制') : t('复制')}
              </Button>
              <Button onClick={props.onClose}>{t('完成')}</Button>
            </div>
          </div>
        </ModalWrapper>
      );
    }

    return (
      <ModalWrapper title={t('创建密钥')}>
        <div className="space-y-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">{t('名称')}</span>
            <Input
              value={name}
              maxLength={64}
              placeholder={t('例如: ops agent')}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">{t('作用域')}</legend>
            {scopesLoading ? (
              <p className="text-sm text-muted-foreground">{t('加载中')}</p>
            ) : (
              <div className="space-y-2">
                {scopes.map((scope) => (
                  <label
                    key={scope.name}
                    className="flex items-start gap-2 text-sm"
                  >
                    <Checkbox
                      className="mt-0.5"
                      checked={selected.includes(scope.name)}
                      onCheckedChange={(checked) =>
                        handleToggleScope(scope.name, Boolean(checked))
                      }
                    />
                    <span className="min-w-0">
                      <span className="font-mono">{scope.name}</span>
                      <span className="ml-2 text-xs leading-5 text-muted-foreground">
                        {scope.name === 'admin'
                          ? t('仅服务器管理员可以创建带 admin 作用域的密钥')
                          : scope.description}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </fieldset>

          <label className="block space-y-1">
            <span className="text-sm font-medium">
              {t('有效期(天, 留空为永不过期)')}
            </span>
            <Input
              type="number"
              min={1}
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(e.target.value)}
            />
          </label>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={props.onClose}>
              {t('取消')}
            </Button>
            <Button disabled={creating} onClick={() => handleSubmit()}>
              {t('创建密钥')}
            </Button>
          </div>
        </div>
      </ModalWrapper>
    );
  }
);
CreateApiKeyModal.displayName = 'CreateApiKeyModal';
