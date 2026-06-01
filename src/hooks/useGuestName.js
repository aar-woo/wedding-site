import { useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { decodeGuestToken } from '../lib/decodeGuestToken.js';

function useGuestName() {
  const [searchParams] = useSearchParams();

  let name = 'Our Beloved Guests';
  let hasName = false;

  // Step 1: Try ?t= token (signed, production links)
  const t = searchParams.get('t');
  if (t) {
    const decoded = decodeGuestToken(t);
    if (decoded && decoded.name) {
      name = decoded.name;
      hasName = true;
    }
  }

  // Step 2: Fall back to legacy ?to= dev/preview shortcut (D-04)
  if (!hasName) {
    const raw = searchParams.get('to');
    const trimmed = raw ? raw.trim() : '';
    if (trimmed.length > 0) {
      name = trimmed;
      hasName = true;
    }
  }

  // Step 3: If still !hasName, leave name = 'Our Beloved Guests' (D-03 wording)

  // Set document.title only when a real name resolves (D-03)
  useEffect(() => {
    if (hasName) {
      document.title = `Save the Date – For ${name}`;
    }
  }, [hasName, name]);

  return { name, hasName };
}

export default useGuestName;
