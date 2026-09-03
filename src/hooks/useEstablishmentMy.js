// src/hooks/useEstablishmentMy.js
import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import { apiV1BaseUrl } from "../config";

const getApiMessage = (error, fallback) => error?.response?.data?.message || error?.response?.data?.error || fallback;

export default function useEstablishmentMy() {
  const [establishments, setEstablishments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  const fetchEstablishments = useCallback(async (signal) => {
    try {
      setIsLoading(true);
      setApiError(null);
      const { data } = await api.get(`${apiV1BaseUrl}/directory/companies`, { ...(signal ? { signal } : {}) });
      setEstablishments(Array.isArray(data?.companies) ? data.companies : []);
    } catch (error) {
      if (error?.code === "ERR_CANCELED") return;
      setEstablishments([]);
      setApiError(getApiMessage(error, "Erro ao carregar as empresas do seu ecossistema."));
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => { const controller = new AbortController(); fetchEstablishments(controller.signal); return () => controller.abort(); }, [fetchEstablishments]);

  const activateCatalog = useCallback(async (sourceId) => {
    const { data } = await api.post(`${apiV1BaseUrl}/directory/companies/${encodeURIComponent(sourceId)}/activate`);
    await fetchEstablishments();
    return data?.establishment || null;
  }, [fetchEstablishments]);

  const deactivateCatalog = useCallback(async (sourceId) => {
    await api.delete(`${apiV1BaseUrl}/directory/companies/${encodeURIComponent(sourceId)}/activate`);
    await fetchEstablishments();
  }, [fetchEstablishments]);

  const removeEstablishment = useCallback(async (id) => {
    await api.delete(`${apiV1BaseUrl}/establishments/${encodeURIComponent(id)}`);
    await fetchEstablishments();
  }, [fetchEstablishments]);

  return { establishments, isLoading, apiError, activateCatalog, deactivateCatalog, removeEstablishment, refresh: () => fetchEstablishments() };
}
