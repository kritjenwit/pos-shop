import { useState, useEffect, useRef, useCallback } from 'react';

export interface FetchDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string;
  refetch: () => void;
}

export function useFetchData<T>(
  fetcher: () => Promise<{ data: T | null; error: string | null }>,
  deps: React.DependencyList,
): FetchDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const latestToken = useRef(0);
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    const token = ++latestToken.current;
    setLoading(true);
    setError('');

    fetcherRef.current()
      .then((result) => {
        if (token !== latestToken.current) return;
        if (result.error) {
          const msg = typeof result.error === 'string' ? result.error : 'An error occurred';
          setError(msg);
          console.error('Fetch error:', result.error);
        } else {
          setData(result.data);
        }
        setLoading(false);
      })
      .catch((e) => {
        if (token !== latestToken.current) return;
        const msg = e instanceof Error ? e.message : 'An unexpected error occurred';
        setError(msg);
        console.error('Fetch error:', e);
        setLoading(false);
      });
  }, deps);

  const refetch = useCallback(() => {
    const token = ++latestToken.current;
    fetcherRef.current()
      .then((result) => {
        if (token !== latestToken.current) return;
        if (result.error) {
          const msg = typeof result.error === 'string' ? result.error : 'An error occurred';
          setError(msg);
          console.error('Fetch error:', result.error);
        } else {
          setData(result.data);
        }
        setLoading(false);
      })
      .catch((e) => {
        if (token !== latestToken.current) return;
        const msg = e instanceof Error ? e.message : 'An unexpected error occurred';
        setError(msg);
        console.error('Fetch error:', e);
        setLoading(false);
      });
  }, []);

  return { data, loading, error, refetch };
}
