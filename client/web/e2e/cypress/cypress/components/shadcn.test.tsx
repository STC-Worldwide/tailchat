import React from 'react';
import { mount } from '@cypress/react';
import { Button } from '../../../../src/plugin/component/modern-controls';
import { TestWrapper } from './utils/TestWrapper';

describe('shadcn dark', () => {
  it('renders Tailchat button variants without legacy Ant Design classes', () => {
    mount(
      <TestWrapper>
        <Button data-testid="default">默认</Button>
        <Button type="primary" data-testid="primary">
          主色
        </Button>
        <Button danger={true} type="primary" data-testid="primary-danger">
          主危险
        </Button>
      </TestWrapper>
    );

    cy.get('[data-testid=default]')
      .should('have.attr', 'data-slot', 'button')
      .should('not.have.class', 'ant-btn')
      .matchImageSnapshot('shadcn-default');

    cy.get('[data-testid=primary]')
      .should('have.class', 'bg-primary')
      .should('not.have.class', 'ant-btn-primary')
      .matchImageSnapshot('shadcn-primary');

    cy.get('[data-testid=primary-danger]')
      .should('have.class', 'bg-destructive')
      .should('not.have.class', 'ant-btn-dangerous')
      .matchImageSnapshot('shadcn-primary-danger');
  });
});
