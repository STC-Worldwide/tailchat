import React, { useEffect, useMemo, useRef } from 'react';
import {
  EditorContent,
  ReactRenderer,
  useEditor,
  type JSONContent,
} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';
import type { SuggestionOptions, SuggestionProps } from '@tiptap/suggestion';
import { getGroupConfigWithInfo, t, useGroupInfo } from 'tailchat-shared';
import { stopPropagation } from '@/utils/dom-helper';
import { useGroupIdContext } from '@/plugin/common';
import { useChatInputMentionsContext } from '../context';
import { collectMentions, docToMessage, messageToDoc } from './serializer';
import {
  MentionSuggestionList,
  MentionSuggestionListRef,
  SuggestionItem,
} from './MentionSuggestionList';

const MAX_MESSAGE_LENGTH = 1000;

interface ChatInputBoxInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>,
    'value' | 'onChange'
  > {
  inputRef?: React.Ref<HTMLInputElement>;
  value: string;
  onChange: (message: string, mentions: string[]) => void;
}

/**
 * 悬浮在光标位置的建议弹层 (不依赖 tippy)
 */
function buildSuggestionRender(
  kind: 'user' | 'panel',
  hideDiscriminator: boolean
): SuggestionOptions<SuggestionItem>['render'] {
  return () => {
    let component: ReactRenderer<MentionSuggestionListRef> | null = null;
    let popup: HTMLDivElement | null = null;

    const updatePosition = (props: SuggestionProps<SuggestionItem>) => {
      if (!popup) {
        return;
      }
      const rect = props.clientRect?.();
      if (!rect) {
        return;
      }
      popup.style.left = `${rect.left}px`;
      popup.style.bottom = `${window.innerHeight - rect.top + 6}px`;
    };

    const destroy = () => {
      component?.destroy();
      popup?.remove();
      component = null;
      popup = null;
    };

    return {
      onStart: (props) => {
        component = new ReactRenderer(MentionSuggestionList, {
          props: {
            kind,
            items: props.items,
            hideDiscriminator,
            command: props.command,
          },
          editor: props.editor,
        });
        popup = document.createElement('div');
        // tailwind 工具类被 important 限定在 #app 下, 弹层必须挂进应用根
        // 节点内, 定位用内联样式
        popup.style.position = 'fixed';
        popup.style.zIndex = '50';
        popup.appendChild(component.element);
        (document.getElementById('tailchat-app') ?? document.body).appendChild(
          popup
        );
        updatePosition(props);
      },
      onUpdate: (props) => {
        component?.updateProps({ items: props.items, command: props.command });
        updatePosition(props);
      },
      onKeyDown: (props) => {
        if (props.event.key === 'Escape') {
          destroy();
          return true;
        }
        return component?.ref?.onKeyDown(props.event) ?? false;
      },
      onExit: destroy,
    };
  };
}

function buildMentionExtension(options: {
  name: 'userMention' | 'panelMention';
  char: string;
  className: string;
  getItems: (query: string) => SuggestionItem[];
  hideDiscriminator: boolean;
}) {
  return Mention.extend({ name: options.name }).configure({
    HTMLAttributes: { class: options.className },
    renderText: ({ node }) => `${options.char}${node.attrs.label}`,
    renderHTML: ({ node, options: opts }) => [
      'span',
      opts.HTMLAttributes,
      `${options.char}${node.attrs.label}`,
    ],
    suggestion: {
      char: options.char,
      items: ({ query }) => options.getItems(query),
      render: buildSuggestionRender(
        options.name === 'userMention' ? 'user' : 'panel',
        options.hideDiscriminator
      ),
      command: ({ editor, range, props }) => {
        // suggestion 的 items 返回 SuggestionItem, 库默认按 MentionNodeAttrs 标注
        const item = props as unknown as SuggestionItem;
        editor
          .chain()
          .focus()
          .insertContentAt(range, [
            {
              type: options.name,
              attrs: { id: item.id, label: item.display },
            },
            { type: 'text', text: ' ' },
          ])
          .run();
      },
    },
  });
}

/**
 * 基于 Tiptap 的聊天输入框，保留 Tailchat 的消息串与 mention 契约。
 */
export const TiptapChatInput: React.FC<ChatInputBoxInputProps> = React.memo(
  (props) => {
    const { users, panels, placeholder, disabled } =
      useChatInputMentionsContext();
    const groupId = useGroupIdContext();
    const groupInfo = useGroupInfo(groupId);
    const { hideGroupMemberDiscriminator } = getGroupConfigWithInfo(groupInfo);

    // suggestion 回调不在 react 渲染流中, 通过 ref 取最新数据
    const dataRef = useRef({ users, panels });
    dataRef.current = { users, panels };
    const propsRef = useRef(props);
    propsRef.current = props;

    const extensions = useMemo(
      () => [
        StarterKit.configure({
          blockquote: false,
          bulletList: false,
          orderedList: false,
          listItem: false,
          codeBlock: false,
          heading: false,
          horizontalRule: false,
          bold: false,
          italic: false,
          strike: false,
          code: false,
          link: false,
          underline: false,
          dropcursor: false,
          gapcursor: false,
        }),
        buildMentionExtension({
          name: 'userMention',
          char: '@',
          className:
            'rounded bg-primary/10 px-0.5 font-medium text-primary',
          hideDiscriminator: hideGroupMemberDiscriminator,
          getItems: (query) =>
            (dataRef.current.users ?? [])
              .filter((u) => u.display?.includes(query))
              .slice(0, 20)
              .map((u) => ({ id: String(u.id), display: u.display ?? '' })),
        }),
        buildMentionExtension({
          name: 'panelMention',
          char: '#',
          className:
            'rounded bg-primary/10 px-0.5 font-medium text-primary',
          hideDiscriminator: hideGroupMemberDiscriminator,
          getItems: (query) =>
            (dataRef.current.panels ?? [])
              .filter((p) => p.display?.includes(query))
              .slice(0, 20)
              .map((p) => ({ id: String(p.id), display: p.display ?? '' })),
        }),
      ],
      [hideGroupMemberDiscriminator]
    );

    const editor = useEditor(
      {
        extensions,
        content: messageToDoc(props.value),
        editable: !disabled,
        onUpdate: ({ editor }) => {
          const doc = editor.getJSON();
          propsRef.current.onChange(docToMessage(doc), collectMentions(doc));
        },
        editorProps: {
          attributes: {
            class:
              'box-border min-h-10 max-h-[40vh] overflow-y-auto break-words px-3 py-2 text-sm leading-6 outline-none [&_p]:m-0!',
            role: 'textbox',
            'aria-multiline': 'true',
            'aria-label': placeholder ?? t('输入一些什么'),
          },
          handleKeyDown: (view, event) => {
            let prevented = false;
            propsRef.current.onKeyDown?.({
              nativeEvent: event,
              preventDefault: () => {
                prevented = true;
                event.preventDefault();
              },
            } as unknown as React.KeyboardEvent<HTMLInputElement>);
            return prevented;
          },
          handleTextInput: (view) =>
            // 软限长: 达到上限后拒绝继续输入
            docToMessage(view.state.doc.toJSON() as JSONContent).length >=
            MAX_MESSAGE_LENGTH,
        },
      },
      [extensions]
    );

    // 外部 value 变化(发送后清空/追加表情/回复前缀)时同步进编辑器
    useEffect(() => {
      if (!editor) {
        return;
      }
      const current = docToMessage(editor.getJSON());
      if (current !== props.value) {
        editor.commands.setContent(messageToDoc(props.value));
        editor.commands.focus('end');
      }
    }, [editor, props.value]);

    useEffect(() => {
      editor?.setEditable(!disabled);
    }, [editor, disabled]);

    // 保持与旧输入框一致的 inputRef 契约: focus() 与 value 可用
    useEffect(() => {
      if (!props.inputRef || !editor) {
        return;
      }
      const shim = {
        focus: () => editor.commands.focus('end'),
        get value() {
          return docToMessage(editor.getJSON());
        },
      } as unknown as HTMLInputElement;
      if (typeof props.inputRef === 'function') {
        props.inputRef(shim);
      } else {
        (
          props.inputRef as React.MutableRefObject<HTMLInputElement | null>
        ).current = shim;
      }
    }, [editor, props.inputRef]);

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
      if (!editor) {
        return;
      }
      // 复用旧输入框的粘贴处理(图片上传/粘贴处理器), currentTarget 以
      // shim 提供 value
      propsRef.current.onPaste?.({
        ...e,
        currentTarget: {
          value: docToMessage(editor.getJSON()),
        },
      } as unknown as React.ClipboardEvent<HTMLInputElement>);
    };

    return (
      <div
        className="relative min-h-10"
        onContextMenu={stopPropagation}
        onPasteCapture={handlePaste}
      >
        {props.value === '' && (
          <div className="pointer-events-none absolute inset-0 truncate px-3 py-2 text-sm leading-6 text-muted-foreground">
            {placeholder ?? t('输入一些什么')}
          </div>
        )}
        <EditorContent editor={editor} />
      </div>
    );
  }
);
TiptapChatInput.displayName = 'TiptapChatInput';
