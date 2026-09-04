import { Loadable, regGroupPanel, regInspectService } from '@capital/common';
import { Translate } from './translate';

const PLUGIN_ID = 'com.stcworldwide.projectops';
const PLUGIN_NAME = 'Project Ops';

console.log(`Plugin ${PLUGIN_NAME}(${PLUGIN_ID}) is loaded`);

/**
 * Three group panels rather than one with tabs.
 *
 * Panels are what the sidebar is made of, so separate registrations mean a
 * project can have a Punchlist channel and skip Parts, order them, and drag
 * them into a category like anything else.
 */
regGroupPanel({
  name: `${PLUGIN_ID}/punchlist`,
  label: Translate.punchlist,
  provider: PLUGIN_ID,
  render: Loadable(() => import('./PunchlistPanel'), {
    componentName: `${PLUGIN_ID}:PunchlistPanel`,
  }),
});

regGroupPanel({
  name: `${PLUGIN_ID}/timesheets`,
  label: Translate.timesheets,
  provider: PLUGIN_ID,
  render: Loadable(() => import('./TimesheetPanel'), {
    componentName: `${PLUGIN_ID}:TimesheetPanel`,
  }),
});

regGroupPanel({
  name: `${PLUGIN_ID}/parts`,
  label: Translate.parts,
  provider: PLUGIN_ID,
  render: Loadable(() => import('./PartsPanel'), {
    componentName: `${PLUGIN_ID}:PartsPanel`,
  }),
});

regInspectService({
  name: `plugin:${PLUGIN_ID}.punchlist`,
  label: Translate.punchlist,
});
regInspectService({
  name: `plugin:${PLUGIN_ID}.timesheet`,
  label: Translate.timesheets,
});
regInspectService({
  name: `plugin:${PLUGIN_ID}.parts`,
  label: Translate.parts,
});
