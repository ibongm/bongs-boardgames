import { createContext, useContext, useEffect, useState } from 'react';
import { defaultSite } from '../lib/defaults.js';
import { firebaseReady } from '../lib/firebase.js';
import { watchSite } from '../services/site.js';

const SiteContext = createContext(defaultSite);

export function SiteProvider({ children }) {
  const [site, setSite] = useState(defaultSite);
  useEffect(() => {
    if (!firebaseReady) return undefined;
    return watchSite(setSite);
  }, []);
  return <SiteContext.Provider value={site}>{children}</SiteContext.Provider>;
}

export function useSite() {
  return useContext(SiteContext);
}
