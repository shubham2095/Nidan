import { createContext, useContext, useMemo } from 'react';
import useFetch from '../hooks/useFetch.js';
import { getSite } from '../services/publicService.js';
import { siteDefaults } from '../utils/siteDefaults.js';

const SiteContext = createContext(siteDefaults);

export function SiteProvider({ children }) {
  const { data } = useFetch((signal) => getSite(signal), []);

  const value = useMemo(() => {
    const settings = { ...siteDefaults.settings, ...(data?.settings || {}) };
    const locations = data?.locations || [];
    return {
      settings,
      clinic: { ...siteDefaults.settings.clinic, ...settings.clinic },
      social: settings.social || {},
      locations,
      ownClinics: locations.filter((location) => location.isOwnClinic),
      serviceLinks: data?.services || [],
      ready: Boolean(data),
    };
  }, [data]);

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export const useSite = () => useContext(SiteContext);
