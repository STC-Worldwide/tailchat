import { localTrans } from '@capital/common';

export const Translate = {
  openapi: localTrans({ 'zh-CN': '开放平台', 'en-US': 'Open Api' }),
  noservice: localTrans({
    'zh-CN': '管理员没有开放 Openapi 服务',
    'en-US': 'The administrator did not open the Openapi service',
  }),
  enableBotCapability: localTrans({
    'zh-CN': '开启机器人能力',
    'en-US': 'Enable Bot Capability',
  }),
  name: localTrans({
    'zh-CN': '名称',
    'en-US': 'Name',
  }),
  operation: localTrans({
    'zh-CN': '操作',
    'en-US': 'Operation',
  }),
  delete: localTrans({
    'zh-CN': '删除',
    'en-US': 'Delete',
  }),
  enter: localTrans({
    'zh-CN': '进入',
    'en-US': 'Enter',
  }),
  createApplication: localTrans({
    'zh-CN': '创建应用',
    'en-US': 'Create Application',
  }),
  manageApplications: localTrans({
    'zh-CN': '创建并管理接入 Tailchat 的应用与能力。',
    'en-US':
      'Create and manage applications and capabilities connected to Tailchat.',
  }),
  noApplications: localTrans({
    'zh-CN': '暂无应用',
    'en-US': 'No applications yet',
  }),
  backToApplications: localTrans({
    'zh-CN': '返回应用列表',
    'en-US': 'Back to applications',
  }),
  dangerZone: localTrans({
    'zh-CN': '危险操作',
    'en-US': 'Danger zone',
  }),
  deleteApplicationHint: localTrans({
    'zh-CN': '永久删除此应用及其开放平台配置。',
    'en-US':
      'Permanently delete this application and its OpenAPI configuration.',
  }),
  createApplicationSuccess: localTrans({
    'zh-CN': '创建应用成功',
    'en-US': 'Create Application Success',
  }),
  appNameCannotBeEmpty: localTrans({
    'zh-CN': '应用名不能为空',
    'en-US': 'App Name Cannot be Empty',
  }),
  appNameTooLong: localTrans({
    'zh-CN': '应用名过长',
    'en-US': 'App Name too Long',
  }),
  app: {
    basicInfo: localTrans({
      'zh-CN': '基础信息',
      'en-US': 'Basic Info',
    }),
    appName: localTrans({
      'zh-CN': '应用名称',
      'en-US': 'App Name',
    }),
    appDesc: localTrans({
      'zh-CN': '应用描述',
      'en-US': 'App Description',
    }),
    bot: localTrans({
      'zh-CN': '机器人',
      'en-US': 'Bot',
    }),
    webpage: localTrans({
      'zh-CN': '网页',
      'en-US': 'Web Page',
    }),
    oauth: localTrans({
      'zh-CN': '第三方登录',
      'en-US': 'OAuth',
    }),
    appcret: localTrans({
      'zh-CN': '应用凭证',
      'en-US': 'Application Credentials',
    }),
    apiKeys: localTrans({
      'zh-CN': 'API 密钥',
      'en-US': 'API keys',
    }),
  },
  apiKeys: {
    intro: localTrans({
      'zh-CN':
        'API 密钥以本应用的机器人身份调用接口，权限范围由所选作用域限制。密钥只在创建时显示一次。',
      'en-US':
        "API keys call the API as this app's bot user, limited to the selected scopes. A key is shown once, when it is created.",
    }),
    needBot: localTrans({
      'zh-CN': '请先在“机器人”页开启机器人能力。',
      'en-US': 'Enable the bot capability on the Bot page first.',
    }),
    create: localTrans({
      'zh-CN': '创建密钥',
      'en-US': 'Create key',
    }),
    keyName: localTrans({
      'zh-CN': '名称',
      'en-US': 'Name',
    }),
    keyNamePlaceholder: localTrans({
      'zh-CN': '例如: ops agent',
      'en-US': 'e.g. ops agent',
    }),
    scopes: localTrans({
      'zh-CN': '作用域',
      'en-US': 'Scopes',
    }),
    expiresInDays: localTrans({
      'zh-CN': '有效期(天, 留空为永不过期)',
      'en-US': 'Expires in days (blank = never)',
    }),
    adminNeedsCapability: localTrans({
      'zh-CN': '需要服务器管理员为本应用开通 admin 能力',
      'en-US':
        'Requires the admin capability, granted by a server administrator',
    }),
    nameRequired: localTrans({
      'zh-CN': '请输入名称',
      'en-US': 'Name is required',
    }),
    scopeRequired: localTrans({
      'zh-CN': '请至少选择一个作用域',
      'en-US': 'Select at least one scope',
    }),
    created: localTrans({
      'zh-CN': '密钥已创建，请立即复制，关闭后无法再次查看。',
      'en-US':
        'Key created. Copy it now; it cannot be shown again after this dialog closes.',
    }),
    copy: localTrans({
      'zh-CN': '复制',
      'en-US': 'Copy',
    }),
    copied: localTrans({
      'zh-CN': '已复制',
      'en-US': 'Copied',
    }),
    done: localTrans({
      'zh-CN': '完成',
      'en-US': 'Done',
    }),
    lastUsedAt: localTrans({
      'zh-CN': '最近使用',
      'en-US': 'Last used',
    }),
    expiresAt: localTrans({
      'zh-CN': '过期时间',
      'en-US': 'Expires',
    }),
    never: localTrans({
      'zh-CN': '永不',
      'en-US': 'Never',
    }),
    neverUsed: localTrans({
      'zh-CN': '尚未使用',
      'en-US': 'Not yet',
    }),
    status: localTrans({
      'zh-CN': '状态',
      'en-US': 'Status',
    }),
    active: localTrans({
      'zh-CN': '有效',
      'en-US': 'Active',
    }),
    revoked: localTrans({
      'zh-CN': '已吊销',
      'en-US': 'Revoked',
    }),
    expired: localTrans({
      'zh-CN': '已过期',
      'en-US': 'Expired',
    }),
    revoke: localTrans({
      'zh-CN': '吊销',
      'en-US': 'Revoke',
    }),
    revokeConfirm: localTrans({
      'zh-CN': '吊销后使用此密钥的请求将立即失败，且不可恢复。',
      'en-US':
        'Requests using this key fail immediately after revocation. This cannot be undone.',
    }),
    revokedSuccess: localTrans({
      'zh-CN': '密钥已吊销',
      'en-US': 'Key revoked',
    }),
    noKeys: localTrans({
      'zh-CN': '暂无密钥',
      'en-US': 'No keys yet',
    }),
    usage: localTrans({
      'zh-CN': '用法',
      'en-US': 'Usage',
    }),
  },
  bot: {
    callback: localTrans({
      'zh-CN': '消息回调地址',
      'en-US': 'Callback Url',
    }),
    callbackTip: localTrans({
      'zh-CN':
        '机器人被 @ 的时候会向该地址发送请求(收件箱接受到新内容时会发送回调)',
      'en-US':
        'The bot will send a request to this address when it is mentioned (callback will be sent when the inbox receives new content)',
    }),
  },
  oauth: {
    open: localTrans({
      'zh-CN': '开启 OAuth',
      'en-US': 'Open OAuth',
    }),
    allowedCallbackUrls: localTrans({
      'zh-CN': '允许的回调地址',
      'en-US': 'Allowed Callback Urls',
    }),
    allowedCallbackUrlsTip: localTrans({
      'zh-CN': '多个回调地址单独一行',
      'en-US': 'Multiple callback addresses on a single line',
    }),
  },
};
