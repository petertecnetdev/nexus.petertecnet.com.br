// src/hooks/useEstablishmentItemsByIdentifier.js
import { useState, useEffect, useCallback } from "react";
import api from "../services/api";

export default function useEstablishmentItemsByIdentifier(identifier) {
  const [establishment, setEstablishment] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  const fetch = useCallback(async () => {
    if (!identifier) return;

    setLoading(true);
    setApiError(null);

    try {
      const { data } = await api.get(
        `/item/list-by-entity/${identifier}`
      );

      setEstablishment(data.establishment || null);
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      setApiError(
        err?.response?.data?.error ||
          "Erro ao buscar itens do estabelecimento."
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [identifier]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    establishment,
    items,
    loading,
    apiError,
  };
}
