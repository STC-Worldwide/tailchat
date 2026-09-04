/**
 * Whether the server permits a web panel to embed this URL.
 *
 * A web panel points an iframe at whatever URL its creator typed. Deciding
 * that in the browser would mean the client is the authority on what the
 * client may load, so the allowlist is served as part of the global config and
 * only read here.
 *
 * The list holds origins. An entry may be written with or without a scheme
 * (`https://docs.example.com` or `docs.example.com`) because that is how
 * people write them down; both compare against the URL's own origin. A single
 * `*` allows everything, which is upstream's behaviour.
 *
 * An empty list allows nothing. That is the point — a deployment that has not
 * said which origins are acceptable has not authorised any.
 */
export function isOriginAllowed(
  url: string,
  allowlist: string[] | undefined
): boolean {
  const list = (allowlist ?? []).filter((entry) => entry.trim().length > 0);

  // Scheme is checked before `*`: a `javascript:` src runs in the embedding
  // page's context, so "allow everything" must still not mean "allow that".
  const origin = originOf(url);
  if (origin === null) {
    return false;
  }

  if (list.includes('*')) {
    return true;
  }

  return list.some((entry) => {
    const allowed = originOf(entry) ?? originOf(`https://${entry.trim()}`);

    return allowed !== null && allowed === origin;
  });
}

/**
 * The origin of a URL, lowercased, or null when it is not one we can embed.
 *
 * Only http and https: a `javascript:` or `data:` panel URL would otherwise
 * have no origin to compare and must never be treated as allowed.
 */
function originOf(value: string): string | null {
  try {
    const parsed = new URL(value.trim());

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }

    return parsed.origin.toLowerCase();
  } catch (err) {
    return null;
  }
}
