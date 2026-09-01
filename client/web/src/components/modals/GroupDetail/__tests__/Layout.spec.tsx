import { render, screen } from '@testing-library/react';
import React from 'react';
import { Button } from '@/components/ui/official/button';
import {
  GroupDetailFieldGroup,
  GroupDetailPage,
  GroupDetailRow,
  GroupDetailSection,
} from '../Layout';

describe('group detail layout primitives', () => {
  test('builds a labelled page and section hierarchy', () => {
    render(
      <GroupDetailPage title="Group profile" description="Manage this group">
        <GroupDetailSection
          title="Member privacy"
          description="Privacy controls"
        >
          <div>Content</div>
        </GroupDetailSection>
      </GroupDetailPage>
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Group profile' })
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Member privacy' })
    ).toBeTruthy();
    expect(screen.getByText('Manage this group')).toBeTruthy();
  });

  test('uses the official responsive field composition for group controls', () => {
    const { container } = render(
      <GroupDetailFieldGroup>
        <GroupDetailRow title="Private messages" description="Control access">
          <Button>Change</Button>
        </GroupDetailRow>
      </GroupDetailFieldGroup>
    );

    const field = container.querySelector('[data-slot="field"]');
    expect(field?.getAttribute('data-orientation')).toBe('responsive');
    expect(
      screen.getByRole('button', { name: 'Change' }).getAttribute('data-slot')
    ).toBe('button');
  });
});
