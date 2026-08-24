// src/hooks/useOrdersByEntitySlug.js
import { useEffect, useState, useCallback } from "react";
import api from "../services/api";

export default function useOrdersByEntitySlug(slug) {
  const [establishment, setEstablishment] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  const fetchOrders = useCallback(async () => {
    if (!slug) return;

    setLoading(true);
    setApiError(null);

    try {
      const { data } = await api.get(
        `/order/list-by-entity-slug/${slug}`
      );

      setEstablishment(data.establishment || null);
      setOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch (err) {
      setApiError(
        err?.response?.data?.error ||
          "Erro ao carregar pedidos do estabelecimento."
      );
      setOrders([]);
      setEstablishment(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    establishment,
    orders,
    loading,
    apiError,
    refetch: fetchOrders,
  };
}
