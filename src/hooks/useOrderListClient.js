import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { apiBaseUrl, appId } from "../config";

export default function useOrderListClient() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        `${apiBaseUrl}/order/list-by-client/${appId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setOrders(
        Array.isArray(response.data?.orders) ? response.data.orders : []
      );
    } catch (err) {
      setOrders([]);
      setError(
        err?.response?.data?.message ||
          "Erro ao listar os pedidos do cliente."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return {
    orders,
    loading,
    error,
    refetch: loadOrders,
  };
}
