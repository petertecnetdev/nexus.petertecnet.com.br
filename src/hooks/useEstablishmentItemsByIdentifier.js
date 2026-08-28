// src/hooks/useEstablishmentItemsByIdentifier.js
import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import { appId } from "../config";

const MAX_FALLBACK_PAGES = 50;

const getApiMessage = (error, fallback) =>
  error?.response?.data?.error ||
  error?.response?.data?.message ||
  fallback;

const normalizeEntityName = (value) =>
  String(value || "").trim().toLowerCase();

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
  entity_name: normalizeEntityName(item?.entity_name),
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
      params: { page, app_id: appId },
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
        `/establishment/view/${encodedIdentifier}`,
        { params: { app_id: appId } }
      );

      const resolvedEstablishment = normalizeEstablishment(
        establishmentResponse?.data?.establishment || null
      );

      if (!resolvedEstablishment) {
        throw new Error("Estabelecimento não encontrado.");
      }

      if (
        resolvedEstablishment.app_id != null &&
        Number(resolvedEstablishment.app_id) !== Number(appId)
      ) {
        throw new Error("Este catálogo não pertence à Nexus.");
      }

      setEstablishment(resolvedEstablishment);

      let resolvedItems = [];

      try {
        const { data } = await api.get(
          `/item/list-by-entity/${encodedIdentifier}`,
          { params: { app_id: appId } }
        );

        resolvedItems = Array.isArray(data?.items) ? data.items : [];
      } catch (specificEndpointError) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            "[Nexus] list-by-entity indisponível; usando fallback por app.",
            getApiMessage(specificEndpointError, "Erro ao listar itens")
          );
        }

        const allAppItems = await fetchAllItemsByApp();
        resolvedItems = allAppItems.filter((item) => {
          const entityName = normalizeEntityName(item?.entity_name);
          return (
            Number(item.entity_id) === Number(resolvedEstablishment.id) &&
            (!entityName || entityName === "establishment")
          );
        });
      }

      setItems(
        resolvedItems
          .filter((item) => item?.app_id == null || Number(item.app_id) === Number(appId))
          .map((item) => normalizeItem(item, resolvedEstablishment))
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
