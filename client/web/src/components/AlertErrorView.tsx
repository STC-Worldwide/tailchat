import React, { useState } from 'react';
import clsx from 'clsx';
import { t } from 'tailchat-shared';
import { Button } from '@/components/ui/official/button';
import { TcAlert } from '@/components/ui/alert';

/**
 * 用于接口错误显示的组件
 * @deprecated 请使用 ErrorView
 */
export const AlertErrorView: React.FC<{
  error: Error;
}> = React.memo(({ error }) => {
  const [show, setShow] = useState(false);

  const description = (
    <div>
      <span>{String(error.message)}</span>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className={clsx({
          'opacity-0': show,
        })}
        onClick={() => setShow(true)}
      >
        {t('显示详情')}
      </Button>
      {show && <pre>{String(error.stack)}</pre>}
    </div>
  );

  return (
    <TcAlert
      className="w-full h-full select-text"
      variant="error"
      title={String(error.name)}
      description={description}
    />
  );
});
AlertErrorView.displayName = 'AlertErrorView';
