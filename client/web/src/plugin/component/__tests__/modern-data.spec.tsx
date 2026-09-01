import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { Menu, Table } from '../modern-data';

describe('modern plugin menu and table compatibility controls', () => {
  test('renders item-based menus with selection and nested key paths', () => {
    const handleClick = jest.fn();
    const handleSelect = jest.fn();
    render(
      <Menu
        defaultOpenKeys={['tools']}
        onClick={handleClick}
        onSelect={handleSelect}
        items={[
          { key: 'overview', label: 'Overview' },
          {
            key: 'tools',
            label: 'Tools',
            children: [{ key: 'integrations', label: 'Integrations' }],
          },
          { key: 'disabled', label: 'Unavailable', disabled: true },
        ]}
      />
    );

    const integrations = screen.getByRole('menuitem', {
      name: 'Integrations',
    });
    fireEvent.click(integrations);

    expect(integrations.getAttribute('aria-current')).toBe('page');
    expect(handleClick).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'integrations',
        keyPath: ['integrations', 'tools'],
      })
    );
    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(
      screen
        .getByRole('menuitem', { name: 'Unavailable' })
        .hasAttribute('disabled')
    ).toBe(true);
  });

  test('supports legacy compound Menu children', () => {
    render(
      <Menu defaultOpenKeys={['manage']}>
        <Menu.Item key="home">Home</Menu.Item>
        <Menu.SubMenu key="manage" title="Manage">
          <Menu.Item key="members">Members</Menu.Item>
        </Menu.SubMenu>
        <Menu.Divider />
        <Menu.ItemGroup title="Account">
          <Menu.Item key="profile">Profile</Menu.Item>
        </Menu.ItemGroup>
      </Menu>
    );

    expect(screen.getByRole('menuitem', { name: 'Home' })).not.toBeNull();
    expect(screen.getByRole('menuitem', { name: 'Members' })).not.toBeNull();
    expect(screen.getByRole('menuitem', { name: 'Profile' })).not.toBeNull();
    expect(screen.getByRole('separator')).not.toBeNull();
  });

  test('provides roving menu focus, submenu keys, and collapsed labels', async () => {
    const { rerender } = render(
      <Menu
        items={[
          { key: 'overview', label: 'Overview' },
          {
            key: 'tools',
            label: 'Tools',
            children: [{ key: 'integrations', label: 'Integrations' }],
          },
        ]}
      />
    );

    const overview = screen.getByRole('menuitem', { name: 'Overview' });
    const tools = screen.getByRole('menuitem', { name: 'Tools' });
    expect(overview.getAttribute('tabindex')).toBe('0');
    expect(tools.getAttribute('tabindex')).toBe('-1');

    overview.focus();
    fireEvent.keyDown(overview, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(tools);

    fireEvent.keyDown(tools, { key: 'ArrowRight' });
    await waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByRole('menuitem', { name: 'Integrations' })
      )
    );

    rerender(
      <Menu
        inlineCollapsed={true}
        items={[{ key: 'overview', label: 'Overview', icon: <span /> }]}
      />
    );
    expect(screen.getByRole('menuitem', { name: 'Overview' })).not.toBeNull();
  });

  test('renders real plugin column and data contracts with official table slots', () => {
    const handleEnter = jest.fn();
    const records = [
      { _id: 'app-1', appName: 'Calendar' },
      { _id: 'app-2', appName: 'Webhook relay' },
    ];
    render(
      <Table
        rowKey="_id"
        pagination={false}
        dataSource={records}
        columns={[
          { title: 'Name', dataIndex: 'appName' },
          {
            title: 'Operation',
            key: 'action',
            render: (_, record) => (
              <button type="button" onClick={() => handleEnter(record._id)}>
                Enter {record.appName}
              </button>
            ),
          },
        ]}
      />
    );

    expect(document.querySelector('[data-slot="table"]')).not.toBeNull();
    expect(screen.getByText('Calendar')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Enter Calendar' }));
    expect(handleEnter).toHaveBeenCalledWith('app-1');
  });

  test('provides selection and pagination without losing row callbacks', () => {
    const handleSelection = jest.fn();
    const handlePage = jest.fn();
    const records = [
      { id: 1, name: 'Alpha' },
      { id: 2, name: 'Beta' },
      { id: 3, name: 'Gamma' },
    ];
    render(
      <Table
        rowKey="id"
        dataSource={records}
        columns={[{ title: 'Name', dataIndex: 'name' }]}
        rowSelection={{ onChange: handleSelection }}
        pagination={{ pageSize: 2, onChange: handlePage }}
      />
    );

    const firstRow = screen.getByText('Alpha').closest('tr');
    fireEvent.click(
      within(firstRow as HTMLElement).getByRole('checkbox', {
        name: 'Select row 1',
      })
    );
    expect(handleSelection).toHaveBeenCalledWith([1], [records[0]]);

    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(handlePage).toHaveBeenCalledWith(2, 2);
    expect(screen.getByText('Gamma')).not.toBeNull();
    expect(screen.queryByText('Alpha')).toBeNull();
  });

  test('uses radio semantics without allowing the selected row to toggle off', () => {
    const handleSelection = jest.fn();
    const records = [
      { id: 1, name: 'Alpha' },
      { id: 2, name: 'Beta' },
    ];
    render(
      <Table
        rowKey="id"
        pagination={false}
        dataSource={records}
        columns={[{ title: 'Name', dataIndex: 'name' }]}
        rowSelection={{ type: 'radio', onChange: handleSelection }}
      />
    );

    const radios = screen.getAllByRole('radio');
    expect(screen.queryByRole('checkbox')).toBeNull();
    fireEvent.click(radios[0]);
    fireEvent.click(radios[1]);
    fireEvent.click(radios[1]);

    expect(radios[1].getAttribute('aria-checked')).toBe('true');
    expect(handleSelection).toHaveBeenLastCalledWith([2], [records[1]]);
  });

  test('applies vertical scrolling to the table scroll container', () => {
    render(
      <Table
        pagination={false}
        scroll={{ y: 120 }}
        dataSource={[{ id: 1, name: 'Alpha' }]}
        columns={[{ title: 'Name', dataIndex: 'name' }]}
      />
    );

    const scroller = document.querySelector(
      '[data-slot="plugin-table-scroll"]'
    ) as HTMLElement;
    expect(scroller.style.maxHeight).toBe('120px');
    expect(scroller.className).toContain('overflow-y-auto');
  });

  test('renders modern loading and empty table states', () => {
    const { rerender } = render(
      <Table
        loading={true}
        pagination={false}
        columns={[{ title: 'Name', dataIndex: 'name' }]}
        dataSource={[]}
      />
    );

    expect(document.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(3);

    rerender(
      <Table
        pagination={false}
        locale={{ emptyText: 'No subscriptions yet' }}
        columns={[{ title: 'Name', dataIndex: 'name' }]}
        dataSource={[]}
      />
    );
    expect(screen.getByText('No subscriptions yet')).not.toBeNull();
    expect(document.querySelector('[data-slot="empty"]')).not.toBeNull();
  });
});
