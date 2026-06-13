import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useFetchData } from './useFetchData';

describe('useFetchData', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('returns loading initially', () => {
    const fetcher = vi.fn(() => new Promise<never>(() => {}));
    const { result } = renderHook(() => useFetchData(fetcher, []));
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('');
  });

  it('returns data on success', async () => {
    const fetcher = vi.fn().mockResolvedValue({ data: [1, 2, 3], error: null });
    const { result } = renderHook(() => useFetchData(fetcher, []));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual([1, 2, 3]);
    expect(result.current.error).toBe('');
  });

  it('sets error string from result.error', async () => {
    const fetcher = vi.fn().mockResolvedValue({ data: null, error: 'Something went wrong' });
    const { result } = renderHook(() => useFetchData(fetcher, []));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('Something went wrong');
  });

  it('handles object error by rendering default message', async () => {
    const fetcher = vi.fn().mockResolvedValue({ data: null, error: { message: 'nope' } });
    const { result } = renderHook(() => useFetchData(fetcher, []));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('An error occurred');
  });

  it('handles promise rejection', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useFetchData(fetcher, []));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('Network error');
  });

  it('handles non-Error rejection', async () => {
    const fetcher = vi.fn().mockRejectedValue('string error');
    const { result } = renderHook(() => useFetchData(fetcher, []));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('An unexpected error occurred');
  });

  it('re-fetches when deps change', async () => {
    const fetchFn = vi.fn()
      .mockResolvedValueOnce({ data: 'first', error: null })
      .mockResolvedValueOnce({ data: 'second', error: null });

    const { result, rerender } = renderHook(
      ({ id }: { id: number }) => useFetchData(() => fetchFn(id), [id]),
      { initialProps: { id: 1 } },
    );

    await waitFor(() => expect(result.current.data).toBe('first'));

    rerender({ id: 2 });

    await waitFor(() => expect(result.current.data).toBe('second'));
  });

  it('refetch returns new data without changing loading', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce({ data: 'old', error: null })
      .mockResolvedValueOnce({ data: 'new', error: null });

    const { result } = renderHook(() => useFetchData(fetcher, []));

    await waitFor(() => expect(result.current.data).toBe('old'));
    expect(result.current.loading).toBe(false);

    act(() => {
      result.current.refetch();
    });

    expect(result.current.loading).toBe(false);
    await waitFor(() => expect(result.current.data).toBe('new'));
  });

  it('refetch returns error from result.error', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce({ data: 'initial', error: null })
      .mockResolvedValueOnce({ data: null, error: 'Refetch error' });

    const { result } = renderHook(() => useFetchData(fetcher, []));

    await waitFor(() => expect(result.current.data).toBe('initial'));

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => expect(result.current.error).toBe('Refetch error'));
  });

  it('refetch handles rejection', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce({ data: 'initial', error: null })
      .mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useFetchData(fetcher, []));

    await waitFor(() => expect(result.current.data).toBe('initial'));

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => expect(result.current.error).toBe('Network error'));
  });

  it('ignores stale rejection when deps change mid-flight', async () => {
    let rejectSlow!: (e: Error) => void;
    const slowPromise = new Promise<{ data: string; error: null }>((_, reject) => {
      rejectSlow = reject;
    });
    const slowFetcher = vi.fn().mockReturnValue(slowPromise);
    const fastFetcher = vi.fn().mockResolvedValue({ data: 'fast', error: null });

    const fetchFn = vi.fn();
    fetchFn.mockImplementation(slowFetcher);

    const { result, rerender } = renderHook(
      ({ id }: { id: number }) => useFetchData(() => fetchFn(id), [id]),
      { initialProps: { id: 1 } },
    );

    await vi.waitFor(() => { expect(fetchFn).toHaveBeenCalledOnce(); });

    fetchFn.mockImplementation(fastFetcher);
    rerender({ id: 2 });

    await waitFor(() => expect(result.current.data).toBe('fast'));

    rejectSlow!(new Error('Stale error'));

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(result.current.error).toBe('');
  });

  it('ignores stale refetch when superseded by another refetch', async () => {
    let resolveFirst!: (v: { data: string; error: null }) => void;
    const firstPromise = new Promise<{ data: string; error: null }>((resolve) => {
      resolveFirst = resolve;
    });
    const fetcher = vi.fn()
      .mockReturnValueOnce(firstPromise)
      .mockReturnValueOnce(firstPromise)
      .mockResolvedValueOnce({ data: 'second', error: null });

    const { result } = renderHook(() => useFetchData(fetcher, []));

    await vi.waitFor(() => { expect(fetcher).toHaveBeenCalledOnce(); });

    act(() => { result.current.refetch(); });
    act(() => { result.current.refetch(); });

    await waitFor(() => expect(result.current.data).toBe('second'));

    resolveFirst!({ data: 'first', error: null });

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(result.current.data).toBe('second');
  });

  it('ignores stale responses when deps change mid-flight', async () => {
    let resolveSlow!: (v: { data: string; error: null }) => void;
    const slowPromise = new Promise<{ data: string; error: null }>((resolve) => {
      resolveSlow = resolve;
    });
    const slowFetcher = vi.fn().mockReturnValue(slowPromise);
    const fastFetcher = vi.fn().mockResolvedValue({ data: 'fast', error: null });

    const fetchFn = vi.fn();
    fetchFn.mockImplementation(slowFetcher);

    const { result, rerender } = renderHook(
      ({ id }: { id: number }) => useFetchData(() => fetchFn(id), [id]),
      { initialProps: { id: 1 } },
    );

    await vi.waitFor(() => { expect(fetchFn).toHaveBeenCalledOnce(); });

    fetchFn.mockImplementation(fastFetcher);
    rerender({ id: 2 });

    await waitFor(() => expect(result.current.data).toBe('fast'));

    resolveSlow!({ data: 'slow', error: null });

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(result.current.data).toBe('fast');
  });
});
