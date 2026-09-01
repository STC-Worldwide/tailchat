import React from 'react';
import { t } from 'tailchat-shared';
import { TcEmpty } from './ui/empty';

interface NoDataProps {
  message?: string;
}

/**
 * 没有数据或没找到数据
 */
export const NoData: React.FC<NoDataProps> = React.memo((props) => {
  return <TcEmpty description={props.message ?? t('没有数据')} />;
});
NoData.displayName = 'NoData';
