// src/hooks/useEstablishmentHome.js
import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const getFileUrlByType = (files, type) =>
  Array.isArray(files) ? files.find((f) => f.type === type)?.public_url ?? null : null;

export default function useEstablishmentHome(apiBaseUrl, appId) {
  const [establishments, setEstablishments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const city = localStorage.getItem("selectedCity");
  const uf = localStorage.getItem("selectedUF");

  useEffect(() => {
    let active = true;

    async function loadEstablishments() {
      setIsLoading(true);
      setError(null);

      try {
        const query =
          city && uf
            ? `?city=${encodeURIComponent(city)}&uf=${encodeURIComponent(uf)}`
            : "";

        const res = await axios.get(`${apiBaseUrl}/establishment/home/${appId}${query}`);

        if (!active) return;

        const mappedEstablishments = (res.data?.establishments || []).map((est) => ({
          ...est,
          type: "establishment",
          name: est.name,
          image: getFileUrlByType(est.files, "logo") || getFileUrlByType(est.files, "background") || null,
          images: {
            logo: getFileUrlByType(est.files, "logo"),
            background: getFileUrlByType(est.files, "background"),
          },
        }));

        setEstablishments(mappedEstablishments);
      } catch (err) {
        if (!active) return;

        const msg =
          typeof err?.response?.data?.message === "string"
            ? err.response.data.message
            : "Erro ao carregar os estabelecimentos.";

        setError(msg);

        Swal.fire({
          icon: "error",
          title: "Erro",
          text: msg,
        });
      } finally {
        if (active) setIsLoading(false);
      }
    }

    if (appId) loadEstablishments();
    else {
      setError("app_id não informado.");
      setIsLoading(false);
    }

    return () => {
      active = false;
    };
  }, [apiBaseUrl, appId, city, uf]);

  return { establishments, isLoading, error };
}
