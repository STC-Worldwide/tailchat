import { InstalledPlugins } from '@/plugin/InstalledPlugins';
import React from 'react';

export const PluginsPanel: React.FC = React.memo(() => {
  return <InstalledPlugins />;
});
PluginsPanel.displayName = 'PluginsPanel';
