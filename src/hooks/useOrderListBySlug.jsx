// src/hooks/useOrderListBySlug.js
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { apiBaseUrl } from "../config";

export default function useOrderListBySlug(slug) {
  const [establishment, setEstablishment] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  const getToken = () =>
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("auth_token") ||
    "";

  const fetchOrders = useCallback(async () => {
    if (!slug || typeof slug !== "string") {
      setEstablishment(null);
      setOrders([]);
      setApiError("Slug inválido.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setApiError(null);

    try {
      const token = getToken();
      const res = await axios.get(
        `${apiBaseUrl}/order/entity/${encodeURIComponent(slug)}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }
      );

      const data = res?.data || {};
      setEstablishment(data.establishment || null);
      setOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Erro ao listar pedidos.";
      setApiError(msg);
      setEstablishment(null);
      setOrders([]);
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
