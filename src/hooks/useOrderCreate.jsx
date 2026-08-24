// src/hooks/useOrderCreate.js
import { useEffect, useState, useCallback, useRef } from "react";
import api from "../services/api";

export default function useOrderCreate(identifier) {
  const [establishment, setEstablishment] = useState(null);
  const [items, setItems] = useState([]);
  const [employers, setEmployers] = useState([]);

  const [clients, setClients] = useState([]);
  const [searchingClients, setSearchingClients] = useState(false);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  const abortRef = useRef(null);

  const loadData = useCallback(async () => {
    if (!identifier) return;

    setLoading(true);
    setApiError(null);

    try {
      const [estRes, itemsRes, employersRes] = await Promise.all([
        api.get(`/establishment/view/${identifier}`),
        api.get(`/item/list-by-entity/${identifier}`),
        api.get(`/employer/list-by-entity/${identifier}`),
      ]);

      setEstablishment(estRes.data.establishment || null);
      setItems(itemsRes.data.items || []);
      setEmployers(employersRes.data.employers || []);
    } catch (err) {
      setApiError(
        err?.response?.data?.error ||
          "Erro ao carregar dados do estabelecimento."
      );
    } finally {
      setLoading(false);
    }
  }, [identifier]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const searchClients = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setClients([]);
      return;
    }

    if (abortRef.current) abortRef.current.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    setSearchingClients(true);

    try {
      const { data } = await api.post(
        "/user/find-for-order",
        { q: query },
        { signal: controller.signal }
      );

      setClients(data.users || []);
    } catch (err) {
      if (err.name !== "AbortError") setClients([]);
    } finally {
      setSearchingClients(false);
    }
  }, []);

  const fetchAvailableTimes = useCallback(async (payload) => {
    const { data } = await api.post("/employer/available-times", payload);
    return data.available_times || [];
  }, []);

  const createOrder = useCallback(async (payload) => {
    setSubmitting(true);
    try {
      const { data } = await api.post("/order", payload);
      return data;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return {
    establishment,
    items,
    employers,

    clients,
    searchingClients,
    searchClients,

    fetchAvailableTimes,
    createOrder,

    loading,
    submitting,
    apiError,
  };
}
