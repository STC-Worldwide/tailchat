import React from 'react';
import { showNotification, t } from 'tailchat-shared';

export function showPluginLoadError(loadErrorPluginNames: string[]) {
  showNotification(
    (
      <div>
        <p>{t('插件加载失败')}:</p>

        {loadErrorPluginNames.map((name) => (
          <p key={name}>- {name}</p>
        ))}
      </div>
    ),
    2
  );
}
