import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

/**
 * Runs `loader(signal)` on mount and whenever `deps` change.
 * Returns { data, loading, error, status, reload }; `status` is the HTTP status of a failed request.
 * In-flight requests are cancelled on unmount.
 */
export default function useFetch(loader, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null, status: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
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
