// src/hooks/useEmployerOrders.js
import { useEffect, useState, useCallback } from "react";
import api from "../services/api";

export default function useEmployerOrders() {
  const [orders, setOrders] = useState([]);
  const [employer, setEmployer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

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

  const updateOrderStatus = useCallback(async (orderId, status) => {
    setActionLoading(orderId);

    try {
      await api.put(`/order/${orderId}/update-status`, {
        status,
      });

      await fetchOrders();
    } catch (err) {
      throw new Error(
        err?.response?.data?.error ||
          "Erro ao atualizar status do pedido."
      );
    } finally {
      setActionLoading(null);
    }
  }, [fetchOrders]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    orders,
    employer,
    loading,
    apiError,
    actionLoading,
    updateOrderStatus,
    refetch: fetchOrders,
  };
}
