import React from 'react';
import { AlertCircleIcon } from 'lucide-react';
import { localTrans, t, useAsync } from 'tailchat-shared';
import { Markdown } from '@/components/Markdown';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/official/alert';
import { Skeleton } from '@/components/ui/official/skeleton';

export const DocumentMarkdownRender: React.FC<{ url: string }> = React.memo(
  ({ url }) => {
    const { loading, value, error } = useAsync(async () => {
      const data = await fetch(url);
      if (data.status >= 400) {
        throw new Error('Request failed');
      }

      return data.text();
    }, [url]);

    if (loading) {
      return (
        <div className="space-y-4 p-1" role="status">
          <Skeleton className="h-7 w-2/5" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-4/5" />
          <span className="sr-only">{t('加载中...')}</span>
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>
            {localTrans({
              'zh-CN': '无法加载文档',
              'en-US': 'Unable to load documentation',
            })}
          </AlertTitle>
          <AlertDescription>
            {localTrans({
              'zh-CN': '请检查文档地址或网络连接后重试。',
              'en-US':
                'Check the document URL or your connection and try again.',
            })}
          </AlertDescription>
        </Alert>
      );
    }

    return <Markdown raw={String(value)} baseUrl={url} allowIframe={true} />;
  }
);
DocumentMarkdownRender.displayName = 'DocumentMarkdownRender';
