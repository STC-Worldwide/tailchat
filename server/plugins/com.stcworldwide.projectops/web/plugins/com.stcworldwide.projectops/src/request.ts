import { createPluginRequest } from '@capital/common';

// Each model has its own service, so each gets its own request client.
// createPluginRequest keeps the dots in the plugin name and only rewrites
// them in the action, so these address plugin:<name>.<sub>/<action> cleanly.
export const punchlistRequest = createPluginRequest(
  'com.stcworldwide.projectops.punchlist'
);
export const timesheetRequest = createPluginRequest(
  'com.stcworldwide.projectops.timesheet'
);
export const partsRequest = createPluginRequest(
  'com.stcworldwide.projectops.parts'
);
