import { localTrans } from '@capital/common';

export const Translate = {
  discover: localTrans({
    'zh-CN': '探索',
    'en-US': 'Discover',
  }),
  memberCount: localTrans({
    'zh-CN': '{count} 位成员',
    'en-US': '{count} members',
  }),
  discoverHeader: localTrans({
    'zh-CN': '浏览公开社区，找到适合你的群组。',
    'en-US': 'Browse public communities and find a group that fits you.',
  }),
  join: localTrans({
    'zh-CN': '加入',
    'en-US': 'Join',
  }),
  joined: localTrans({
    'zh-CN': '已加入',
    'en-US': 'Joined',
  }),
  openGroup: localTrans({
    'zh-CN': '打开群组',
    'en-US': 'Open group',
  }),
  noDescription: localTrans({
    'zh-CN': '暂无群组描述。',
    'en-US': 'No group description yet.',
  }),
  loadingGroups: localTrans({
    'zh-CN': '正在加载公开群组',
    'en-US': 'Loading public groups',
  }),
  loadingGroup: localTrans({
    'zh-CN': '正在加载群组',
    'en-US': 'Loading group',
  }),
  emptyTitle: localTrans({
    'zh-CN': '暂时没有公开群组',
    'en-US': 'No public groups yet',
  }),
  emptyDescription: localTrans({
    'zh-CN': '公开群组出现后会显示在这里。',
    'en-US': 'Public groups will appear here when they become available.',
  }),
  loadFailed: localTrans({
    'zh-CN': '无法加载公开群组',
    'en-US': 'Could not load public groups',
  }),
  groupUnavailable: localTrans({
    'zh-CN': '该群组当前不可用。',
    'en-US': 'This group is currently unavailable.',
  }),
  tryAgain: localTrans({
    'zh-CN': '重试',
    'en-US': 'Try again',
  }),
};
