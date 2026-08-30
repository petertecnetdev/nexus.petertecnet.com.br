// src/hooks/useEstablishmentItemsByIdentifier.js
import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import { appId } from "../config";

const getApiMessage = (error, fallback) =>
  error?.response?.data?.error ||
  error?.response?.data?.message ||
  fallback;

const normalizeEntityName = (value) =>
  String(value || "").trim().toLowerCase();

const firstFileUrl = (files) => {
  if (!Array.isArray(files) || files.length === 0) return null;

  const preferred =
    files.find((file) => file?.is_primary) ||
    files.find((file) => file?.type === "image") ||
    files.find((file) => file?.type === "cover") ||
    files.find((file) => file?.type === "photo") ||
    files[0];

  return preferred?.public_url || preferred?.url || preferred?.path || null;
};

const resolveItemImage = (item) =>
  item?.image_url ||
  item?.image ||
  item?.avatar ||
  item?.images?.cover ||
  item?.images?.main ||
  item?.images?.avatar ||
  (Array.isArray(item?.images?.gallery) ? item.images.gallery[0] : null) ||
  firstFileUrl(item?.files) ||
  null;

const normalizeEstablishment = (establishment) => {
  if (!establishment) return null;

  const files = Array.isArray(establishment.files) ? establishment.files : [];
  const logoFile = files.find((file) => file?.type === "logo")?.public_url;
  const backgroundFile = files.find((file) => file?.type === "background")?.public_url;

  return {
    ...establishment,
    images: {
      ...(establishment.images || {}),
      logo: establishment?.images?.logo || establishment.logo || logoFile || null,
      background:
        establishment?.images?.background ||
        establishment.background ||
        backgroundFile ||
        null,
    },
  };
};

const normalizeItem = (item, establishment) => ({
  ...item,
  entity_name: normalizeEntityName(item?.entity_name),
  establishment: item.establishment || establishment || null,
  image: resolveItemImage(item),
});

export default function useEstablishmentItemsByIdentifier(identifier) {
  const [establishment, setEstablishment] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  const fetchItems = useCallback(async () => {
    if (!identifier) {
      setEstablishment(null);
      setItems([]);
      setApiError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setApiError(null);

    try {
      const encodedIdentifier = encodeURIComponent(identifier);
      const { data } = await api.get(`/nexus/catalog/${encodedIdentifier}`, {
        params: { app_id: appId },
      });

      const resolvedEstablishment = normalizeEstablishment(data?.establishment || null);

      if (!resolvedEstablishment) {
        throw new Error("Catálogo não encontrado.");
      }

      const resolvedItems = Array.isArray(data?.items) ? data.items : [];

      setEstablishment(resolvedEstablishment);
      setItems(
        resolvedItems.map((item) => normalizeItem(item, resolvedEstablishment))
      );
    } catch (error) {
      setApiError(
        getApiMessage(
          error,
          error?.message || "Erro ao carregar o catálogo Nexus."
        )
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
    count: items.length,
    loading,
    apiError,
    reload: fetchItems,
  };
}
