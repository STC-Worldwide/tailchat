import type { JSONContent } from '@tiptap/react';
import { getMessageTextDecorators } from '@/plugin/common';

/**
 * tailchat 消息串 <-> tiptap 文档 的互转。
 *
 * 消息里的 mention 标记格式由插件决定(如 bbcode 插件注册
 * `[at=id]name[/at]`), 从
 * getMessageTextDecorators() 的模板派生序列化与解析。
 */

export interface MentionMarkup {
  template: string; // 含 __id__ / __display__ 占位符
  regex: RegExp | null; // 模板缺少 __id__ 时无法解析, 为 null
  idFirst: boolean;
}

function buildMarkup(template: string): MentionMarkup {
  if (!template.includes('__id__') || !template.includes('__display__')) {
    return { template, regex: null, idFirst: true };
  }
  const escaped = template.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const idFirst = template.indexOf('__id__') < template.indexOf('__display__');
  const source = escaped
    .replace('__id__', '([^\\[\\]]+?)')
    .replace('__display__', '([^\\[\\]]*?)');
  return { template, regex: new RegExp(source, 'g'), idFirst };
}

export function getUserMentionMarkup(): MentionMarkup {
  return buildMarkup(
    getMessageTextDecorators().mention('__id__', '__display__')
  );
}

export function getPanelMentionMarkup(): MentionMarkup {
  return buildMarkup(getMessageTextDecorators().url('__id__', '#__display__'));
}

function serializeNode(node: JSONContent): string {
  if (node.type === 'text') {
    return node.text ?? '';
  }
  if (node.type === 'userMention') {
    return getMessageTextDecorators().mention(
      String(node.attrs?.id ?? ''),
      String(node.attrs?.label ?? '')
    );
  }
  if (node.type === 'panelMention') {
    return getMessageTextDecorators().url(
      String(node.attrs?.id ?? ''),
      `#${String(node.attrs?.label ?? '')}`
    );
  }
  if (node.type === 'hardBreak') {
    return '\n';
  }
  return (node.content ?? []).map(serializeNode).join('');
}

/**
 * tiptap 文档 -> tailchat 消息串
 */
export function docToMessage(doc: JSONContent): string {
  return (doc.content ?? []).map(serializeNode).join('\n');
}

/**
 * 收集文档中所有被 @ 的用户 id
 */
export function collectMentions(doc: JSONContent): string[] {
  const ids: string[] = [];
  const walk = (node: JSONContent) => {
    if (node.type === 'userMention' && node.attrs?.id) {
      ids.push(String(node.attrs.id));
    }
    (node.content ?? []).forEach(walk);
  };
  walk(doc);
  return ids;
}

interface Segment {
  index: number;
  length: number;
  node: JSONContent;
}

function findMentionSegments(
  line: string,
  markup: MentionMarkup,
  nodeType: 'userMention' | 'panelMention'
): Segment[] {
  if (!markup.regex) {
    return [];
  }
  const segments: Segment[] = [];
  markup.regex.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = markup.regex.exec(line)) !== null) {
    const id = markup.idFirst ? m[1] : m[2];
    let label = markup.idFirst ? m[2] : m[1];
    if (nodeType === 'panelMention' && label.startsWith('#')) {
      label = label.slice(1);
    }
    segments.push({
      index: m.index,
      length: m[0].length,
      node: { type: nodeType, attrs: { id, label } },
    });
  }
  return segments;
}

/**
 * tailchat 消息串 -> tiptap 文档
 */
export function messageToDoc(message: string): JSONContent {
  const userMarkup = getUserMentionMarkup();
  const panelMarkup = getPanelMentionMarkup();

  const paragraphs = message.split('\n').map((line): JSONContent => {
    const segments = [
      ...findMentionSegments(line, userMarkup, 'userMention'),
      ...findMentionSegments(line, panelMarkup, 'panelMention'),
    ].sort((a, b) => a.index - b.index);

    const content: JSONContent[] = [];
    let cursor = 0;
    for (const seg of segments) {
      if (seg.index < cursor) {
        continue; // 与前一段重叠(user/panel 模板互相匹配), 跳过
      }
      if (seg.index > cursor) {
        content.push({ type: 'text', text: line.slice(cursor, seg.index) });
      }
      content.push(seg.node);
      cursor = seg.index + seg.length;
    }
    if (cursor < line.length) {
      content.push({ type: 'text', text: line.slice(cursor) });
    }

    return content.length > 0
      ? { type: 'paragraph', content }
      : { type: 'paragraph' };
  });

  return { type: 'doc', content: paragraphs };
}
