import React from 'react';
import { t } from 'tailchat-shared';
import { TcEmpty } from '@/components/ui/empty';

interface NotFoundProps {
  message?: string;
}

/**
 * 没有数据或没找到数据
 */
export const NotFound: React.FC<NotFoundProps> = React.memo((props) => {
  return <TcEmpty description={props.message ?? t('未找到内容')} />;
});
NotFound.displayName = 'NotFound';
