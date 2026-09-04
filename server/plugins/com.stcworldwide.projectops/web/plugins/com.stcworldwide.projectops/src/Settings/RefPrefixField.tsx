import React, { useEffect, useState } from 'react';
import { Button, Input } from '@capital/component';
import { Translate } from '../translate';
import { formatRef } from '../shared';

/**
 * The project prefix that turns `TS-061` into `861-TS-061`.
 *
 * Saving is explicit rather than on every keystroke: `onChange` writes the
 * group config straight through to the server, and a save per character would
 * be a request per character.
 */
export const RefPrefixField: React.FC<{
  value: any;
  onChange: (value: unknown) => void;
  loading: boolean;
  /** Passed by the host to every group config item; this field has no use for it. */
  groupId?: string;
}> = React.memo(({ value, onChange, loading }) => {
  const saved = typeof value === 'string' ? value : '';
  const [draft, setDraft] = useState(saved);

  // Track the saved value when it changes elsewhere (another tab, a reload).
  useEffect(() => {
    setDraft(saved);
  }, [saved]);

  const trimmed = draft.trim();
  const dirty = trimmed !== saved;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ maxWidth: 140 }}>
        <Input
          value={draft}
          placeholder={Translate.refPrefixPlaceholder}
          onChange={(e: any) => setDraft(e?.target?.value ?? '')}
        />
      </div>
      <code style={{ fontSize: 12, opacity: 0.7 }}>
        {formatRef(trimmed || undefined, 'TS', 61)}
      </code>
      <Button
        size="small"
        type="primary"
        disabled={loading || !dirty}
        onClick={() => onChange(trimmed)}
      >
        {Translate.save}
      </Button>
    </div>
  );
});
RefPrefixField.displayName = 'RefPrefixField';
