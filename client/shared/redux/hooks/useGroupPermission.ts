import { useGroupInfo } from './useGroup';
import { useUserId } from './useUserInfo';
import _uniq from 'lodash/uniq';
import { useDebugValue, useMemo } from 'react';
import {
  getGroupMemberPermissions,
  getPanelMemberPermissions,
} from '../../utils/member-permission-helper';

/**
 * 获取群组用户的所有权限
 */
export function useGroupMemberAllPermissions(groupId: string): string[] {
  const groupInfo = useGroupInfo(groupId);
  const userId = useUserId();

  const userPermissions = useMemo(
    () => getGroupMemberPermissions(groupInfo, userId ?? ''),
    [groupInfo, userId]
  );

  useDebugValue({ groupId, userId, userPermissions });

  return userPermissions;
}

/**
 * 获取面板的所有权限
 * 不包含群组本身的权限
 */
export function useGroupPanelMemberAllPermissions(
  groupId: string,
  panelId: string
): string[] {
  const groupInfo = useGroupInfo(groupId);
  const userId = useUserId();

  return useMemo(() => {
    const panelInfo = groupInfo?.panels.find((p) => p.id === panelId);

    return getPanelMemberPermissions(groupInfo, panelInfo, userId ?? '');
  }, [groupInfo, panelId, userId]);
}

/**
 * 判断用户是否拥有以下权限
 */
export function useHasGroupPermission(
  groupId: string,
  permissions: string[]
): boolean[] {
  const userPermissions = useGroupMemberAllPermissions(groupId);

  const result = useMemo(
    () => permissions.map((p) => userPermissions.includes(p)),
    [userPermissions.join(','), permissions.join(',')]
  );

  useDebugValue({
    groupId,
    userPermissions,
    checkedPermissions: permissions,
    result,
  });

  return result;
}

/**
 * 判断用户是否在某个面板下拥有以下权限
 * 用于面板权限控制
 */
export function useHasGroupPanelPermission(
  groupId: string,
  panelId: string,
  permissions: string[]
) {
  const groupPermissions = useGroupMemberAllPermissions(groupId);
  const panelPermissions = useGroupPanelMemberAllPermissions(groupId, panelId);

  const fullPermissions = _uniq([...groupPermissions, ...panelPermissions]);

  const result = useMemo(
    () => permissions.map((p) => fullPermissions.includes(p)),
    [fullPermissions.join(','), permissions.join(',')]
  );

  useDebugValue({
    groupId,
    panelId,
    fullPermissions,
    checkedPermissions: permissions,
    result,
  });

  return result;
}
