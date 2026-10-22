import { useEffect, useState } from 'react';
import { getDoctors, getSite } from '../services/publicService.js';

let cache = null;

/**
 * Doctors (with the locations they work at) and all locations, for filter and booking dropdowns.
 * Loaded once per page visit and shared. Returns { loading, error, doctors, locations }.
 */
export default function useClinicOptions() {
  const [state, setState] = useState(cache || { loading: true, error: null, doctors: [], locations: [] });

  useEffect(() => {
    if (cache) return undefined;
    let active = true;
    Promise.all([getDoctors(), getSite()])
      .then(([doctorData, site]) => {
        cache = { loading: false, error: null, doctors: doctorData.items, locations: site.locations };
        if (active) setState(cache);
      })
      .catch((error) => active && setState({ loading: false, error: error.message, doctors: [], locations: [] }));
    return () => {
      active = false;
    };
  }, []);

  return state;
}
