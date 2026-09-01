import React from 'react';
import {
  ExternalLinkIcon,
  LayoutDashboardIcon,
  MailIcon,
  PlusIcon,
  SearchIcon,
  Settings2Icon,
  WorkflowIcon,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/official/card';
import { Label } from '@/components/ui/official/label';
import {
  Button,
  Divider,
  Input,
  Space,
  Switch,
  TextArea,
} from './modern-controls';
import {
  Checkbox,
  Empty,
  Popover,
  Skeleton,
  Tag,
  Tooltip,
} from './modern-display';
import { notification, Popconfirm } from './modern-feedback';
import { Menu, Table } from './modern-data';

const GalleryPluginAvatar: React.FC = () => (
  <button
    type="button"
    className="inline-flex size-8 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary"
  >
    PL
    <span className="sr-only">Plugin avatar</span>
  </button>
);

export const PluginControlsPreview: React.FC = React.memo(() => {
  const [notifications, setNotifications] = React.useState(true);
  const [activeArea, setActiveArea] = React.useState('overview');

  return (
    <main className="h-full overflow-y-auto bg-background p-4 text-foreground sm:p-8">
      <Card className="mx-auto w-full max-w-4xl">
        <CardHeader className="border-b">
          <CardTitle className="text-xl sm:text-2xl">
            Plugin control gallery
          </CardTitle>
          <CardDescription>
            Official shadcn/ui primitives behind Tailchat's public plugin API.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 py-1">
          <section aria-labelledby="preview-buttons">
            <h2 id="preview-buttons" className="mb-3 text-sm font-semibold">
              Buttons
            </h2>
            <Space size="middle" wrap={true} className="w-full">
              <Button>Default</Button>
              <Button type="primary">Primary</Button>
              <Button type="dashed">Dashed</Button>
              <Button type="text">Text</Button>
              <Button danger={true}>Delete</Button>
              <Button loading={true}>Loading</Button>
              <Button
                shape="circle"
                icon={<PlusIcon />}
                aria-label="Add item"
              />
              <Button
                type="link"
                href="https://ui.shadcn.com"
                icon={<ExternalLinkIcon />}
              >
                Shadcn docs
              </Button>
            </Space>
          </section>

          <Divider />

          <section aria-labelledby="preview-inputs" className="space-y-4">
            <h2 id="preview-inputs" className="text-sm font-semibold">
              Inputs
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="gallery-search">Search with clear</Label>
                <Input
                  id="gallery-search"
                  prefix={<SearchIcon className="size-4" />}
                  allowClear={true}
                  defaultValue="Calendar integration"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gallery-domain">Input addons</Label>
                <Input
                  id="gallery-domain"
                  addonBefore="https://"
                  addonAfter=".com"
                  defaultValue="tailchat"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="gallery-warning">Warning state</Label>
                <Input
                  id="gallery-warning"
                  status="warning"
                  prefix={<MailIcon className="size-4" />}
                  defaultValue="Check this address before saving"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="gallery-message">Counted textarea</Label>
                <TextArea
                  id="gallery-message"
                  status="warning"
                  showCount={true}
                  maxLength={160}
                  rows={4}
                  defaultValue="A modern plugin surface that follows the same visual language as the rest of Tailchat."
                />
              </div>
            </div>
          </section>

          <Divider />

          <section aria-labelledby="preview-switches" className="space-y-4">
            <h2 id="preview-switches" className="text-sm font-semibold">
              Switches and spacing
            </h2>
            <Space size="large" wrap={true} align="center" className="w-full">
              <Switch
                aria-label="Notifications"
                checked={notifications}
                onChange={setNotifications}
                checkedChildren="Notifications on"
                unCheckedChildren="Notifications off"
              />
              <Divider type="vertical" />
              <Switch
                aria-label="Automatic updates"
                defaultChecked={false}
                checkedChildren="Auto-update on"
                unCheckedChildren="Auto-update off"
              />
              <Divider type="vertical" />
              <Switch
                aria-label="Checking status"
                loading={true}
                defaultChecked={true}
              />
            </Space>
          </section>

          <Divider />

          <section
            aria-labelledby="preview-plugin-display"
            className="space-y-4"
          >
            <h2 id="preview-plugin-display" className="text-sm font-semibold">
              Plugin feedback and overlays
            </h2>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-4">
                <Space size="large" wrap={true} align="center">
                  <Checkbox defaultChecked={true}>Task complete</Checkbox>
                  <Checkbox indeterminate={true}>Partially selected</Checkbox>
                </Space>
                <Space size="middle" wrap={true} align="center">
                  <Tag color="green">Connected</Tag>
                  <Tag color="red">Action failed</Tag>
                  <Tag color="gold" closable={true}>
                    Review needed
                  </Tag>
                </Space>
                <Space size="middle" wrap={true}>
                  <Tooltip title="Official Shadcn tooltip" placement="topLeft">
                    <GalleryPluginAvatar />
                  </Tooltip>
                  <Popover
                    title="Plugin details"
                    content="Extension actions now inherit Tailchat's modern component language."
                    placement="bottomLeft"
                    trigger="click"
                  >
                    <Button type="primary">Open popover</Button>
                  </Popover>
                  <Popconfirm
                    title="Remove this integration?"
                    description="Messages already delivered by it will stay in the conversation."
                    okText="Remove"
                  >
                    <Button danger={true}>Confirm action</Button>
                  </Popconfirm>
                  <Button
                    onClick={() =>
                      notification.open({
                        key: 'gallery-invite',
                        message: 'Video meeting invitation',
                        description:
                          'Taylor invited you to join the product sync.',
                        duration: 0,
                        onClick: () => undefined,
                        btn: <Button size="small">Join now</Button>,
                      })
                    }
                  >
                    Show notification
                  </Button>
                </Space>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-1">
                <Skeleton
                  active={true}
                  avatar={{ size: 40 }}
                  paragraph={{ rows: 2 }}
                />
                <Empty
                  description="No plugin activity yet"
                  className="min-h-28 border border-dashed"
                >
                  <Button size="small">Refresh</Button>
                </Empty>
              </div>
            </div>
          </section>

          <Divider />

          <section aria-labelledby="preview-data" className="space-y-4">
            <h2 id="preview-data" className="text-sm font-semibold">
              Navigation and data
            </h2>
            <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
              <div className="space-y-2">
                <Menu
                  defaultOpenKeys={['workflows']}
                  selectedKeys={[activeArea]}
                  onClick={({ key }) => setActiveArea(key)}
                  className="border bg-muted/20"
                  items={[
                    {
                      key: 'overview',
                      label: 'Overview',
                      icon: <LayoutDashboardIcon />,
                    },
                    {
                      key: 'workflows',
                      label: 'Workflows',
                      icon: <WorkflowIcon />,
                      children: [
                        { key: 'automations', label: 'Automations' },
                        { key: 'webhooks', label: 'Webhooks' },
                      ],
                    },
                    {
                      key: 'settings',
                      label: 'Settings',
                      icon: <Settings2Icon />,
                    },
                  ]}
                />
                <p className="px-2 text-xs text-muted-foreground">
                  Selected: {activeArea}
                </p>
              </div>
              <Table
                rowKey="id"
                bordered={true}
                size="small"
                pagination={false}
                scroll={{ x: 520 }}
                dataSource={[
                  {
                    id: 'calendar',
                    name: 'Calendar sync',
                    owner: 'Product team',
                    status: 'Connected',
                  },
                  {
                    id: 'relay',
                    name: 'Webhook relay',
                    owner: 'Platform team',
                    status: 'Review',
                  },
                  {
                    id: 'archive',
                    name: 'Message archive',
                    owner: 'Operations',
                    status: 'Paused',
                  },
                ]}
                columns={[
                  { title: 'Integration', dataIndex: 'name', width: 180 },
                  { title: 'Owner', dataIndex: 'owner', width: 150 },
                  {
                    title: 'Status',
                    dataIndex: 'status',
                    width: 110,
                    render: (value) => (
                      <Tag
                        color={
                          value === 'Connected'
                            ? 'green'
                            : value === 'Review'
                            ? 'gold'
                            : undefined
                        }
                      >
                        {String(value)}
                      </Tag>
                    ),
                  },
                  {
                    title: 'Action',
                    key: 'action',
                    align: 'right',
                    width: 90,
                    render: () => <Button size="small">Open</Button>,
                  },
                ]}
              />
            </div>
          </section>
        </CardContent>
      </Card>
    </main>
  );
});
PluginControlsPreview.displayName = 'PluginControlsPreview';

export default PluginControlsPreview;
