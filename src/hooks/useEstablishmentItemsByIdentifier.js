// src/hooks/useEstablishmentItemsByIdentifier.js
import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import { appId } from "../config";

const MAX_FALLBACK_PAGES = 50;

const getApiMessage = (error, fallback) =>
  error?.response?.data?.error ||
  error?.response?.data?.message ||
  fallback;

const normalizeEstablishment = (establishment) => {
  if (!establishment) return null;

  const files = Array.isArray(establishment.files) ? establishment.files : [];
  const logoFile = files.find((file) => file.type === "logo")?.public_url;
  const backgroundFile = files.find((file) => file.type === "background")?.public_url;

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
  establishment: item.establishment || establishment || null,
  image:
    item.image ||
    item.image_url ||
    item.files?.find?.((file) => file.type === "image")?.public_url ||
    null,
});

async function fetchAllItemsByApp() {
  const allItems = [];
  let page = 1;
  let lastPage = 1;

  do {
    const { data } = await api.get(`/item/listbyapp/${appId}`, {
      params: { page },
    });

    const pageItems = Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data)
          ? data
          : [];

    allItems.push(...pageItems);

    lastPage = Number(data?.last_page || 1);
    page += 1;
  } while (page <= lastPage && page <= MAX_FALLBACK_PAGES);

  return allItems;
}

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

      const establishmentResponse = await api.get(
        `/establishment/view/${encodedIdentifier}`
      );

      const resolvedEstablishment = normalizeEstablishment(
        establishmentResponse?.data?.establishment || null
      );

      if (!resolvedEstablishment) {
        throw new Error("Estabelecimento não encontrado.");
      }

      setEstablishment(resolvedEstablishment);

      let resolvedItems = [];

      try {
        const { data } = await api.get(
          `/item/list-by-entity/${encodedIdentifier}`
        );

        resolvedItems = Array.isArray(data?.items) ? data.items : [];
      } catch (specificEndpointError) {
        console.warn(
          "[Nexus] list-by-entity falhou; usando fallback por app.",
          getApiMessage(specificEndpointError, "Erro ao listar itens")
        );

        const allAppItems = await fetchAllItemsByApp();
        resolvedItems = allAppItems.filter(
          (item) =>
            Number(item.entity_id) === Number(resolvedEstablishment.id) &&
            (!item.entity_name || item.entity_name === "establishment")
        );
      }

      setItems(
        resolvedItems.map((item) => normalizeItem(item, resolvedEstablishment))
      );
    } catch (error) {
      setApiError(
        getApiMessage(
          error,
          error?.message || "Erro ao buscar itens do estabelecimento."
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
