import { useContext } from "react";
import { ProfilesContext } from "../context/ProfilesContext";

export function useProfiles() {
  return useContext(ProfilesContext);
}
