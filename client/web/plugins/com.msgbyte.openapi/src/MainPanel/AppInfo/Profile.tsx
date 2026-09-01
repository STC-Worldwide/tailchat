import { useOpenAppInfo } from '../context';
import React from 'react';
import {
  FullModalField,
  Divider,
  SensitiveText,
  Button,
  Avatar,
  AvatarUploader,
  DefaultFullModalInputEditorRender,
} from '@capital/component';
import { Translate } from '../../translate';
import { useOpenAppAction } from './useOpenAppAction';

/**
 * 基础信息
 */
const Profile: React.FC = React.memo(() => {
  const { appId, appSecret, appName, appDesc, appIcon } = useOpenAppInfo();

  const { handleSetAppInfo, handleDeleteApp } = useOpenAppAction();

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <section aria-labelledby="openapi-basic-info" className="space-y-4">
        <h2 id="openapi-basic-info" className="text-base font-semibold">
          {Translate.app.basicInfo}
        </h2>

        <div className="grid items-start gap-6 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="min-w-0">
            <FullModalField
              title={Translate.app.appName}
              value={appName}
              editable={true}
              renderEditor={DefaultFullModalInputEditorRender}
              onSave={(val) => handleSetAppInfo('appName', val)}
            />

            <FullModalField
              title={Translate.app.appDesc}
              value={appDesc}
              editable={true}
              renderEditor={DefaultFullModalInputEditorRender}
              onSave={(val) => handleSetAppInfo('appDesc', val)}
            />
          </div>

          <div className="flex justify-center md:justify-end">
            <AvatarUploader
              onUploadSuccess={(fileInfo) => {
                handleSetAppInfo('appIcon', fileInfo.url);
              }}
            >
              <Avatar name={appName} src={appIcon} size={72} />
            </AvatarUploader>
          </div>
        </div>
      </section>

      <Divider />

      <section aria-labelledby="openapi-credentials" className="space-y-4">
        <h2 id="openapi-credentials" className="text-base font-semibold">
          {Translate.app.appcret}
        </h2>

        <div>
          <FullModalField title="App ID" content={appId} />
          <FullModalField
            title="App Secret"
            content={<SensitiveText text={appSecret} />}
          />
        </div>
      </section>

      <Divider />

      <section
        aria-labelledby="openapi-danger-zone"
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <h2 id="openapi-danger-zone" className="text-base font-semibold">
            {Translate.dangerZone}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {Translate.deleteApplicationHint}
          </p>
        </div>
        <Button type="primary" danger={true} onClick={handleDeleteApp}>
          {Translate.delete}
        </Button>
      </section>
    </div>
  );
});
Profile.displayName = 'Profile';

export default Profile;
