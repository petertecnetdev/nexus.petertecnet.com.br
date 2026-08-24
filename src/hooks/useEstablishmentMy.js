// src/hooks/useEstablishmentMy.js
import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { apiBaseUrl } from "../config";

export default function useEstablishmentMy(appId) {
  const [establishments, setEstablishments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    if (!appId) {
      setIsLoading(false);
      return;
    }

    const fetchEstablishments = async () => {
      try {
        setIsLoading(true);
        setApiError(null);

        const token = localStorage.getItem("token");

        const { data } = await axios.post(
          `${apiBaseUrl}/establishment/my/app`,
          { app_id: appId },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setEstablishments(Array.isArray(data.establishments) ? data.establishments : []);
      } catch (error) {
        const message =
          error?.response?.data?.error ||
          "Erro ao carregar seus estabelecimentos.";

        setApiError(message);

        Swal.fire({
          icon: "error",
          title: "Erro",
          text: message,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEstablishments();
  }, [appId]);

  return {
    establishments,
    isLoading,
    apiError,
  };
}
