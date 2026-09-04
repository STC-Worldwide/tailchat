import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

/**
 * The Project Ops group settings, rendered the way Tailchat renders them.
 *
 * These two fields are the only way to turn the timesheet approval chain on,
 * so "does the registration produce a component that saves the right shape"
 * is the assertion that matters — the server reads exactly what is saved here.
 */
const mockOpenModal = jest.fn();
const mockCloseModal = jest.fn();

jest.mock('@capital/common', () => ({
  localTrans: (translations: Record<'zh-CN' | 'en-US', string>) =>
    translations['en-US'],
  useGroupInfo: () => ({
    roles: [{ _id: 'role-1', name: 'Foreman' }],
    members: [{ userId: 'user-1', roles: [] }],
  }),
}));

jest.mock('@capital/component', () => {
  const react = require('react');

  return {
    Button: (props: any) =>
      react.createElement(
        'button',
        { onClick: props.onClick, disabled: props.disabled },
        props.children
      ),
    Checkbox: (props: any) =>
      react.createElement(
        'label',
        null,
        react.createElement('input', {
          type: 'checkbox',
          checked: Boolean(props.checked),
          onChange: props.onChange,
          readOnly: true,
        }),
        props.children
      ),
    Input: (props: any) =>
      react.createElement('input', {
        value: props.value,
        placeholder: props.placeholder,
        onChange: props.onChange,
      }),
    ModalWrapper: (props: any) =>
      react.createElement('div', null, props.children),
    UserName: (props: any) => react.createElement('span', null, props.userId),
    openModal: (element: any) => mockOpenModal(element),
    closeModal: (key: any) => mockCloseModal(key),
  };
});

// The fields are imported directly rather than through the plugin entry: the
// entry also registers panels through `Loadable`, which cannot be typechecked
// outside the plugin bundle's own untyped `@capital/*` modules.
import {
  ApprovalChainField,
  RefPrefixField,
  SETTING_KEYS,
  SETTING_NAMES,
} from '../../../../../../server/plugins/com.stcworldwide.projectops/web/plugins/com.stcworldwide.projectops/src/Settings';

describe('Project Ops group settings', () => {
  test('the stored keys are the ones the server reads', () => {
    // utils/settings.ts on the server reads exactly these strings. Tailchat
    // adds the `plugin:` prefix on save, so the registered name is the rest.
    expect(SETTING_KEYS.refPrefix).toBe(
      'plugin:com.stcworldwide.projectops:refPrefix'
    );
    expect(SETTING_KEYS.timesheetApproval).toBe(
      'plugin:com.stcworldwide.projectops:timesheetApproval'
    );
    expect(SETTING_KEYS.refPrefix).toBe(`plugin:${SETTING_NAMES.refPrefix}`);
  });

  describe('reference prefix', () => {
    const registration = () => ({ component: RefPrefixField });

    test('previews the ref the prefix will produce', () => {
      const Field = registration().component;
      render(
        <Field value="861" onChange={jest.fn()} loading={false} groupId="g" />
      );

      expect(screen.getByText('861-TS-061')).not.toBeNull();
    });

    test('saves trimmed, and only once something changed', () => {
      const onChange = jest.fn();
      const Field = registration().component;
      render(
        <Field value="861" onChange={onChange} loading={false} groupId="g" />
      );

      // Unchanged: the save button is disabled, so no request goes out.
      const save = screen.getByText('Save') as HTMLButtonElement;
      expect(save.disabled).toBe(true);

      fireEvent.change(screen.getByPlaceholderText('e.g. 861'), {
        target: { value: '  902  ' },
      });
      fireEvent.click(screen.getByText('Save'));

      expect(onChange).toHaveBeenCalledWith('902');
    });
  });

  describe('approval chain', () => {
    const registration = () => ({ component: ApprovalChainField });

    beforeEach(() => {
      mockOpenModal.mockReset();
      mockCloseModal.mockReset();
    });

    test('an unset chain reads as approval being off', () => {
      const Field = registration().component;
      render(
        <Field
          value={undefined}
          onChange={jest.fn()}
          loading={false}
          groupId="g"
        />
      );

      expect(
        screen.getByText('No approval — submitting finalises the entry')
      ).not.toBeNull();
    });

    test('a configured chain is summarised in stage order', () => {
      const Field = registration().component;
      render(
        <Field
          value={[
            { id: 'a', name: 'Foreman', roleIds: [], userIds: [] },
            { id: 'b', name: 'PM', roleIds: [], userIds: [] },
          ]}
          onChange={jest.fn()}
          loading={false}
          groupId="g"
        />
      );

      expect(screen.getByText('Foreman → PM')).not.toBeNull();
    });

    test('the editor saves named stages with their approvers', () => {
      const onChange = jest.fn();
      const Field = registration().component;
      render(
        <Field value={[]} onChange={onChange} loading={false} groupId="g" />
      );

      fireEvent.click(screen.getByText('Edit'));
      const editor = mockOpenModal.mock.calls[0][0];
      render(editor);

      fireEvent.click(screen.getByText('Add stage'));
      fireEvent.change(
        screen.getByPlaceholderText('Stage name, e.g. Foreman'),
        { target: { value: '  Foreman  ' } }
      );

      // Tick the group's only role, so the stage is not open to everyone.
      fireEvent.click(screen.getAllByRole('checkbox')[0]);
      fireEvent.click(screen.getByText('Save'));

      expect(onChange).toHaveBeenCalledWith([
        expect.objectContaining({
          name: 'Foreman',
          roleIds: ['role-1'],
          userIds: [],
        }),
      ]);
    });

    test('a stage with no name cannot be saved', () => {
      const Field = registration().component;
      render(
        <Field value={[]} onChange={jest.fn()} loading={false} groupId="g" />
      );

      fireEvent.click(screen.getByText('Edit'));
      render(mockOpenModal.mock.calls[0][0]);
      fireEvent.click(screen.getByText('Add stage'));

      // The server drops nameless stages, so saving one would silently lose it.
      const save = screen.getByText(
        'Every stage needs a name'
      ) as HTMLButtonElement;
      expect(save.disabled).toBe(true);
    });
  });
});
