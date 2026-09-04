import { SETTING_KEYS, getRefPrefix, getTimesheetChain } from '../settings';

/**
 * These read the group's own `config`, which a group manager edits through the
 * settings UI. That makes the shape untrusted: a half-filled stage or a value
 * left as a string must read as "no approval configured", because the
 * alternative is `submit` throwing for the whole crew.
 */
const ctxWith = (config: unknown) =>
  ({
    call: async () => ({ config }),
  } as any);

describe('getTimesheetChain', () => {
  test('no config at all means approval is off', async () => {
    expect(await getTimesheetChain(ctxWith(undefined), 'g')).toEqual([]);
    expect(await getTimesheetChain(ctxWith({}), 'g')).toEqual([]);
  });

  test('reads stages in the order they were configured', async () => {
    const chain = await getTimesheetChain(
      ctxWith({
        [SETTING_KEYS.timesheetApproval]: [
          { id: 'a', name: 'Foreman', roleIds: ['r1'], userIds: [] },
          { id: 'b', name: 'PM', roleIds: [], userIds: ['u1'] },
        ],
      }),
      'g'
    );

    expect(chain.map((stage) => stage.name)).toEqual(['Foreman', 'PM']);
    expect(chain[0].roleIds).toEqual(['r1']);
    expect(chain[1].userIds).toEqual(['u1']);
  });

  test('a stage with no name is dropped, not kept blank', async () => {
    // Half-filled rows are what an editor with an "add stage" button produces.
    const chain = await getTimesheetChain(
      ctxWith({
        [SETTING_KEYS.timesheetApproval]: [
          { id: 'a', name: '  ' },
          { id: 'b', name: 'PM' },
          null,
          'Foreman',
          42,
        ],
      }),
      'g'
    );

    expect(chain.map((stage) => stage.name)).toEqual(['PM']);
  });

  test('a stage with neither roles nor users is open to any member', async () => {
    const chain = await getTimesheetChain(
      ctxWith({ [SETTING_KEYS.timesheetApproval]: [{ name: 'Anyone' }] }),
      'g'
    );

    expect(chain).toEqual([
      { id: 'stage-0', name: 'Anyone', roleIds: [], userIds: [] },
    ]);
  });

  test('non-string entries inside roleIds/userIds are discarded', async () => {
    const chain = await getTimesheetChain(
      ctxWith({
        [SETTING_KEYS.timesheetApproval]: [
          { name: 'PM', roleIds: ['r1', 7, null], userIds: 'u1' },
        ],
      }),
      'g'
    );

    expect(chain[0].roleIds).toEqual(['r1']);
    expect(chain[0].userIds).toEqual([]);
  });

  test('a chain that is not an array reads as off', async () => {
    expect(
      await getTimesheetChain(
        ctxWith({ [SETTING_KEYS.timesheetApproval]: 'Foreman,PM' }),
        'g'
      )
    ).toEqual([]);
  });
});

describe('getRefPrefix', () => {
  test('returns the trimmed prefix', async () => {
    expect(
      await getRefPrefix(ctxWith({ [SETTING_KEYS.refPrefix]: ' 861 ' }), 'g')
    ).toBe('861');
  });

  test('blank and non-string prefixes are undefined, not empty refs', async () => {
    // formatRef renders `861-TS-001` with a prefix and `TS-001` without; an
    // empty string would give `-TS-001`.
    expect(await getRefPrefix(ctxWith({}), 'g')).toBeUndefined();
    expect(
      await getRefPrefix(ctxWith({ [SETTING_KEYS.refPrefix]: '   ' }), 'g')
    ).toBeUndefined();
    expect(
      await getRefPrefix(ctxWith({ [SETTING_KEYS.refPrefix]: 861 }), 'g')
    ).toBeUndefined();
  });
});
