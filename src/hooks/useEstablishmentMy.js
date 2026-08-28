// src/hooks/useEstablishmentMy.js
import { useCallback, useEffect, useState } from "react";
import api from "../services/api";

const getApiMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  fallback;

export default function useEstablishmentMy(appId) {
  const [establishments, setEstablishments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  const fetchEstablishments = useCallback(async (signal) => {
    if (!appId) {
      setEstablishments([]);
      setApiError("Aplicação não identificada.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setApiError(null);

      const { data } = await api.post(
        "/establishment/my/app",
        { app_id: appId },
        signal ? { signal } : undefined
      );

      const list = Array.isArray(data?.establishments) ? data.establishments : [];
      setEstablishments(
        list.filter((establishment) =>
          establishment?.app_id == null || Number(establishment.app_id) === Number(appId)
        )
      );
    } catch (error) {
      if (error?.code === "ERR_CANCELED") return;
      setEstablishments([]);
      setApiError(getApiMessage(error, "Erro ao carregar suas empresas."));
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [appId]);

  useEffect(() => {
    const controller = new AbortController();
    fetchEstablishments(controller.signal);
    return () => controller.abort();
  }, [fetchEstablishments]);

  const removeEstablishment = useCallback(async (id) => {
    await api.delete(`/establishment/${encodeURIComponent(id)}`, {
      params: { app_id: appId },
      data: { app_id: appId },
    });
    setEstablishments((current) => current.filter((item) => Number(item.id) !== Number(id)));
  }, [appId]);

  const refresh = useCallback(() => fetchEstablishments(), [fetchEstablishments]);

  return {
    establishments,
    isLoading,
    apiError,
    removeEstablishment,
    refresh,
  };
}
