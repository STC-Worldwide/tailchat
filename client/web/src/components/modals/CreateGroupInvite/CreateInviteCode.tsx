import React, { useState } from 'react';
import copy from 'copy-to-clipboard';
import {
  ChevronDownIcon,
  CopyIcon,
  Link2Icon,
  LoaderCircleIcon,
  PencilIcon,
} from 'lucide-react';
import {
  createGroupInviteCode,
  GroupInvite,
  localTrans,
  PERMISSION,
  showToasts,
  t,
  useAsyncRequest,
  useEvent,
  useHasGroupPermission,
} from 'tailchat-shared';
import { InviteCodeExpiredAt } from '@/components/InviteCodeExpiredAt';
import { closeModal, openModal } from '@/components/Modal';
import { Button } from '@/components/ui/official/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/official/dropdown-menu';
import { Input } from '@/components/ui/official/input';
import { useAppPortalContainer } from '@/hooks/useAppPortalContainer';
import { generateInviteCodeUrl } from '@/utils/url-helper';
import { EditGroupInvite } from '../EditGroupInvite';

enum InviteCodeType {
  Normal = 'normal',
  Permanent = 'permanent',
}

interface CreateInviteCodeProps {
  groupId: string;
  onInviteCreated?: () => void;
  onInviteUpdated?: () => void;
}

export const CreateInviteCode: React.FC<CreateInviteCodeProps> = React.memo(
  ({ groupId, onInviteCreated, onInviteUpdated }) => {
    const [createdInvite, setCreatedInvite] = useState<GroupInvite | null>(
      null
    );
    const portalContainer = useAppPortalContainer();
    const [{ loading }, handleCreateInviteLink] = useAsyncRequest(
      async (inviteType: InviteCodeType) => {
        const invite = await createGroupInviteCode(groupId, inviteType);
        setCreatedInvite(invite);
        onInviteCreated?.();
      },
      [groupId, onInviteCreated]
    );
    const [hasInvitePermission, hasUnlimitedInvitePermission] =
      useHasGroupPermission(groupId, [
        PERMISSION.core.invite,
        PERMISSION.core.unlimitedInvite,
      ]);

    const handleCopyInvite = useEvent(() => {
      if (!createdInvite) {
        return;
      }

      copy(generateInviteCodeUrl(createdInvite.code));
      showToasts(t('邀请链接已复制到剪切板'), 'success');
    });

    const handleEditGroupInvite = useEvent(() => {
      if (!createdInvite) {
        return;
      }

      const key = openModal(
        <EditGroupInvite
          groupId={groupId}
          code={createdInvite.code}
          expiredAt={createdInvite.expiredAt}
          usageLimit={createdInvite.usageLimit}
          onEditSuccess={({ expiredAt, usageLimit }) => {
            showToasts(t('邀请设置修改成功'), 'success');
            setCreatedInvite((state) =>
              state
                ? {
                    ...state,
                    expiredAt: expiredAt
                      ? new Date(expiredAt).toISOString()
                      : undefined,
                    usageLimit,
                  }
                : null
            );
            closeModal(key);
            onInviteUpdated?.();
          }}
        />,
        { closable: true }
      );
    });

    if (createdInvite) {
      const inviteUrl = generateInviteCodeUrl(createdInvite.code);

      return (
        <div className="space-y-4" aria-live="polite">
          <div className="space-y-2">
            <label
              htmlFor="created-group-invite-url"
              className="text-sm font-medium text-foreground"
            >
              {localTrans({
                'zh-CN': '邀请链接',
                'en-US': 'Invitation link',
              })}
            </label>
            <div className="flex gap-2">
              <Input
                id="created-group-invite-url"
                readOnly
                value={inviteUrl}
                className="min-w-0 flex-1 font-mono text-xs"
                onFocus={(event) => event.currentTarget.select()}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={t('复制邀请链接')}
                onClick={handleCopyInvite}
              >
                <CopyIcon />
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="min-w-0 text-sm leading-5 text-muted-foreground">
              <InviteCodeExpiredAt invite={createdInvite} />
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 max-sm:w-full"
              onClick={handleEditGroupInvite}
            >
              <PencilIcon data-icon="inline-start" />
              {t('编辑')}
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="inline-flex w-full sm:w-auto">
          <Button
            type="button"
            size="lg"
            className="min-w-0 flex-1 rounded-r-none sm:flex-none"
            disabled={!hasInvitePermission || loading}
            aria-busy={loading}
            onClick={() => handleCreateInviteLink(InviteCodeType.Normal)}
          >
            {loading ? (
              <LoaderCircleIcon
                data-icon="inline-start"
                className="animate-spin"
              />
            ) : (
              <Link2Icon data-icon="inline-start" />
            )}
            {loading
              ? localTrans({ 'zh-CN': '正在创建', 'en-US': 'Creating link' })
              : t('创建链接')}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  size="lg"
                  className="rounded-l-none border-l border-primary-foreground/20 px-2"
                  disabled={!hasInvitePermission || loading}
                  aria-label={t('更多')}
                >
                  <ChevronDownIcon />
                </Button>
              }
            />
            <DropdownMenuContent
              portalContainer={portalContainer}
              side="bottom"
              align="end"
              sideOffset={6}
              className="min-w-56"
            >
              <DropdownMenuItem
                disabled={!hasUnlimitedInvitePermission || loading}
                onClick={() => handleCreateInviteLink(InviteCodeType.Permanent)}
              >
                <Link2Icon />
                <span className="flex flex-col items-start">
                  <span>{t('创建永久邀请码')}</span>
                  <span className="text-xs text-muted-foreground group-focus/dropdown-menu-item:text-accent-foreground">
                    {localTrans({
                      'zh-CN': '不受过期时间或使用次数限制',
                      'en-US': 'No expiration or usage limit',
                    })}
                  </span>
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {!hasInvitePermission && (
          <p className="text-sm leading-5 text-muted-foreground">
            {localTrans({
              'zh-CN': '你没有创建群组邀请链接的权限。',
              'en-US': 'You do not have permission to create group invites.',
            })}
          </p>
        )}
      </div>
    );
  }
);
CreateInviteCode.displayName = 'CreateInviteCode';
