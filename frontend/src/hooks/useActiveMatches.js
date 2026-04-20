import { useEffect, useState } from "react";
import { apiRequest } from "../services/http";
import { useToast } from "./useToast";

export function useActiveMatches() {
  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchMatches() {
    try {
      setLoadingMatches(true);
      const data = await apiRequest("/api/matches/active");
      setMatches(data.matches || []);
    } catch (err) {
      showToast(err.message || "Failed to load matches", "error");
      setMatches([]);
    } finally {
      setLoadingMatches(false);
    }
  }

  return { matches, loadingMatches, refreshMatches: fetchMatches };
}
