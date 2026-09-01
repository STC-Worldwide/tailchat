import React, { useState, useCallback, useEffect } from 'react';
import _isString from 'lodash/isString';
import _isNil from 'lodash/isNil';
import { t } from 'tailchat-shared';
import { CheckIcon, PencilIcon, XIcon } from 'lucide-react';
import { TipIcon } from '../TipIcon';
import { Button } from '@/components/ui/official/button';
import { Input } from '@/components/ui/official/input';
import { Textarea } from '@/components/ui/official/textarea';
import {
  Field,
  FieldContent,
  FieldTitle,
} from '@/components/ui/official/field';
import { cn } from '@/lib/utils';

export type FullModalFieldEditorRenderComponent = React.FC<{
  value: string;
  onChange: (val: string) => void;
  label?: string;
}>;

interface FullModalFieldProps {
  className?: string;

  /**
   * 字段标题
   */
  title: React.ReactNode;

  /**
   * 提示信息
   */
  tip?: React.ReactNode;

  /**
   * 字段内容
   * 如果没有则向下取value的值
   */
  content?: React.ReactNode;

  /**
   * 是否可编辑
   */
  editable?: boolean;

  /**
   * 如果可编辑则必填
   * 用于告知组件当前的值
   */
  value?: string;

  /**
   * 渲染编辑视图的编辑器
   */
  renderEditor?: FullModalFieldEditorRenderComponent;

  /**
   * 编辑完成后的回调
   */
  onSave?: (val: string) => void;
}

/**
 * 计算要显示的title
 */
function useTitle(value?: string) {
  return _isString(value) ? value : undefined;
}

/**
 * 字段编辑器
 */
const FullModalFieldEditor: React.FC<FullModalFieldProps> = React.memo(
  (props) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editingValue, setEditingValue] = useState(props.value ?? '');
    const valueTitle = useTitle(props.value);

    useEffect(() => {
      setEditingValue(props.value ?? '');
    }, [props.value]);

    const handleEditing = useCallback(() => {
      setIsEditing((current) => !current);
    }, []);

    const handleSave = useCallback(() => {
      props.onSave?.(editingValue);
      setIsEditing(false);
    }, [props.onSave, editingValue]);

    const EditorComponent = props.renderEditor;
    const editorLabel =
      typeof props.title === 'string' ? props.title : t('编辑');

    return (
      <div className="flex w-full min-w-0 items-center gap-2">
        {/* 内容 */}
        <div className="min-w-0 flex-1 break-words">
          {isEditing && !_isNil(EditorComponent) ? (
            <EditorComponent
              value={editingValue}
              label={editorLabel}
              onChange={setEditingValue}
            />
          ) : (
            <span className="select-text" title={valueTitle}>
              {props.content ?? props.value}
            </span>
          )}
        </div>

        {/* 操作 */}
        <div className="shrink-0">
          {!isEditing ? (
            <Button
              type="button"
              variant="ghost"
              className="size-8"
              title={t('编辑')}
              aria-label={t('编辑')}
              onClick={handleEditing}
            >
              <PencilIcon className="size-4" />
            </Button>
          ) : (
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                className="size-8"
                title={t('取消')}
                aria-label={t('取消')}
                onClick={handleEditing}
              >
                <XIcon className="size-4" />
              </Button>
              <Button
                type="button"
                className="size-8"
                title={t('保存变更')}
                aria-label={t('保存变更')}
                onClick={handleSave}
              >
                <CheckIcon className="size-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }
);
FullModalFieldEditor.displayName = 'FullModalFieldEditor';

export const FullModalField: React.FC<FullModalFieldProps> = React.memo(
  (props) => {
    const valueTitle = useTitle(props.value);

    const allowEditor = props.editable === true && !_isNil(props.renderEditor);

    return (
      <Field className={cn('mb-5 min-w-0 gap-1.5', props.className)}>
        <FieldContent>
          <FieldTitle className="text-muted-foreground">
            <span>{props.title}</span>
            {props.tip && <TipIcon content={props.tip} />}
          </FieldTitle>
        </FieldContent>
        <div className="flex min-h-8 min-w-0 items-center text-sm text-foreground">
          {allowEditor === true ? (
            <FullModalFieldEditor {...props} />
          ) : (
            <span
              className="min-w-0 select-text break-words"
              title={valueTitle}
            >
              {props.content ?? props.value}
            </span>
          )}
        </div>
      </Field>
    );
  }
);
FullModalField.displayName = 'FullModalField';

/**
 * 默认的输入框字段编辑器
 */
export const DefaultFullModalInputEditorRender: FullModalFieldEditorRenderComponent =
  ({ value, label, onChange }) => (
    <Input
      value={value}
      aria-label={label}
      onChange={(e) => onChange(e.target.value)}
    />
  );

/**
 * 默认的多行输入框字段编辑器
 */
export const DefaultFullModalTextAreaEditorRender: FullModalFieldEditorRenderComponent =
  ({ value, label, onChange }) => (
    <Textarea
      rows={3}
      value={value}
      aria-label={label}
      onChange={(e) => onChange(e.target.value)}
    />
  );
