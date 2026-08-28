// src/hooks/useEstablishmentMy.js
import { useEffect, useState } from "react";
import api from "../services/api";

const getApiMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  fallback;

export default function useEstablishmentMy(appId) {
  const [establishments, setEstablishments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    if (!appId) {
      setEstablishments([]);
      setApiError("Aplicação não identificada.");
      setIsLoading(false);
      return undefined;
    }

    const controller = new AbortController();

    const fetchEstablishments = async () => {
      try {
        setIsLoading(true);
        setApiError(null);

        const { data } = await api.post(
          "/establishment/my/app",
          { app_id: appId },
          { signal: controller.signal }
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
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    fetchEstablishments();
    return () => controller.abort();
  }, [appId]);

  return {
    establishments,
    isLoading,
    apiError,
  };
}
