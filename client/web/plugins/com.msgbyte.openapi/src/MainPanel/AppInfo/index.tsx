import React, { useMemo } from 'react';
import { Icon, SidebarView } from '@capital/component';
import { Loadable, useEvent } from '@capital/common';
import { useOpenAppInfo } from '../context';
import { Translate } from '../../translate';

// const Summary = Loadable(() => import('./Summary'));
const Profile = Loadable(() => import('./Profile'));
const Bot = Loadable(() => import('./Bot'));
const Webpage = Loadable(() => import('./Webpage'));
const OAuth = Loadable(() => import('./OAuth'));
const ApiKeys = Loadable(() => import('./ApiKeys'));

const AppInfo: React.FC = React.memo(() => {
  const { appName, onSelectApp } = useOpenAppInfo();

  const handleBack = useEvent(() => {
    onSelectApp(null);
  });

  const menu = useMemo(
    () => [
      {
        type: 'group',
        title: appName,
        children: [
          {
            type: 'link',
            title: Translate.backToApplications,
            icon: <Icon icon="mdi:arrow-left" />,
            onClick: handleBack,
          },
          // {
          //   type: 'item',
          //   title: '总览',
          //   content: <Summary />,
          //   isDev: true,
          // },
          {
            type: 'item',
            title: Translate.app.basicInfo,
            content: <Profile />,
          },
          {
            type: 'item',
            title: Translate.app.bot,
            content: <Bot />,
          },
          {
            type: 'item',
            title: Translate.app.apiKeys,
            content: <ApiKeys />,
          },
          {
            type: 'item',
            title: Translate.app.webpage,
            content: <Webpage />,
            isDev: true,
          },
          {
            type: 'item',
            title: Translate.app.oauth,
            content: <OAuth />,
          },
        ],
      },
    ],
    [appName, handleBack]
  );

  return (
    <div className="h-full min-h-0">
      <SidebarView
        menu={menu}
        navigationLabel={Translate.openapi}
        defaultContentPath="0.children.1.content"
      />
    </div>
  );
});
AppInfo.displayName = 'AppInfo';

export default AppInfo;
