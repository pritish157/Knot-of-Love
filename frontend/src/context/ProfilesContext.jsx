import { createContext, useCallback, useState, useMemo } from "react";
import { fetchProfilesRequest } from "../services/profiles";
import { defaultFilters } from "../utils/constants";

export const ProfilesContext = createContext(null);

export function ProfilesProvider({ children }) {
  const [profiles, setProfiles] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDemoData, setIsDemoData] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);

  const refreshProfiles = useCallback(async (nextFilters = filters) => {
    setLoading(true);
    setError("");
    setIsDemoData(false);

    try {
      const result = await fetchProfilesRequest(nextFilters);
      setProfiles(result.profiles);
      setIsDemoData(result.isDemo);
      setFilters(nextFilters);
    } catch (requestError) {
      setError(requestError.message || "Unable to load profiles right now.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const value = useMemo(() => ({
    profiles,
    filters,
    loading,
    error,
    isDemoData,
    selectedProfile,
    setSelectedProfile,
    setFilters,
    refreshProfiles
  }), [profiles, filters, loading, error, isDemoData, selectedProfile, refreshProfiles]);

  return (
    <ProfilesContext.Provider value={value}>
      {children}
    </ProfilesContext.Provider>
  );
}
