import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import api from '../../services/api.js';

// Placeholder shell for Phase 1; replaced by the real home page in Phase 2.
export default function HomePage() {
  const [apiStatus, setApiStatus] = useState('checking');

  useEffect(() => {
    api
      .get('/health')
      .then(({ data }) => setApiStatus(data.database === 'up' ? 'online' : 'database down'))
      .catch(() => setApiStatus('offline'));
  }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
      <Helmet>
        <title>Nidan Mother &amp; Child Care | Noida</title>
      </Helmet>
      <h1 className="text-3xl font-semibold text-teal-700">Nidan Mother &amp; Child Care</h1>
      <p className="text-slate-600">Trusted Healthcare for Mothers and Child in Noida</p>
      <p className="rounded-full bg-pink-50 px-4 py-1 text-sm text-pink-700">
        New website coming soon · API: {apiStatus}
      </p>
    </main>
  );
}
