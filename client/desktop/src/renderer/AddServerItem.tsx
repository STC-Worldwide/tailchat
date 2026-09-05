import React, { FormEvent, useState } from 'react';
import { AlertCircleIcon, LoaderCircleIcon, PlusIcon } from 'lucide-react';
import { ServerItem } from './ServerItem';
import { useServerStore } from './store/server';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './components/ui/dialog';

function getValidServerUrl(value: string): string | null {
  try {
    const parsedUrl = new URL(value.trim());
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return null;
    }
    return parsedUrl.toString();
  } catch {
    return null;
  }
}

export const AddServerItem: React.FC = React.memo(() => {
  const { addServer } = useServerStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleOpenChange = (open: boolean) => {
    if (!isAdding) {
      setIsModalOpen(open);
      setError(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validUrl = getValidServerUrl(url);
    if (!validUrl) {
      setError('Enter a complete HTTP or HTTPS server address.');
      return;
    }

    setError(null);
    setIsAdding(true);
    try {
      await addServer(validUrl);
      setUrl('');
      setIsModalOpen(false);
    } catch {
      setError(
        'We could not connect to that Anchor Chat server. Check the address and try again.'
      );
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <>
      <ServerItem
        icon={<PlusIcon className="size-6" />}
        onClick={() => {
          setIsModalOpen(true);
        }}
      >
        Add Server
      </ServerItem>

      <Dialog
        open={isModalOpen}
        onOpenChange={handleOpenChange}
      >
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Add an Anchor Chat server</DialogTitle>
              <DialogDescription>
                Connect this app to another Anchor Chat deployment.
              </DialogDescription>
            </DialogHeader>

            <div className="my-5">
              <label className="field-label" htmlFor="server-url">
                Server address
              </label>
              <Input
                id="server-url"
                type="url"
                autoComplete="url"
                autoFocus
                value={url}
                placeholder="https://chat.example.com"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'server-url-error' : 'server-url-help'}
                onChange={(event) => {
                  setUrl(event.target.value);
                  if (error) setError(null);
                }}
              />
              <p className="field-help" id="server-url-help">
                Anchor Chat will verify the deployment before adding it.
              </p>
            </div>

            {error && (
              <div className="form-alert mb-5" id="server-url-error" role="alert">
                <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isAdding}
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isAdding || !url.trim()}>
                {isAdding && (
                  <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
                )}
                {isAdding ? 'Adding…' : 'Add server'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
});
AddServerItem.displayName = 'AddServerItem';
