import { openModal } from '@/plugin/common';
import React, { useCallback } from 'react';
import { t, Trans, useUserInfo } from 'tailchat-shared';
import { closeModal } from './Modal';
import { ClaimTemporaryUser } from './modals/ClaimTemporaryUser';
import { Button } from '@/components/ui/official/button';

/**
 * 访客账号提示
 */
export const GlobalTemporaryTip: React.FC = React.memo(() => {
  const userInfo = useUserInfo();
  const show = userInfo?.temporary === true;

  const handleClaim = useCallback(() => {
    if (!userInfo?._id) {
      return;
    }

    const key = openModal(
      <ClaimTemporaryUser
        userId={userInfo._id}
        onSuccess={() => closeModal(key)}
      />
    );
  }, [userInfo?._id]);

  return show ? (
    <div className="flex min-h-8 items-center justify-center bg-primary px-3 text-center text-sm text-primary-foreground">
      <Trans>
        当前使用的是一个临时账号,{' '}
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-7 px-1 font-semibold text-primary-foreground hover:text-primary-foreground"
          onClick={handleClaim}
        >
          立即认领
        </Button>
      </Trans>
    </div>
  ) : null;
});
GlobalTemporaryTip.displayName = 'GlobalTemporaryTip';
