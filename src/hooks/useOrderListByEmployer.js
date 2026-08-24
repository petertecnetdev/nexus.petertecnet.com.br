// src/hooks/useOrderListByEmployer.js
import { useEffect, useState, useCallback } from "react";
import api from "../services/api";

export default function useOrderListByEmployer() {
  const [employer, setEmployer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setApiError(null);

    try {
      const { data } = await api.get("/order/listbyemployer");
      setEmployer(data.employer || null);
      setOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch (err) {
      setApiError(
        err?.response?.data?.error ||
          "Erro ao listar pedidos do colaborador."
      );
      setOrders([]);
      setEmployer(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    employer,
    orders,
    loading,
    apiError,
    refetch: fetchOrders,
  };
}
