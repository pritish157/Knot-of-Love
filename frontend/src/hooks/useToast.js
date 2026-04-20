import { useCallback, useRef, useState } from "react";

export function useToast() {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const clearToast = useCallback(() => {
    setToast(null);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const showToast = useCallback((message, type = "error", duration = 5000) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setToast({ message, type });
    timerRef.current = setTimeout(() => {
      setToast(null);
      timerRef.current = null;
    }, duration);
  }, []);

  return {
    toast,
    showToast,
    clearToast
  };
}
