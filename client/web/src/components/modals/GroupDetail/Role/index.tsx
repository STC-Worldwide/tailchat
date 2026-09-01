import { Loading } from '@/components/Loading';
import { ALL_PERMISSION } from 'tailchat-shared';
import React, { useEffect, useMemo, useState } from 'react';
import { t, useGroupInfo } from 'tailchat-shared';
import { RoleItem } from './RoleItem';
import { useRoleActions } from './useRoleActions';
import { RoleSummary } from './tabs/summary';
import { RolePermission } from './tabs/permission';
import { RoleMember } from './tabs/member';
import { Separator } from '@/components/ui/official/separator';
import { GroupDetailPage } from '../Layout';
import { PlusIcon, ShieldCheckIcon } from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/official/tabs';

interface GroupPermissionProps {
  groupId: string;
}
export const GroupRole: React.FC<GroupPermissionProps> = React.memo((props) => {
  const { groupId } = props;
  const [roleId, setRoleId] = useState<typeof ALL_PERMISSION | string>(
    ALL_PERMISSION
  );
  const [activeTab, setActiveTab] = useState('permission');
  const groupInfo = useGroupInfo(groupId);
  const roles = groupInfo?.roles ?? [];

  const currentRoleInfo = useMemo(
    () => roles.find((r) => r._id === roleId),
    [roles, roleId]
  );

  const {
    loading,
    handleCreateRole,
    handleSavePermission,
    handleChangeRoleName,
    handleDeleteRole,
  } = useRoleActions(groupId, roleId);

  useEffect(() => {
    if (roleId === ALL_PERMISSION && activeTab !== 'permission') {
      setActiveTab('permission');
    }
  }, [activeTab, roleId]);

  return (
    <Loading spinning={loading} className="h-full">
      <GroupDetailPage
        title={t('身份组')}
        description={t('定义群组角色，并控制每个角色的权限和成员。')}
      >
        <div className="grid min-h-[30rem] gap-6 md:grid-cols-[11rem_minmax(0,1fr)]">
          <aside className="min-w-0 border-border md:border-r md:pr-4">
            <nav
              aria-label={t('身份组')}
              className="flex gap-1 overflow-x-auto pb-2 md:flex-col md:overflow-visible md:pb-0"
            >
              {/* 角色列表 */}
              <RoleItem
                active={roleId === ALL_PERMISSION}
                className="max-md:w-auto max-md:shrink-0"
                onClick={() => setRoleId(ALL_PERMISSION)}
              >
                <ShieldCheckIcon />
                {t('所有人')}
              </RoleItem>

              {roles.map((r) => (
                <RoleItem
                  key={r._id}
                  active={roleId === r._id}
                  className="max-md:w-auto max-md:shrink-0"
                  onClick={() => setRoleId(r._id)}
                >
                  {r.name}
                </RoleItem>
              ))}

              <Separator className="my-3 max-md:hidden" />

              <RoleItem
                active={false}
                className="max-md:w-auto max-md:shrink-0"
                onClick={handleCreateRole}
              >
                <PlusIcon />
                {t('添加角色')}
              </RoleItem>
            </nav>
          </aside>

          <div className="min-w-0 overflow-y-auto">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="min-h-0 min-w-0 w-full gap-0"
            >
              <TabsList
                variant="line"
                className="h-auto w-full max-w-full shrink-0 justify-start overflow-x-auto overflow-y-hidden rounded-none border-b border-border px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                <TabsTrigger
                  value="summary"
                  disabled={roleId === ALL_PERMISSION}
                  className="h-8 flex-none px-3"
                >
                  {t('概述')}
                </TabsTrigger>
                <TabsTrigger value="permission" className="h-8 flex-none px-3">
                  {t('权限')}
                </TabsTrigger>
                <TabsTrigger
                  value="member"
                  disabled={roleId === ALL_PERMISSION}
                  className="h-8 flex-none px-3"
                >
                  {t('管理成员')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="min-h-0 flex-1">
                {currentRoleInfo && (
                  <RoleSummary
                    currentRoleInfo={currentRoleInfo}
                    onChangeRoleName={handleChangeRoleName}
                    onDeleteRole={async () => {
                      await handleDeleteRole();
                      setRoleId(ALL_PERMISSION); // 删除身份组后切换到所有人
                    }}
                  />
                )}
              </TabsContent>

              <TabsContent value="permission" className="min-h-0 flex-1">
                <RolePermission
                  roleId={roleId}
                  fallbackPermissions={groupInfo?.fallbackPermissions ?? []}
                  currentRoleInfo={currentRoleInfo}
                  onSavePermission={handleSavePermission}
                />
              </TabsContent>

              <TabsContent value="member" className="min-h-0 flex-1">
                {currentRoleInfo && (
                  <RoleMember
                    groupId={groupId}
                    currentRoleInfo={currentRoleInfo}
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </GroupDetailPage>
    </Loading>
  );
});
GroupRole.displayName = 'GroupRole';
