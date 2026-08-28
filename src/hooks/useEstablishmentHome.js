// src/hooks/useEstablishmentHome.js
import { useEffect, useState } from "react";
import axios from "axios";

const getFileUrlByType = (files, type) =>
  Array.isArray(files) ? files.find((file) => file.type === type)?.public_url ?? null : null;

export default function useEstablishmentHome(apiBaseUrl, appId) {
  const [establishments, setEstablishments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadEstablishments() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await axios.get(`${apiBaseUrl}/establishment/home/${appId}`);
        if (!active) return;

        const mappedEstablishments = (response.data?.establishments || []).map(
          (establishment) => ({
            ...establishment,
            type: "establishment",
            name: establishment.fantasy || establishment.name,
            image:
              getFileUrlByType(establishment.files, "logo") ||
              getFileUrlByType(establishment.files, "background") ||
              null,
            images: {
              logo: getFileUrlByType(establishment.files, "logo"),
              background: getFileUrlByType(establishment.files, "background"),
            },
          })
        );

        setEstablishments(mappedEstablishments);
      } catch (requestError) {
        if (!active) return;
        const message =
          typeof requestError?.response?.data?.message === "string"
            ? requestError.response.data.message
            : "Não foi possível carregar os catálogos.";
        setError(message);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    if (appId) {
      loadEstablishments();
    } else {
      setError("appId não configurado.");
      setIsLoading(false);
    }

    return () => {
      active = false;
    };
  }, [apiBaseUrl, appId]);

  return { establishments, isLoading, error };
}
