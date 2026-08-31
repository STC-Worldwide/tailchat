import { Badge, BadgeProps, Space, Typography } from 'antd';
import clsx from 'clsx';
import React from 'react';
import { useLocation } from 'react-router';
import { Link } from 'react-router-dom';

/**
 * 群组面板项
 * 用于侧边栏
 */
export const GroupPanelItem: React.FC<{
  name: string;
  icon: React.ReactNode;
  to: string;
  dimmed?: boolean; // 颜色暗淡
  badge?: boolean;
  badgeProps?: BadgeProps;
  extraBadge?: React.ReactNode[];
}> = React.memo((props) => {
  const { icon, name, to, dimmed = false, badge } = props;
  const location = useLocation();
  const isActive = location.pathname.startsWith(to);

  return (
    <Link className="block" to={to}>
      <div
        className={clsx(
          'w-full hover:bg-black/20 dark:hover:bg-white/20 cursor-pointer rounded px-1 h-8 flex items-center text-base group',
          {
            'bg-black/20 dark:bg-white/20 ': isActive,
          },
          dimmed
            ? 'text-gray-900/40 dark:text-white/40'
            : 'text-gray-900 dark:text-white'
        )}
      >
        <div className={clsx('flex items-center justify-center px-1 mr-1')}>
          {icon}
        </div>

        <Typography.Text
          className={clsx(
            'flex-1',
            dimmed
              ? 'text-gray-900/40 dark:text-white/40'
              : 'text-gray-900 dark:text-white'
          )}
          ellipsis={true}
        >
          {name}
        </Typography.Text>

        <Space>
          {badge === true && <Badge status="error" {...props.badgeProps} />}

          {props.extraBadge}
        </Space>
      </div>
    </Link>
  );
});
GroupPanelItem.displayName = 'GroupPanelItem';
