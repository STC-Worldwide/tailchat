import React, { useState } from 'react';
import { Avatar, Button, Input, UserName } from '@capital/component';
import type { OpenAppInfo } from 'types';
import {
  useAsyncRequest,
  postRequest,
  showErrorToasts,
  useGroupIdContext,
  showSuccessToasts,
} from '@capital/common';
import { Translate } from './translate';

const IntegrationPanel: React.FC = React.memo(() => {
  const [appId, setAppId] = useState('');
  const [openAppInfo, setOpenAppInfo] = useState<OpenAppInfo | null>(null);
  const groupId = useGroupIdContext();

  const [{ loading }, handleQueryApp] = useAsyncRequest(async () => {
    setOpenAppInfo(null);
    const { data } = await postRequest('/openapi/app/get', {
      appId: appId.trim(),
    });

    if (!data) {
      showErrorToasts(Translate.notFoundApp);
      return;
    }

    setOpenAppInfo(data);
  }, [appId]);

  const [{ loading: addBotLoading }, handleAddBotIntoGroup] =
    useAsyncRequest(async () => {
      await postRequest('/openapi/integration/addBotUser', {
        appId,
        groupId,
      });
      showSuccessToasts();
    }, [appId]);

  return (
    <div className="mx-auto w-full max-w-4xl pb-12">
      <header className="space-y-1.5 pr-12">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {Translate.groupdetail}
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          {Translate.onlyAllowManualAddition}
        </p>
      </header>

      <section
        aria-labelledby="integration-find-app"
        className="mt-8 space-y-4 border-t border-border pt-6"
      >
        <div className="space-y-1">
          <h2 id="integration-find-app" className="text-base font-semibold">
            {Translate.findApplication}
          </h2>
          <p className="text-sm leading-5 text-muted-foreground">
            {Translate.findApplicationHint}
          </p>
        </div>

        <div className="flex max-w-2xl gap-2 max-sm:flex-col">
          <Input
            aria-label={Translate.appId}
            placeholder={Translate.appId}
            value={appId}
            onChange={(e) => setAppId(e.target.value)}
          />
          <Button
            type="primary"
            className="shrink-0 max-sm:w-full"
            disabled={!appId.trim()}
            loading={loading}
            onClick={handleQueryApp}
          >
            {Translate.search}
          </Button>
        </div>
      </section>

      {openAppInfo && (
        <section
          aria-labelledby="integration-app-result"
          className="mt-8 rounded-xl border border-border bg-card p-5 text-card-foreground"
        >
          <div className="flex items-start gap-4 max-sm:flex-col">
            <Avatar
              size={56}
              src={openAppInfo.appIcon}
              name={openAppInfo.appName}
            />

            <div className="min-w-0 flex-1">
              <h2 id="integration-app-result" className="text-lg font-semibold">
                {openAppInfo.appName}
              </h2>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">
                {openAppInfo.appDesc || Translate.noApplicationDescription}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                <span className="text-muted-foreground">
                  {Translate.developer}:
                </span>
                <UserName userId={openAppInfo.owner} />
              </div>

              <div className="mt-5">
                {openAppInfo.capability.includes('bot') ? (
                  <Button
                    type="primary"
                    size="small"
                    loading={addBotLoading}
                    onClick={handleAddBotIntoGroup}
                  >
                    {Translate.addBot}
                  </Button>
                ) : (
                  <Button type="primary" size="small" disabled={true}>
                    {Translate.cannotAddBot}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
});
IntegrationPanel.displayName = 'IntegrationPanel';

export default IntegrationPanel;
