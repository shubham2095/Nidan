import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { useSite } from '../../context/SiteContext.jsx';
import { truncate } from '../../utils/format.js';

/** Per-page title, description, canonical URL, Open Graph / Twitter tags and optional JSON-LD. */
export default function Seo({ title, description, image, type = 'website', noindex = false, jsonLd }) {
  const { clinic, settings } = useSite();
  const { pathname } = useLocation();

  const siteName = clinic.name;
  const fullTitle = title ? `${title} | ${siteName}` : settings.seo?.siteTitle || siteName;
  const summary = truncate(description || settings.seo?.siteDescription || clinic.tagline);
  const url = `${window.location.origin}${pathname === '/' ? '' : pathname.replace(/\/+$/, '')}`;
  const imageUrl = image ? new URL(image, window.location.origin).href : null;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={summary} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:site_name" content={siteName} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={summary} />
      <meta property="og:url" content={url} />
      <meta property="og:locale" content="en_IN" />
      {imageUrl && <meta property="og:image" content={imageUrl} />}

      <meta name="twitter:card" content={imageUrl ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={summary} />
      {imageUrl && <meta name="twitter:image" content={imageUrl} />}

      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
}
