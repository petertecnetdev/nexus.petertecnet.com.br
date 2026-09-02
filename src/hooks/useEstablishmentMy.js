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

  const directoryBase = appId
    ? `/v1/apps/${encodeURIComponent(appId)}/directory`
    : null;

  const fetchEstablishments = useCallback(async (signal) => {
    if (!directoryBase) {
      setEstablishments([]);
      setApiError("Aplicação não identificada.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setApiError(null);

      const { data } = await api.get(`${directoryBase}/companies`, {
        ...(signal ? { signal } : {}),
      });

      setEstablishments(Array.isArray(data?.companies) ? data.companies : []);
    } catch (error) {
      if (error?.code === "ERR_CANCELED") return;
      setEstablishments([]);
      setApiError(getApiMessage(error, "Erro ao carregar as empresas do seu ecossistema."));
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [directoryBase]);

  useEffect(() => {
    const controller = new AbortController();
    fetchEstablishments(controller.signal);
    return () => controller.abort();
  }, [fetchEstablishments]);

  const activateCatalog = useCallback(async (sourceId) => {
    if (!directoryBase) throw new Error("Aplicação não identificada.");
    const { data } = await api.post(
      `${directoryBase}/companies/${encodeURIComponent(sourceId)}/activate`
    );
    await fetchEstablishments();
    return data?.establishment || null;
  }, [directoryBase, fetchEstablishments]);

  const removeEstablishment = useCallback(async (id) => {
    await api.delete(`/establishment/${encodeURIComponent(id)}`, {
      params: { app_id: appId },
      data: { app_id: appId },
    });
    await fetchEstablishments();
  }, [appId, fetchEstablishments]);

  const refresh = useCallback(() => fetchEstablishments(), [fetchEstablishments]);

  return {
    establishments,
    isLoading,
    apiError,
    activateCatalog,
    removeEstablishment,
    refresh,
  };
}
