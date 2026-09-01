import React, { useMemo } from 'react';
import { openModal, closeModal } from '@capital/common';
import { Table, Button, Loading } from '@capital/component';
import { OpenApp } from './types';
import AppInfo from './AppInfo';
import { OpenAppInfoProvider } from './context';
import { CreateOpenApp } from '../modals/CreateOpenApp';
import { ServiceChecker } from '../components/ServiceChecker';
import { useOpenAppList } from './useOpenAppList';
import { Translate } from '../translate';

const OpenApiMainPanel: React.FC = React.memo(() => {
  const { loading, allApps, refresh, appInfo, handleSetSelectedApp } =
    useOpenAppList();

  const columns = useMemo(
    () => [
      {
        title: Translate.name,
        dataIndex: 'appName',
      },
      {
        title: Translate.operation,
        key: 'action',
        render: (_, record: OpenApp) => (
          <Button onClick={() => handleSetSelectedApp(record._id)}>
            {Translate.enter}
          </Button>
        ),
      },
    ],
    []
  );

  const handleCreateOpenApp = () => {
    const key = openModal(
      <CreateOpenApp
        onSuccess={() => {
          refresh();
          closeModal(key);
        }}
      />
    );
  };

  return (
    <Loading spinning={loading} style={{ height: '100%' }}>
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background text-foreground">
        {appInfo ? (
          <div className="min-h-0 flex-1">
            <OpenAppInfoProvider
              appInfo={appInfo}
              onSelectApp={handleSetSelectedApp}
              refresh={refresh}
            >
              <AppInfo />
            </OpenAppInfoProvider>
          </div>
        ) : (
          <>
            <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-5 max-sm:flex-col max-sm:items-stretch md:px-8 md:py-6">
              <div className="min-w-0">
                <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
                  {Translate.openapi}
                </h1>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {Translate.manageApplications}
                </p>
              </div>
              <Button type="primary" onClick={handleCreateOpenApp}>
                {Translate.createApplication}
              </Button>
            </header>
            <main className="min-h-0 flex-1 overflow-auto p-4 md:p-6 lg:p-8">
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                <Table
                  columns={columns}
                  dataSource={allApps}
                  pagination={false}
                  locale={{ emptyText: Translate.noApplications }}
                />
              </div>
            </main>
          </>
        )}
      </div>
    </Loading>
  );
});
OpenApiMainPanel.displayName = 'OpenApiMainPanel';

const OpenApiMainPanelWrapper = () => {
  return (
    <ServiceChecker>
      <OpenApiMainPanel />
    </ServiceChecker>
  );
};

export default OpenApiMainPanelWrapper;
