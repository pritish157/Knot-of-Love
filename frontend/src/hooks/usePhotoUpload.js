import { useState } from "react";
import { apiRequest } from "../services/http";
import { useAuth } from "./useAuth";
import { useToast } from "./useToast";

export function usePhotoUpload() {
  const { updateUser } = useAuth();
  const { showToast } = useToast();
  const [uploading, setUploading] = useState(false);

  async function uploadPhoto(file) {
    if (!file) {
      showToast("Select a photo first.");
      return null;
    }
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append("image", file);
      const data = await apiRequest("/api/auth/upload-photo", { method: "POST", body: fd });
      if (data.user) {
        updateUser(data.user);
      }
      showToast("Profile photo updated successfully!", "success");
      return data.user;
    } catch (err) {
      showToast(err.message || "Failed to upload photo.");
      throw err;
    } finally {
      setUploading(false);
    }
  }

  return { uploadPhoto, uploading };
}
