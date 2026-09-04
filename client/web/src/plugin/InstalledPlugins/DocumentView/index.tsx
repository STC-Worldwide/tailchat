import React from 'react';
import { FileQuestionIcon } from 'lucide-react';
import { isValidStr, localTrans, t } from 'tailchat-shared';
import { DocumentMarkdownRender } from './DocumentMarkdownRender';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/official/empty';

interface DocumentViewProps {
  documentUrl?: string;
}

function UnsupportedDocument({ text }: { text: string }) {
  return (
    <Empty className="min-h-72">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FileQuestionIcon />
        </EmptyMedia>
        <EmptyTitle>
          {localTrans({
            'zh-CN': '无法显示插件文档',
            'en-US': 'Plugin documentation is unavailable',
          })}
        </EmptyTitle>
        <EmptyDescription>{text}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export const DocumentView: React.FC<DocumentViewProps> = React.memo((props) => {
  const { documentUrl } = props;

  if (!isValidStr(documentUrl)) {
    return <UnsupportedDocument text={t('该插件没有更多描述')} />;
  }

  if (documentUrl.endsWith('.md')) {
    return <DocumentMarkdownRender url={documentUrl} />;
  }

  if (documentUrl.endsWith('.html') || documentUrl.startsWith('http')) {
    return (
      <iframe
        src={documentUrl}
        title={localTrans({
          'zh-CN': '插件文档',
          'en-US': 'Plugin documentation',
        })}
        className="h-[70vh] min-h-96 w-full rounded-lg border bg-background"
      />
    );
  }

  return <UnsupportedDocument text={t('不支持渲染的文档链接')} />;
});
DocumentView.displayName = 'DocumentView';
