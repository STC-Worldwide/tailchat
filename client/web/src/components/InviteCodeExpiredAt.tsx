import React from 'react';
import {
  datetimeFromNow,
  formatFullTime,
  GroupInvite,
  localTrans,
  t,
} from 'tailchat-shared';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/official/tooltip';
import { useAppPortalContainer } from '@/hooks/useAppPortalContainer';

interface InviteCodeExpiredAtProps {
  invite: Pick<GroupInvite, 'expiredAt' | 'usageLimit'>;
}
export const InviteCodeExpiredAt: React.FC<InviteCodeExpiredAtProps> =
  React.memo((props) => {
    const { invite } = props;
    const portalContainer = useAppPortalContainer();

    if (invite.expiredAt && new Date(invite.expiredAt).valueOf() < Date.now()) {
      return <span>{t('该邀请码已过期')}</span>;
    }

    return (
      <>
        {!invite.expiredAt ? (
          <span>{t('该邀请码永不过期')}</span>
        ) : (
          <span>
            {localTrans({ 'zh-CN': '将在 ', 'en-US': 'Expires ' })}
            <Tooltip>
              <TooltipTrigger
                render={
                  <span className="cursor-help font-medium underline decoration-dotted underline-offset-4">
                    {datetimeFromNow(invite.expiredAt)}
                  </span>
                }
              />
              <TooltipContent portalContainer={portalContainer}>
                {formatFullTime(invite.expiredAt)}
              </TooltipContent>
            </Tooltip>
            {localTrans({ 'zh-CN': ' 过期', 'en-US': '' })}
          </span>
        )}

        {invite.usageLimit && (
          <>
            <span aria-hidden="true" className="mx-2 text-muted-foreground">
              ·
            </span>

            <span>
              {localTrans({
                'zh-CN': `可使用 ${invite.usageLimit} 次`,
                'en-US': `Can be used ${invite.usageLimit} times`,
              })}
            </span>
          </>
        )}
      </>
    );
  });
InviteCodeExpiredAt.displayName = 'InviteCodeExpiredAt';
