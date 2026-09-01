import React from 'react';
import copy from 'copy-to-clipboard';
import {
  CopyIcon,
  PlusIcon,
  SquarePenIcon,
  TicketIcon,
  Trash2Icon,
} from 'lucide-react';
import {
  datetimeFromNow,
  deleteGroupInvite,
  formatFullTime,
  getAllGroupInviteCode,
  GroupInvite as GroupInviteType,
  localTrans,
  showToasts,
  t,
  useAsyncRefresh,
  useEvent,
} from 'tailchat-shared';
import { SensitiveText } from '@/components/SensitiveText';
import { UserName } from '@/components/UserName';
import { closeModal, openModal, openReconfirmModalP } from '@/components/Modal';
import { Badge } from '@/components/ui/official/badge';
import { Button } from '@/components/ui/official/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/official/empty';
import { Skeleton } from '@/components/ui/official/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/official/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/official/tooltip';
import { useAppPortalContainer } from '@/hooks/useAppPortalContainer';
import { generateInviteCodeUrl } from '@/utils/url-helper';
import { CreateGroupInvite } from '../CreateGroupInvite';
import { EditGroupInvite } from '../EditGroupInvite';
import { GroupDetailPage, GroupDetailSection } from './Layout';

type GroupInviteRow = GroupInviteType & {
  _id: string;
  createdAt: string;
};

const InviteDate: React.FC<{ value: string }> = React.memo(({ value }) => {
  const portalContainer = useAppPortalContainer();

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <time
            dateTime={new Date(value).toISOString()}
            className="cursor-help underline decoration-dotted underline-offset-4"
          >
            {datetimeFromNow(value)}
          </time>
        }
      />
      <TooltipContent portalContainer={portalContainer}>
        {formatFullTime(value)}
      </TooltipContent>
    </Tooltip>
  );
});
InviteDate.displayName = 'InviteDate';

const InviteExpiry: React.FC<{ invite: GroupInviteRow }> = React.memo(
  ({ invite }) => {
    if (!invite.expiredAt) {
      return <Badge variant="secondary">{t('永不过期')}</Badge>;
    }

    if (new Date(invite.expiredAt).valueOf() < Date.now()) {
      return <Badge variant="destructive">{t('已过期')}</Badge>;
    }

    return <InviteDate value={invite.expiredAt} />;
  }
);
InviteExpiry.displayName = 'InviteExpiry';

export const GroupInvite: React.FC<{ groupId: string }> = React.memo(
  ({ groupId }) => {
    const { loading, value, refresh } = useAsyncRefresh(async () => {
      const list = await getAllGroupInviteCode(groupId);
      return list.reverse();
    }, [groupId]);
    const rows = (value ?? []) as GroupInviteRow[];

    const handleCreateInvite = useEvent(() => {
      openModal(
        <CreateGroupInvite
          groupId={groupId}
          onInviteCreated={refresh}
          onInviteUpdated={refresh}
        />,
        { closable: true }
      );
    });

    const handleEditInviteCode = useEvent((invite: GroupInviteRow) => {
      const key = openModal(
        <EditGroupInvite
          groupId={groupId}
          code={invite.code}
          expiredAt={invite.expiredAt}
          usageLimit={invite.usageLimit}
          onEditSuccess={() => {
            showToasts(t('邀请设置修改成功'), 'success');
            closeModal(key);
            refresh();
          }}
        />,
        { closable: true }
      );
    });

    const handleCopyInviteCode = useEvent((inviteCode: string) => {
      copy(generateInviteCodeUrl(inviteCode));
      showToasts(t('邀请链接已复制到剪切板'), 'success');
    });

    const handleDeleteInvite = useEvent(async (inviteId: string) => {
      const confirmed = await openReconfirmModalP({
        title: localTrans({
          'zh-CN': '删除邀请链接？',
          'en-US': 'Delete invitation link?',
        }),
        content: localTrans({
          'zh-CN': '删除后，任何持有此链接的用户都无法再使用它加入群组。',
          'en-US':
            'Anyone with this link will no longer be able to use it to join the group.',
        }),
      });

      if (confirmed) {
        await deleteGroupInvite(groupId, inviteId);
        await refresh();
      }
    });

    const renderActions = (row: GroupInviteRow, mobile = false) => (
      <div className="flex items-center justify-end gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={mobile ? 'size-11' : undefined}
          aria-label={t('编辑邀请链接')}
          title={t('编辑邀请链接')}
          onClick={() => handleEditInviteCode(row)}
        >
          <SquarePenIcon />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={mobile ? 'size-11' : undefined}
          aria-label={t('复制邀请链接')}
          title={t('复制邀请链接')}
          onClick={() => handleCopyInviteCode(row.code)}
        >
          <CopyIcon />
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="icon-sm"
          className={mobile ? 'size-11' : undefined}
          aria-label={t('删除')}
          title={t('删除')}
          onClick={() => handleDeleteInvite(row._id)}
        >
          <Trash2Icon />
        </Button>
      </div>
    );

    return (
      <GroupDetailPage
        title={t('邀请码')}
        description={t('创建、复制和撤销可用于加入当前群组的邀请链接。')}
        action={
          <Button type="button" onClick={handleCreateInvite}>
            <PlusIcon data-icon="inline-start" />
            {t('创建邀请码')}
          </Button>
        }
      >
        <GroupDetailSection
          title={t('邀请链接')}
          description={t('管理邀请的有效期、使用限制和创建者。')}
        >
          {loading && value === undefined ? (
            <div
              className="space-y-2"
              aria-label={localTrans({
                'zh-CN': '正在加载邀请链接',
                'en-US': 'Loading invitation links',
              })}
            >
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : rows.length === 0 ? (
            <Empty className="border border-dashed border-border py-10">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <TicketIcon />
                </EmptyMedia>
                <EmptyTitle>
                  {localTrans({
                    'zh-CN': '还没有邀请链接',
                    'en-US': 'No invitation links yet',
                  })}
                </EmptyTitle>
                <EmptyDescription>
                  {localTrans({
                    'zh-CN': '创建链接，与希望加入此群组的用户分享。',
                    'en-US':
                      'Create a link to share with people you want to invite.',
                  })}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button type="button" onClick={handleCreateInvite}>
                  <PlusIcon data-icon="inline-start" />
                  {t('创建邀请码')}
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <>
              <div className="hidden overflow-hidden rounded-lg border border-border md:block">
                <Table className="min-w-[640px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('邀请码')}</TableHead>
                      <TableHead>{t('创建时间')}</TableHead>
                      <TableHead>{t('过期时间')}</TableHead>
                      <TableHead>{t('使用次数')}</TableHead>
                      <TableHead>{t('创建者')}</TableHead>
                      <TableHead className="w-32 text-right">
                        {t('操作')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row._id}>
                        <TableCell className="font-mono text-xs">
                          <SensitiveText text={row.code} />
                        </TableCell>
                        <TableCell>
                          <InviteDate value={row.createdAt} />
                        </TableCell>
                        <TableCell>
                          <InviteExpiry invite={row} />
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {row.usage}
                          {row.usageLimit && ` / ${row.usageLimit}`}
                        </TableCell>
                        <TableCell>
                          <UserName userId={row.creator} />
                        </TableCell>
                        <TableCell>{renderActions(row)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="divide-y divide-border overflow-hidden rounded-lg border border-border md:hidden">
                {rows.map((row) => (
                  <article key={row._id} className="space-y-4 p-4">
                    <header className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">
                          {localTrans({
                            'zh-CN': '邀请码',
                            'en-US': 'Invite code',
                          })}
                        </p>
                        <div className="font-mono text-sm">
                          <SensitiveText text={row.code} />
                        </div>
                      </div>
                      {renderActions(row, true)}
                    </header>

                    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                      <div className="min-w-0 space-y-1">
                        <dt className="text-xs text-muted-foreground">
                          {t('过期时间')}
                        </dt>
                        <dd>
                          <InviteExpiry invite={row} />
                        </dd>
                      </div>
                      <div className="min-w-0 space-y-1">
                        <dt className="text-xs text-muted-foreground">
                          {t('使用次数')}
                        </dt>
                        <dd className="tabular-nums">
                          {row.usage}
                          {row.usageLimit && ` / ${row.usageLimit}`}
                        </dd>
                      </div>
                      <div className="min-w-0 space-y-1">
                        <dt className="text-xs text-muted-foreground">
                          {t('创建时间')}
                        </dt>
                        <dd>
                          <InviteDate value={row.createdAt} />
                        </dd>
                      </div>
                      <div className="min-w-0 space-y-1">
                        <dt className="text-xs text-muted-foreground">
                          {t('创建者')}
                        </dt>
                        <dd className="truncate">
                          <UserName userId={row.creator} />
                        </dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            </>
          )}
        </GroupDetailSection>
      </GroupDetailPage>
    );
  }
);
GroupInvite.displayName = 'GroupInvite';
