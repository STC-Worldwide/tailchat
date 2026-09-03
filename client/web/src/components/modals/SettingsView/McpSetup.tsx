import React, { useCallback, useMemo, useState } from 'react';
import copy from 'copy-to-clipboard';
import { showSuccessToasts, t } from 'tailchat-shared';
import { Button } from '@/components/ui/official/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/official/tabs';
import { CopyIcon } from 'lucide-react';
import { SettingsPage, SettingsSection } from './Layout';

/**
 * MCP 客户端接入指引。
 *
 * 首选托管端点(/mcp): 客户端只要一个网址和自己的令牌, 不需要仓库、构建或 Node。
 * 本地 stdio 作为兜底, 留给还不支持远程 MCP 的客户端。
 *
 * 密钥仅在创建时显示一次, 服务端无法再读出, 所以片段里始终是占位符。
 */

const KEY_PLACEHOLDER = 'tck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
const REPO_PLACEHOLDER = '/path/to/tailchat';
const ENTRY = `${REPO_PLACEHOLDER}/apps/tailchat-mcp/dist/src/index.js`;

interface Recipe {
  value: string;
  label: string;
  /** 这段配置放在哪里, 或者说明它是命令而非文件 */
  where: React.ReactNode;
  language: string;
  snippet: string;
}

const CodeBlock: React.FC<{
  code: string;
  /** 无障碍名称, 也用于测试定位 */
  label: string;
  /** 头部显示的文字, 一般是语言 */
  caption: string;
}> = React.memo(({ code, label, caption }) => {
  const handleCopy = useCallback(() => {
    copy(code);
    showSuccessToasts(t('已复制'));
  }, [code]);

  // 复制按钮单独占一行而不是浮在代码上: 片段会横向滚动,
  // 窄屏下浮动按钮会压住代码内容。
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-muted">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-1.5">
        <span className="truncate font-mono text-xs text-muted-foreground">
          {caption}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="-my-1 shrink-0"
          onClick={handleCopy}
        >
          <CopyIcon />
          {t('复制')}
        </Button>
      </div>
      <pre
        aria-label={label}
        className="overflow-x-auto p-3 font-mono text-xs leading-5"
      >
        {code}
      </pre>
    </div>
  );
});
CodeBlock.displayName = 'CodeBlock';

// labelPrefix keeps the two strips' code blocks distinguishable: the same client
// appears in both, and an aria-label has to name one block, not two.
const RecipeTabs: React.FC<{ recipes: Recipe[]; labelPrefix: string }> =
  React.memo(({ recipes, labelPrefix }) => {
    const [tab, setTab] = useState(recipes[0].value);

    return (
      <Tabs value={tab} onValueChange={(value) => setTab(String(value))}>
        <TabsList>
          {recipes.map((recipe) => (
            <TabsTrigger key={recipe.value} value={recipe.value}>
              {recipe.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {recipes.map((recipe) => (
          <TabsContent
            key={recipe.value}
            value={recipe.value}
            className="space-y-3 pt-2"
          >
            <p className="text-sm leading-6 text-muted-foreground">
              {recipe.where}
            </p>
            <CodeBlock
              label={`${labelPrefix} ${recipe.label}`}
              caption={recipe.language}
              code={recipe.snippet}
            />
          </TabsContent>
        ))}
      </Tabs>
    );
  });
RecipeTabs.displayName = 'RecipeTabs';

export const SettingsMcpSetup: React.FC = React.memo(() => {
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  const endpoint = `${origin}/mcp`;

  const hosted: Recipe[] = useMemo(() => {
    const remoteJson = JSON.stringify(
      {
        mcpServers: {
          tailchat: {
            url: endpoint,
            headers: { Authorization: `Bearer ${KEY_PLACEHOLDER}` },
          },
        },
      },
      null,
      2
    );

    return [
      {
        value: 'claude-code',
        label: 'Claude Code',
        where: t('在终端里运行一次即可。'),
        language: 'bash',
        snippet: `claude mcp add --transport http tailchat ${endpoint} \\
  --header "Authorization: Bearer ${KEY_PLACEHOLDER}"`,
      },
      {
        value: 'claude-desktop',
        label: 'Claude Desktop',
        where: t(
          'Claude Desktop 通过界面添加远程连接器: 设置 -> 连接器 -> 添加自定义连接器, 填入下面的网址, 并把令牌填进 Authorization 请求头。'
        ),
        language: 'url',
        snippet: endpoint,
      },
      {
        value: 'cursor',
        label: 'Cursor',
        where: (
          <>
            {t('写入项目内的')}{' '}
            <code className="font-mono text-xs">.cursor/mcp.json</code>
            {t(', 或用户级的')}{' '}
            <code className="font-mono text-xs">~/.cursor/mcp.json</code>。
          </>
        ),
        language: 'json',
        snippet: remoteJson,
      },
      {
        value: 'other',
        label: t('其它客户端'),
        where: t(
          '支持远程 MCP 的客户端基本都是这一种写法: 一个网址加一个请求头。不支持的话, 用下面的本地方式。'
        ),
        language: 'json',
        snippet: remoteJson,
      },
    ];
  }, [endpoint]);

  const local: Recipe[] = useMemo(() => {
    const stdioJson = JSON.stringify(
      {
        mcpServers: {
          tailchat: {
            command: 'node',
            args: [ENTRY],
            env: {
              TAILCHAT_URL: origin,
              TAILCHAT_API_KEY: KEY_PLACEHOLDER,
            },
          },
        },
      },
      null,
      2
    );

    return [
      {
        value: 'claude-code',
        label: 'Claude Code',
        where: t('在终端里运行一次即可, 无需手动编辑配置文件。'),
        language: 'bash',
        snippet: `claude mcp add tailchat \\
  -e TAILCHAT_URL=${origin} \\
  -e TAILCHAT_API_KEY=${KEY_PLACEHOLDER} \\
  -- node ${ENTRY}`,
      },
      {
        value: 'claude-desktop',
        label: 'Claude Desktop',
        where: (
          <>
            {t('写入配置文件, 保存后重启 Claude Desktop:')}{' '}
            <code className="font-mono text-xs">
              %APPDATA%\Claude\claude_desktop_config.json
            </code>{' '}
            {t('(Windows) 或')}{' '}
            <code className="font-mono text-xs">
              ~/Library/Application Support/Claude/claude_desktop_config.json
            </code>{' '}
            (macOS)
          </>
        ),
        language: 'json',
        snippet: stdioJson,
      },
      {
        value: 'codex',
        label: 'Codex CLI (OpenAI)',
        where: (
          <>
            {t('写入')}{' '}
            <code className="font-mono text-xs">~/.codex/config.toml</code>
            {t(', Codex 启动时读取。')}
          </>
        ),
        language: 'toml',
        snippet: `[mcp_servers.tailchat]
command = "node"
args = ["${ENTRY}"]
env = { TAILCHAT_URL = "${origin}", TAILCHAT_API_KEY = "${KEY_PLACEHOLDER}" }`,
      },
      {
        value: 'other',
        label: t('其它客户端'),
        where: t(
          '大多数客户端都用同一种 stdio 形式: 一个命令、若干参数、几个环境变量。'
        ),
        language: 'json',
        snippet: stdioJson,
      },
    ];
  }, [origin]);

  return (
    <SettingsPage
      title={t('MCP 接入')}
      description={t(
        'MCP 让 AI 助手直接读写这里的群组、频道和消息。它以你的身份调用接口, 权限不会超过你本人。'
      )}
    >
      <SettingsSection
        title={t('托管端点(推荐)')}
        description={t(
          '这台服务器自己跑了一个 MCP 服务, 客户端只需要一个网址和你的令牌 —— 不用克隆仓库, 不用构建, 也不用装 Node。'
        )}
      >
        <div className="space-y-4">
          <CodeBlock label={t('端点地址')} caption="endpoint" code={endpoint} />
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-6">
            <li>
              {t(
                '在「API 密钥」里创建一个令牌, 勾选这个助手真正需要的作用域。令牌只显示一次。'
              )}
            </li>
            <li>{t('把下面对应客户端的配置粘贴过去, 然后重启客户端。')}</li>
          </ol>
          <RecipeTabs recipes={hosted} labelPrefix={t('托管')} />
        </div>
      </SettingsSection>

      <SettingsSection
        title={t('本地运行(兜底)')}
        description={t(
          '客户端还不支持远程 MCP 时用这种方式: 在自己机器上跑 stdio 版本, 需要仓库和一次构建。'
        )}
      >
        <div className="space-y-4">
          <CodeBlock
            label={t('构建命令')}
            caption="bash"
            code="pnpm --dir apps/tailchat-mcp build"
          />
          <p className="text-sm leading-6 text-muted-foreground">
            {t('把')}{' '}
            <code className="font-mono text-xs">{REPO_PLACEHOLDER}</code>{' '}
            {t('换成仓库所在目录,')}{' '}
            <code className="font-mono text-xs">{KEY_PLACEHOLDER}</code>{' '}
            {t('换成你刚创建的令牌。')}
          </p>
          <RecipeTabs recipes={local} labelPrefix={t('本地')} />
        </div>
      </SettingsSection>

      <SettingsSection
        title={t('安全')}
        description={t('令牌就是身份, 配置文件要当作密码来对待。')}
      >
        <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
          <li>
            {t(
              '这些配置文件里是明文令牌。谁能读到它, 谁就能以你的身份发消息。'
            )}
          </li>
          <li>
            {t(
              '托管端点不保存任何令牌: 每个请求各自带着令牌来, 用完即弃, 服务端不留会话。'
            )}
          </li>
          <li>
            {t(
              '每个助手用各自的令牌, 只勾选够用的作用域; 不用了就在「API 密钥」里吊销, 立即生效。'
            )}
          </li>
          <li>
            {t(
              '令牌不能创建或吊销令牌, 也拿不到超出你本人的权限。admin 作用域只发给服务器管理员。'
            )}
          </li>
          <li>
            {t('尽量不要把令牌直接敲在命令行里, 它会留在 shell 历史里。')}
          </li>
        </ul>
      </SettingsSection>
    </SettingsPage>
  );
});
SettingsMcpSetup.displayName = 'SettingsMcpSetup';
