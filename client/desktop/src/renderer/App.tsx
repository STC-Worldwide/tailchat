import icon from '../../assets/icon.svg';
import { ServerItem } from './ServerItem';
import React, { useState } from 'react';
import { ExternalLinkIcon, LogOutIcon, Trash2Icon } from 'lucide-react';
import { defaultServerList, useServerStore } from './store/server';
import { AddServerItem } from './AddServerItem';
import { Button } from './components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from './components/ui/context-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './components/ui/dialog';
import './App.css';

const Hello: React.FC = React.memo(() => {
  const { serverList, removeServer } = useServerStore();
  const [pendingRemoval, setPendingRemoval] = useState<{
    name?: string;
    url: string;
  } | null>(null);
  const servers = [...defaultServerList, ...serverList];

  return (
    <main className="launcher-shell">
      <header className="launcher-header">
        <div className="launcher-brand">
          <span className="launcher-brand-mark" aria-hidden="true">
            <img src={icon} className="size-7" alt="" />
          </span>
          <span>
            Anchor Chat
            <span className="launcher-byline">by STC Worldwide</span>
          </span>
        </div>
        <h1 className="launcher-title">Choose a server</h1>
        <p className="launcher-description">
          Select an Anchor Chat deployment to open, or connect another server.
        </p>
      </header>

      <section className="server-list" aria-label="Available servers">
        {servers.map((serverInfo, index) => {
          const isDefault = index < defaultServerList.length;
          return (
            <ContextMenu key={serverInfo.url}>
              <ContextMenuTrigger className="block w-full">
                <ServerItem
                  icon={serverInfo.icon ?? icon}
                  version={serverInfo.version}
                  status={isDefault ? 'Default' : undefined}
                  onClick={() => {
                    window.electron?.ipcRenderer.sendMessage('selectServer', {
                      url: serverInfo.url,
                    });
                  }}
                >
                  {serverInfo.name === 'Tailchat'
                    ? 'Anchor Chat'
                    : serverInfo.name}
                </ServerItem>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem
                  variant="destructive"
                  disabled={isDefault}
                  onClick={() => setPendingRemoval(serverInfo)}
                >
                  <Trash2Icon />
                  Delete server
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          );
        })}

        <AddServerItem />
      </section>

      <footer className="launcher-actions">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            window.open('https://stc-worldwide.com/');
          }}
        >
          <ExternalLinkIcon />
          Website
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            window.electron?.ipcRenderer.sendMessage('close');
          }}
        >
          <LogOutIcon />
          Exit
        </Button>
      </footer>

      <Dialog
        open={Boolean(pendingRemoval)}
        onOpenChange={(open) => {
          if (!open) setPendingRemoval(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this server?</DialogTitle>
            <DialogDescription>
              {pendingRemoval?.name ?? 'This server'} will be removed from this
              device. You can add it again later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingRemoval(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (pendingRemoval) removeServer(pendingRemoval.url);
                setPendingRemoval(null);
              }}
            >
              Delete server
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
});
Hello.displayName = 'Hello';

export default function App() {
  return <Hello />;
}
