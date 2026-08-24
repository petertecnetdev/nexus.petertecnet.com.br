// src/hooks/useEstablishmentItemsByIdentifier.js
import { useEffect, useState, useCallback } from "react";
import api from "../services/api";

export default function useEstablishmentItemsByIdentifier(identifier) {
  const [establishment, setEstablishment] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  const fetchItems = useCallback(async () => {
    if (!identifier) {
      setLoading(false);
      setItems([]);
      setEstablishment(null);
      return;
    }

    setLoading(true);
    setApiError(null);

    try {
      const { data } = await api.get(
        `/item/list-by-entity/${encodeURIComponent(identifier)}`
      );

      setEstablishment(data.establishment || null);
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (error) {
      setApiError(
        error?.response?.data?.error ||
          "Erro ao buscar itens do estabelecimento."
      );
      setItems([]);
      setEstablishment(null);
    } finally {
      setLoading(false);
    }
  }, [identifier]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return {
    establishment,
    items,
    loading,
    apiError,
    reload: fetchItems,
  };
}
