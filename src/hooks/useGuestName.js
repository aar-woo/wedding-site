import { useEffect } from 'react';
import { useSearchParams } from 'react-router';

function useGuestName() {
  const [searchParams] = useSearchParams();

  const raw = searchParams.get('to');
  const trimmed = raw ? raw.trim() : '';
  const hasName = trimmed.length > 0;
  const name = hasName ? trimmed : 'Our Beloved Guests';

  useEffect(() => {
    if (hasName) {
      document.title = `Save the Date – For ${trimmed}`;
    }
  }, [hasName, trimmed]);

  return { name, hasName };
}

export default useGuestName;
