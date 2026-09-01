import React from 'react';
import { localTrans, useGroupInfo } from 'tailchat-shared';
import { Link2Icon, TriangleAlertIcon } from 'lucide-react';
import { ModalWrapper } from '../../Modal';
import { CreateInviteCode } from './CreateInviteCode';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/official/empty';

interface CreateGroupInviteProps {
  groupId: string;
  onInviteCreated?: () => void;
  onInviteUpdated?: () => void;
}

export const CreateGroupInvite: React.FC<CreateGroupInviteProps> = React.memo(
  (props) => {
    const groupInfo = useGroupInfo(props.groupId);

    if (!groupInfo) {
      return (
        <ModalWrapper
          className="w-[min(30rem,calc(100vw-2rem))]"
          style={{ maxWidth: 480 }}
          title={localTrans({
            'zh-CN': '无法创建邀请',
            'en-US': 'Unable to create invite',
          })}
        >
          <Empty className="border border-border py-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <TriangleAlertIcon />
              </EmptyMedia>
              <EmptyTitle>
                {localTrans({
                  'zh-CN': '群组信息不可用',
                  'en-US': 'Group information is unavailable',
                })}
              </EmptyTitle>
              <EmptyDescription>
                {localTrans({
                  'zh-CN': '关闭此窗口并刷新页面后重试。',
                  'en-US':
                    'Close this window, refresh the page, and try again.',
                })}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </ModalWrapper>
      );
    }

    return (
      <ModalWrapper
        className="w-[min(30rem,calc(100vw-2rem))]"
        style={{ maxWidth: 480 }}
        title={localTrans({
          'zh-CN': '邀请用户加入群组',
          'en-US': 'Invite people to the group',
        })}
      >
        <div className="space-y-6">
          <div className="flex items-start gap-3 rounded-lg bg-muted/45 p-3.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Link2Icon className="size-4" />
            </span>
            <div className="min-w-0 space-y-1">
              <p className="truncate text-sm font-medium text-foreground">
                {groupInfo.name}
              </p>
              <p className="text-sm leading-5 text-muted-foreground">
                {localTrans({
                  'zh-CN':
                    '创建一个可分享的链接。获得链接的用户可以申请加入此群组。',
                  'en-US':
                    'Create a shareable link. Anyone who receives it can request to join this group.',
                })}
              </p>
            </div>
          </div>

          <CreateInviteCode
            groupId={props.groupId}
            onInviteCreated={props.onInviteCreated}
            onInviteUpdated={props.onInviteUpdated}
          />
        </div>
      </ModalWrapper>
    );
  }
);
CreateGroupInvite.displayName = 'CreateGroupInvite';
