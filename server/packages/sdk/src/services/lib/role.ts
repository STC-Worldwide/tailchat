export const PERMISSION = {
  /**
   * 非插件的权限点都叫core
   */
  core: {
    owner: '__group_owner__', // 保留字段, 用于标识群组所有者
    /**
     * 查看面板。客户端一直有这个权限点, 服务端以前没有 —— 也就是说它以前只管
     * 界面上藏不藏, 接口从不校验。见 chat.message 的 checkConversePermission。
     */
    viewPanel: 'core.viewPanel',
    message: 'core.message',
    invite: 'core.invite',
    unlimitedInvite: 'core.unlimitedInvite',
    editInvite: 'core.editInvite', // 编辑邀请码权限，需要有创建无限制邀请码的权限
    groupDetail: 'core.groupDetail',
    groupBaseInfo: 'core.groupBaseInfo',
    groupConfig: 'core.groupConfig',
    manageUser: 'core.manageUser',
    managePanel: 'core.managePanel',
    manageInvite: 'core.manageInvite',
    manageRoles: 'core.manageRoles',
    deleteMessage: 'core.deleteMessage',
  },
};

export const allPermission = [...Object.values(PERMISSION.core)];
