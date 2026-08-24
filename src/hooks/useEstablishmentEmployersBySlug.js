import { useEffect, useState } from "react";
import axios from "axios";
import { apiBaseUrl } from "../config";

export default function useEstablishmentEmployersBySlug(slug) {
  const [establishment, setEstablishment] = useState(null);
  const [employers, setEmployers] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setApiError(null);
      return;
    }

    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setApiError(null);

      try {
        const res = await axios.get(
          `${apiBaseUrl}/employer/list-by-entity/${slug}`,
          {
            headers: { Accept: "application/json" },
            signal: controller.signal,
            timeout: 15000,
          }
        );

        const data = res?.data || {};

        setEstablishment(data.establishment || null);
        setEmployers(Array.isArray(data.employers) ? data.employers : []);
        setCount(Number(data.total || 0));
      } catch (err) {
        if (axios.isCancel(err)) return;

        setApiError(
          err?.response?.data?.error ||
            err?.response?.data?.message ||
            "Erro ao carregar colaboradores."
        );

        setEstablishment(null);
        setEmployers([]);
        setCount(0);
      } finally {
        setLoading(false);
      }
    };

    load();

    return () => controller.abort();
  }, [slug]);

  return {
    establishment,
    employers,
    count,
    loading,
    apiError,
  };
}
