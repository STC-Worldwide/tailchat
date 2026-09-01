import { localTrans } from '@capital/common';

export const Translate = {
  welcomeText: localTrans({ 'zh-CN': '欢迎词', 'en-US': 'Welcome Text' }),
  welcomeTip: localTrans({
    'zh-CN': '向新成员发送入群欢迎消息',
    'en-US': 'Send a welcome message when a new member joins.',
  }),
  welcomePlaceholder: localTrans({
    'zh-CN': '欢迎 {nickname} 加入群组！',
    'en-US': 'Welcome {nickname} to the group!',
  }),
  welcomeDesc: localTrans({
    'zh-CN':
      '留空将停用欢迎消息。使用 {nickname} 插入昵称，使用 {@nickname} 提及新成员。支持富文本语法。',
    'en-US':
      'Leave blank to disable. Use {nickname} for the member name or {@nickname} to mention them. Rich-text syntax is supported.',
  }),
};
