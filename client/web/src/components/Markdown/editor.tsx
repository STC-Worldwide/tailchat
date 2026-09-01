import { Alert, AlertDescription } from '@/components/ui/official/alert';
import { Button } from '@/components/ui/official/button';
import { Separator } from '@/components/ui/official/separator';
import { Textarea } from '@/components/ui/official/textarea';
import { cn } from '@/lib/utils';
import {
  BoldIcon,
  BracesIcon,
  Columns2Icon,
  EyeIcon,
  Heading1Icon,
  ImagePlusIcon,
  ItalicIcon,
  Link2Icon,
  ListIcon,
  ListOrderedIcon,
  LoaderCircleIcon,
  PanelLeftIcon,
  QuoteIcon,
  TriangleAlertIcon,
} from 'lucide-react';
import React, { useCallback, useRef, useState } from 'react';
import { t, uploadFile, type UploadFileUsage } from 'tailchat-shared';
import { Markdown } from './render';

type MarkdownEditorView = 'write' | 'preview' | 'split';

interface MarkdownEditorProps {
  value: string;
  onChange: (val: string) => void;
  imageUsage?: UploadFileUsage;
}

interface Selection {
  start: number;
  end: number;
}

const ToolbarButton: React.FC<
  React.ComponentPropsWithoutRef<typeof Button> & { label: string }
> = React.memo(({ label, children, ...props }) => (
  <Button
    type="button"
    variant="ghost"
    size="icon-sm"
    aria-label={label}
    title={label}
    {...props}
  >
    {children}
  </Button>
));
ToolbarButton.displayName = 'ToolbarButton';

export const MarkdownEditor: React.FC<MarkdownEditorProps> = React.memo(
  (props) => {
    const value = props.value ?? '';
    const valueRef = useRef(value);
    valueRef.current = value;

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [view, setView] = useState<MarkdownEditorView>(() =>
      typeof window !== 'undefined' && window.innerWidth < 768
        ? 'write'
        : 'split'
    );
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const getSelection = useCallback((): Selection => {
      const textarea = textareaRef.current;

      return textarea
        ? { start: textarea.selectionStart, end: textarea.selectionEnd }
        : { start: valueRef.current.length, end: valueRef.current.length };
    }, []);

    const replaceSelection = useCallback(
      (
        selection: Selection,
        replacement: string,
        nextSelectionStart: number,
        nextSelectionEnd = nextSelectionStart
      ) => {
        const currentValue = valueRef.current;
        const nextValue =
          currentValue.slice(0, selection.start) +
          replacement +
          currentValue.slice(selection.end);

        props.onChange(nextValue);
        window.requestAnimationFrame(() => {
          textareaRef.current?.focus();
          textareaRef.current?.setSelectionRange(
            nextSelectionStart,
            nextSelectionEnd
          );
        });
      },
      [props.onChange]
    );

    const wrapSelection = useCallback(
      (prefix: string, suffix: string, placeholder: string) => {
        const selection = getSelection();
        const selected = valueRef.current.slice(selection.start, selection.end);
        const content = selected || placeholder;
        const replacement = `${prefix}${content}${suffix}`;
        const contentStart = selection.start + prefix.length;

        replaceSelection(
          selection,
          replacement,
          contentStart,
          contentStart + content.length
        );
      },
      [getSelection, replaceSelection]
    );

    const prefixLines = useCallback(
      (prefix: string | ((index: number) => string)) => {
        const selection = getSelection();
        const currentValue = valueRef.current;
        const lineStart = currentValue.lastIndexOf('\n', selection.start - 1) + 1;
        const nextLineBreak = currentValue.indexOf('\n', selection.end);
        const lineEnd =
          nextLineBreak === -1 ? currentValue.length : nextLineBreak;
        const block = currentValue.slice(lineStart, lineEnd);
        const replacement = block
          .split('\n')
          .map((line, index) =>
            `${typeof prefix === 'function' ? prefix(index) : prefix}${line}`
          )
          .join('\n');

        replaceSelection(
          { start: lineStart, end: lineEnd },
          replacement,
          lineStart,
          lineStart + replacement.length
        );
      },
      [getSelection, replaceSelection]
    );

    const insertCode = useCallback(() => {
      const selection = getSelection();
      const selected = valueRef.current.slice(selection.start, selection.end);

      if (selected.includes('\n')) {
        wrapSelection('```\n', '\n```', t('代码'));
        return;
      }

      wrapSelection('`', '`', t('代码'));
    }, [getSelection, wrapSelection]);

    const insertLink = useCallback(() => {
      const selection = getSelection();
      const selected = valueRef.current.slice(selection.start, selection.end);
      const label = selected || t('链接文本');
      const url = 'https://';
      const replacement = `[${label}](${url})`;
      const urlStart = selection.start + label.length + 3;

      replaceSelection(
        selection,
        replacement,
        urlStart,
        urlStart + url.length
      );
    }, [getSelection, replaceSelection]);

    const handleImageUpload = useCallback(
      async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? []);
        event.target.value = '';
        if (files.length === 0) {
          return;
        }

        const selection = getSelection();
        setUploading(true);
        setUploadError(null);
        try {
          const uploaded = await Promise.all(
            files.map(async (file) => ({
              file,
              result: await uploadFile(file, {
                usage: props.imageUsage || 'unknown',
              }),
            }))
          );
          const markdown = uploaded
            .map(({ file, result }) => {
              const alt = file.name.replace(/[\[\]]/g, '');
              return `![${alt}](${result.url})`;
            })
            .join('\n');

          replaceSelection(
            selection,
            markdown,
            selection.start + markdown.length
          );
        } catch {
          setUploadError(t('图片上传失败，请检查文件大小和网络连接后重试'));
        } finally {
          setUploading(false);
        }
      },
      [getSelection, props.imageUsage, replaceSelection]
    );

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (!(event.ctrlKey || event.metaKey)) {
          return;
        }

        switch (event.key.toLowerCase()) {
          case 'b':
            event.preventDefault();
            wrapSelection('**', '**', t('粗体文本'));
            break;
          case 'i':
            event.preventDefault();
            wrapSelection('_', '_', t('斜体文本'));
            break;
          case 'k':
            event.preventDefault();
            insertLink();
            break;
        }
      },
      [insertLink, wrapSelection]
    );

    const editorVisible = view === 'write' || view === 'split';
    const previewVisible = view === 'preview' || view === 'split';
    const editingDisabled = view === 'preview' || uploading;

    return (
      <div
        data-slot="markdown-editor"
        className="tailchat-markdown-editor flex h-full min-h-80 w-full flex-col overflow-hidden rounded-xl border border-border bg-background text-foreground shadow-sm"
      >
        <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/30 p-1.5">
          <ToolbarButton
            label={t('标题')}
            disabled={editingDisabled}
            onClick={() => prefixLines('# ')}
          >
            <Heading1Icon />
          </ToolbarButton>
          <ToolbarButton
            label={t('粗体')}
            disabled={editingDisabled}
            onClick={() => wrapSelection('**', '**', t('粗体文本'))}
          >
            <BoldIcon />
          </ToolbarButton>
          <ToolbarButton
            label={t('斜体')}
            disabled={editingDisabled}
            onClick={() => wrapSelection('_', '_', t('斜体文本'))}
          >
            <ItalicIcon />
          </ToolbarButton>
          <ToolbarButton
            label={t('链接')}
            disabled={editingDisabled}
            onClick={insertLink}
          >
            <Link2Icon />
          </ToolbarButton>

          <Separator orientation="vertical" className="mx-1 hidden h-6 sm:block" />

          <ToolbarButton
            label={t('无序列表')}
            disabled={editingDisabled}
            onClick={() => prefixLines('- ')}
          >
            <ListIcon />
          </ToolbarButton>
          <ToolbarButton
            label={t('有序列表')}
            disabled={editingDisabled}
            onClick={() => prefixLines((index) => `${index + 1}. `)}
          >
            <ListOrderedIcon />
          </ToolbarButton>
          <ToolbarButton
            label={t('引用')}
            disabled={editingDisabled}
            onClick={() => prefixLines('> ')}
          >
            <QuoteIcon />
          </ToolbarButton>
          <ToolbarButton
            label={t('代码')}
            disabled={editingDisabled}
            onClick={insertCode}
          >
            <BracesIcon />
          </ToolbarButton>
          <ToolbarButton
            label={uploading ? t('正在上传') : t('插入图片')}
            disabled={editingDisabled}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              <ImagePlusIcon />
            )}
          </ToolbarButton>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple={true}
            hidden={true}
            aria-hidden="true"
            tabIndex={-1}
            onChange={handleImageUpload}
          />

          <div
            className="ml-auto flex items-center gap-0.5 rounded-lg bg-muted p-0.5"
            aria-label={t('编辑器视图')}
          >
            <Button
              type="button"
              size="sm"
              variant={view === 'write' ? 'secondary' : 'ghost'}
              aria-label={t('编辑')}
              title={t('编辑')}
              aria-pressed={view === 'write'}
              onClick={() => setView('write')}
            >
              <PanelLeftIcon data-icon="inline-start" />
              <span className="hidden sm:inline">{t('编辑')}</span>
            </Button>
            <Button
              type="button"
              size="sm"
              variant={view === 'preview' ? 'secondary' : 'ghost'}
              aria-label={t('预览')}
              title={t('预览')}
              aria-pressed={view === 'preview'}
              onClick={() => setView('preview')}
            >
              <EyeIcon data-icon="inline-start" />
              <span className="hidden sm:inline">{t('预览')}</span>
            </Button>
            <Button
              type="button"
              size="sm"
              variant={view === 'split' ? 'secondary' : 'ghost'}
              aria-label={t('分栏')}
              title={t('分栏')}
              aria-pressed={view === 'split'}
              onClick={() => setView('split')}
            >
              <Columns2Icon data-icon="inline-start" />
              <span className="hidden sm:inline">{t('分栏')}</span>
            </Button>
          </div>
        </div>

        <div
          className={cn('grid min-h-0 flex-1', {
            'grid-cols-1 md:grid-cols-2': view === 'split',
          })}
        >
          {editorVisible && (
            <div className="flex min-h-0 min-w-0 flex-col">
              <Textarea
                ref={textareaRef}
                value={value}
                aria-label={t('Markdown 内容')}
                spellCheck={true}
                wrap="soft"
                style={{
                  fontFamily:
                    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                }}
                className="field-sizing-fixed! h-full min-h-0 flex-1 resize-none overflow-x-hidden rounded-none border-0 bg-transparent p-4 font-mono text-sm leading-6 shadow-none focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent"
                onChange={(event) => props.onChange(event.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
          )}

          {previewVisible && (
            <div
              role="region"
              aria-label={t('Markdown 预览')}
              className={cn(
                'min-h-0 min-w-0 overflow-y-auto overflow-x-hidden bg-background p-4',
                view === 'split' &&
                  'border-t border-border md:border-t-0 md:border-l'
              )}
            >
              {value.trim() ? (
                <Markdown raw={value} />
              ) : (
                <div className="flex h-full min-h-32 items-center justify-center text-sm text-muted-foreground">
                  {t('输入 Markdown 后将在这里显示预览')}
                </div>
              )}
            </div>
          )}
        </div>

        {uploadError && (
          <Alert
            variant="destructive"
            className="rounded-none border-x-0 border-b-0"
          >
            <TriangleAlertIcon />
            <AlertDescription>{uploadError}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/20 px-3 py-1.5 text-xs tabular-nums text-muted-foreground">
          <span>
            {t('行数')}: {value.split(/\r?\n/).length}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {t('字符数')}: {value.length}
          </span>
        </div>
      </div>
    );
  }
);
MarkdownEditor.displayName = 'MarkdownEditor';
