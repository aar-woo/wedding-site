import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { decodeGuestToken } from '../lib/decodeGuestToken.js';
import { fetchGuestDisplayName } from '../lib/fetchGuestDisplayName.js';

function useGuestName() {
  const [searchParams] = useSearchParams();

  // Synchronous resolution — instant render with cached token data
  let tokenName = 'Our Beloved Guests';
  let hasName = false;
  let tokenId = null;

  // Step 1: Try ?t= token (signed, production links)
  const t = searchParams.get('t');
  if (t) {
    const decoded = decodeGuestToken(t);
    if (decoded && decoded.name) {
      tokenName = decoded.name;
      tokenId = decoded.id;
      hasName = true;
    }
  }

  // Step 2: Fall back to legacy ?to= dev/preview shortcut (D-04)
  // Legacy path: no tokenId -> no DB fetch
  if (!hasName) {
    const raw = searchParams.get('to');
    const trimmed = raw ? raw.trim() : '';
    if (trimmed.length > 0) {
      tokenName = trimmed;
      hasName = true;
    }
  }

  // Step 3: If still !hasName, leave tokenName = 'Our Beloved Guests' (D-03 wording)

  // DB override state — tracks { id, displayName } so we can validate against current tokenId
  // Starts null so tokenName renders instantly
  const [dbOverride, setDbOverride] = useState(null);

  // The resolved DB name is only valid if it was fetched for the current tokenId
  const dbName = dbOverride && dbOverride.id === tokenId ? dbOverride.displayName : null;

  // The resolved name: DB authoritative once loaded, token name until then
  const name = dbName ?? tokenName;

  // Fetch DB displayName when we have a tokenId (abort-safe, stale-response-safe)
  useEffect(() => {
    // Legacy ?to= / no-token paths: no fetch (req #5/#6)
    if (!tokenId) return;

    const controller = new AbortController();
    let active = true;

    fetchGuestDisplayName(tokenId, { signal: controller.signal })
      .then((displayName) => {
        // Ignore if unmounted or tokenId has changed (stale response guard)
        if (active && displayName) {
          setDbOverride({ id: tokenId, displayName });
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [tokenId]);

  // Set document.title when a real name resolves (D-03)
  // Follows token name initially, then DB name once loaded
  useEffect(() => {
    if (hasName) {
      document.title = `Save the Date – For ${name}`;
    }
  }, [hasName, name]);

  // Return shape is backward compatible — GuestGreeting only reads `name`
  // `resolved` is additive and optional
  return { name, hasName, resolved: dbName !== null };
}

export default useGuestName;
