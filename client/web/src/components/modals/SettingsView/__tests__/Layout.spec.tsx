import { render, screen } from '@testing-library/react';
import React from 'react';
import { Button } from '@/components/ui/official/button';
import {
  SettingsFieldGroup,
  SettingsPage,
  SettingsRow,
  SettingsSection,
} from '../Layout';

describe('settings layout primitives', () => {
  test('builds a labelled page and section hierarchy', () => {
    render(
      <SettingsPage title="Account" description="Manage your profile">
        <SettingsSection title="Security" description="Protect your account">
          <div>Settings content</div>
        </SettingsSection>
      </SettingsPage>
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Account' })
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Security' })
    ).toBeTruthy();
    expect(screen.getByText('Manage your profile')).toBeTruthy();
  });

  test('uses the official responsive field composition for setting rows', () => {
    const { container } = render(
      <SettingsFieldGroup>
        <SettingsRow title="Password" description="Update your password">
          <Button>Change</Button>
        </SettingsRow>
      </SettingsFieldGroup>
    );

    const fieldGroup = container.querySelector('[data-slot="field-group"]');
    const field = container.querySelector('[data-slot="field"]');

    expect(fieldGroup).toBeTruthy();
    expect(field?.getAttribute('data-orientation')).toBe('responsive');
    expect(
      screen.getByRole('button', { name: 'Change' }).getAttribute('data-slot')
    ).toBe('button');
  });
});
