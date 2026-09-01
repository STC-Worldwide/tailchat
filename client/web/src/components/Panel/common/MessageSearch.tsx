import { NormalMessage } from '@/components/ChatBox/ChatMessageList/Item';
import React from 'react';
import {
  ChatMessage,
  localTrans,
  model,
  showToasts,
  t,
  useAsyncRequest,
} from 'tailchat-shared';
import { Button } from '@/components/ui/official/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/official/empty';
import { Input } from '@/components/ui/official/input';
import { LoaderCircleIcon, SearchIcon, SearchXIcon } from 'lucide-react';

export const MessageSearchPanel: React.FC<{
  groupId?: string;
  converseId: string;
}> = React.memo((props) => {
  const { groupId, converseId } = props;
  const [searchText, setSearchText] = React.useState('');
  const [hasSearched, setHasSearched] = React.useState(false);
  const [{ loading, value = [] }, handleSearch] = useAsyncRequest(
    async (searchText: string) => {
      if (searchText.length < 3) {
        showToasts(t('搜索内容太短无法搜索'));
        return;
      }
      const messages = await model.message.searchMessage(
        searchText,
        converseId,
        groupId
      );

      return messages ?? [];
    }
  );

  const searchedMessages = value as ChatMessage[];
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchText.trim();
    if (query.length < 3) {
      showToasts(t('搜索内容太短无法搜索'));
      return;
    }

    const result = await handleSearch(query);
    setHasSearched(Array.isArray(result));
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <form
        className="flex shrink-0 gap-2 border-b bg-background p-3"
        role="search"
        onSubmit={handleSubmit}
      >
        <Input
          className="h-11 min-w-0 flex-1 md:h-9"
          placeholder={t('请输入关键字')}
          aria-label={t('请输入关键字')}
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
        />
        <Button
          type="submit"
          variant="default"
          size="icon-lg"
          className="size-11 md:size-9"
          disabled={loading}
          aria-label={t('搜索')}
        >
          {loading ? (
            <LoaderCircleIcon className="animate-spin" />
          ) : (
            <SearchIcon />
          )}
        </Button>
      </form>

      {/* Result List */}
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {!hasSearched && !loading && (
          <Empty className="min-h-56 border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SearchIcon />
              </EmptyMedia>
              <EmptyTitle>{t('聊天记录搜索')}</EmptyTitle>
              <EmptyDescription>
                {localTrans({
                  'zh-CN': '输入至少 3 个字符以搜索聊天记录。',
                  'en-US':
                    'Enter at least 3 characters to search chat history.',
                })}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
        {hasSearched && !loading && searchedMessages.length === 0 && (
          <Empty className="min-h-56 border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SearchXIcon />
              </EmptyMedia>
              <EmptyTitle>{t('没有任何搜索结果')}</EmptyTitle>
              <EmptyDescription>
                {localTrans({
                  'zh-CN': '尝试其他关键字。',
                  'en-US': 'Try a different keyword.',
                })}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {searchedMessages.map((message) => (
          <NormalMessage
            key={message._id}
            showAvatar={true}
            payload={message}
            hideAction={true}
          />
        ))}
      </div>
    </div>
  );
});
MessageSearchPanel.displayName = 'MessageSearchPanel';
