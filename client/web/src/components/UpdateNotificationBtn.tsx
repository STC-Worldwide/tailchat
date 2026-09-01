import React from 'react';
import { t } from 'tailchat-shared';
import { Button } from '@/components/ui/official/button';

/**
 * sw更新提示的按钮
 */
export const UpdateNotificationBtn: React.FC = React.memo(() => {
  return (
    <div>
      <Button type="button" size="sm" onClick={() => window.location.reload()}>
        {t('立即刷新')}
      </Button>
    </div>
  );
});
UpdateNotificationBtn.displayName = 'UpdateNotificationBtn';
