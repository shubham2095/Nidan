import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { takePreloaded } from '../utils/preload.js';

/**
 * Runs `loader(signal)` on mount and whenever `deps` change.
 * Returns { data, loading, error, status, reload }; `status` is the HTTP status of a failed request.
 * In-flight requests are cancelled on unmount.
 *
 * `preload` names an API path (such as '/public/home') whose response the server may already have placed in the page.
 * When it did, that data is used for the first render and the first request is skipped; `reload` and later
 * visits fetch fresh data as usual.
 */
export default function useFetch(loader, deps = [], { preload } = {}) {
  const [state, setState] = useState(() => {
    const early = preload ? takePreloaded(preload) : undefined;
    return early ? { data: early, loading: false, error: null, status: null } : { data: null, loading: true, error: null, status: null };
  });
  const [attempt, setAttempt] = useState(0);
  const haveEarlyData = useRef(Boolean(state.data));

  useEffect(() => {
    if (haveEarlyData.current) {
      haveEarlyData.current = false;
      return undefined;
    }

    const controller = new AbortController();
    setState((previous) => ({ ...previous, loading: true, error: null, status: null }));

    loader(controller.signal)
      .then((data) => setState({ data, loading: false, error: null, status: null }))
      .catch((error) => {
        if (axios.isCancel(error)) return;
        setState({
          data: null,
          loading: false,
          error: error.message || 'Something went wrong',
          status: error.response?.status ?? null,
        });
      });

    return () => controller.abort();
  }, [...deps, attempt]);

  const reload = useCallback(() => setAttempt((count) => count + 1), []);
  return { ...state, reload };
}
