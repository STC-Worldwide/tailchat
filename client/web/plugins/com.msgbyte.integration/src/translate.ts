import { localTrans } from '@capital/common';

export const Translate = {
  groupdetail: localTrans({
    'zh-CN': '集成',
    'en-US': 'Integration',
  }),
  notFoundApp: localTrans({
    'zh-CN': '没找到该应用',
    'en-US': 'Not found application',
  }),
  onlyAllowManualAddition: localTrans({
    'zh-CN': '目前仅支持通过应用ID手动添加',
    'en-US': 'Currently only supports manual addition via app ID',
  }),
  findApplication: localTrans({
    'zh-CN': '查找应用',
    'en-US': 'Find an application',
  }),
  findApplicationHint: localTrans({
    'zh-CN': '输入开放平台应用 ID，查看应用信息并添加可用的机器人。',
    'en-US':
      'Enter an OpenAPI application ID to review it and add an available bot.',
  }),
  noApplicationDescription: localTrans({
    'zh-CN': '暂无应用描述',
    'en-US': 'No application description',
  }),
  appId: localTrans({
    'zh-CN': '应用ID',
    'en-US': 'Application ID',
  }),
  search: localTrans({
    'zh-CN': '查询',
    'en-US': 'Search',
  }),
  developer: localTrans({
    'zh-CN': '开发者',
    'en-US': 'Developer',
  }),
  addBot: localTrans({
    'zh-CN': '添加应用机器人到群组',
    'en-US': 'Add app bot to group',
  }),
  cannotAddBot: localTrans({
    'zh-CN': '该应用机器人没有开放聊天功能',
    'en-US': 'This application does not enable chat feature',
  }),
};
