import { useState, useEffect } from "react";
import axios from "axios";
import { apiBaseUrl } from "../config";

export default function useItemListBySlug(slug) {
  const [establishment, setEstablishment] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setApiError(null);

        const { data } = await axios.get(
          `${apiBaseUrl}/item/listbyentityslug/${slug}`
        );

        setEstablishment(data.establishment || null);
        setItems(Array.isArray(data.items) ? data.items : []);
      } catch (error) {
        if (error.response && error.response.data) {
          setApiError(
            error.response.data.error ||
              error.response.data.message ||
              "Erro ao carregar itens."
          );
        } else {
          setApiError("Erro ao carregar itens.");
        }
      } finally {
        setLoading(false);
      }
    }

    if (slug) load();
  }, [slug]);

  return { establishment, items, loading, apiError };
}
