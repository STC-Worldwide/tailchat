// Tool results are JSON text. A chat history or a big group listing can be far larger
// than a model should be handed, so results are capped — and a cap must never be
// silent: a truncated list says so, stays valid JSON, and tells the caller how to narrow.

export const DEFAULT_MAX_BYTES = 24_000;

function bytes(text: string): number {
  return Buffer.byteLength(text, 'utf8');
}

export function renderResult(
  value: unknown,
  maxBytes = DEFAULT_MAX_BYTES
): string {
  const whole = JSON.stringify(value, null, 2) ?? 'null';
  if (bytes(whole) <= maxBytes) return whole;

  if (Array.isArray(value)) {
    return renderResult({ items: value }, maxBytes);
  }

  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    // trim the largest array field until the whole thing fits
    const [field] =
      Object.entries(obj)
        .filter(([, v]) => Array.isArray(v))
        .sort(
          ([, a], [, b]) => (b as unknown[]).length - (a as unknown[]).length
        )[0] ?? [];
    if (field) {
      const all = obj[field] as unknown[];
      let keep = all.length;
      while (keep > 0) {
        keep = Math.max(0, Math.floor(keep * 0.7) - 1);
        const trimmed = {
          ...obj,
          [field]: all.slice(0, keep),
          _truncated: {
            field,
            returned: keep,
            of: all.length,
            note: `"${field}" was cut to fit the result budget; narrow the request (a smaller page, a search, a single id) to see the rest`,
          },
        };
        const text = JSON.stringify(trimmed, null, 2);
        if (bytes(text) <= maxBytes) return text;
      }
    }
  }

  const head = whole.slice(0, Math.max(0, maxBytes - 80));
  return `${head}\n... TRUNCATED at ${maxBytes} bytes (no longer valid JSON) — narrow the request`;
}
