// src/hooks/useEstablishmentOrdersByIdentifier.js
import { useEffect, useState, useCallback } from "react";
import api from "../services/api";

export default function useEstablishmentOrdersByIdentifier(identifier) {
  const [establishment, setEstablishment] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  const fetchOrders = useCallback(async () => {
    if (!identifier) return;

    try {
      setLoading(true);
      setApiError(null);

      const { data } = await api.get(
        `/order/list-by-entity/${identifier}`
      );

      setEstablishment(data.establishment || null);
      setOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch (error) {
      setApiError(
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Erro ao listar pedidos."
      );
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [identifier]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    establishment,
    orders,
    loading,
    apiError,
    reload: fetchOrders,
  };
}
