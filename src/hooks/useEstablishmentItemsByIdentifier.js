// src/hooks/useEstablishmentItemsByIdentifier.js
import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import { apiV1BaseUrl } from "../config";

const getApiMessage = (error, fallback) =>
  error?.response?.data?.error ||
  error?.response?.data?.message ||
  fallback;

const normalizeEntityName = (value) => String(value || "").trim().toLowerCase();

const fileUrl = (file) => file?.public_url || file?.url || file?.path || null;

const firstFileUrl = (files) => {
  if (!Array.isArray(files) || files.length === 0) return null;
  const preferred =
    files.find((file) => file?.is_primary) ||
    files.find((file) => file?.type === "image") ||
    files.find((file) => file?.type === "cover") ||
    files.find((file) => file?.type === "photo") ||
    files[0];
  return fileUrl(preferred);
};

const findFileUrl = (files, types) => {
  if (!Array.isArray(files)) return null;
  const normalizedTypes = new Set(types.map((type) => String(type).toLowerCase()));
  return fileUrl(
    files.find((file) => normalizedTypes.has(String(file?.type || "").toLowerCase()))
  );
};

const uniqueUrls = (values) => [...new Set(values.filter(Boolean))];

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
  const images = establishment.images || {};
  const logo =
    images.logo ||
    establishment.logo ||
    findFileUrl(files, ["logo", "avatar"]) ||
    null;
  const background =
    images.background ||
    images.cover ||
    images.banner ||
    establishment.background ||
    establishment.cover ||
    establishment.banner ||
    findFileUrl(files, ["background", "cover", "banner", "hero"]) ||
    null;
  const gallery = uniqueUrls([
    ...(Array.isArray(images.gallery) ? images.gallery : []),
    ...files
      .filter((file) =>
        ["gallery", "image", "photo"].includes(
          String(file?.type || "").toLowerCase()
        )
      )
      .map(fileUrl),
  ]).filter((url) => url !== logo && url !== background);

  return {
    ...establishment,
    images: {
      ...images,
      logo,
      background,
      cover: images.cover || background,
      gallery,
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
      const { data } = await api.get(
        `${apiV1BaseUrl}/catalog/${encodeURIComponent(identifier)}`
      );
      const payload = data?.data || data || {};
      const resolvedEstablishment = normalizeEstablishment(
        payload?.establishment || null
      );

      if (!resolvedEstablishment) throw new Error("Catálogo não encontrado.");

      const resolvedItems = Array.isArray(payload?.items) ? payload.items : [];
      setEstablishment(resolvedEstablishment);
      setItems(
        resolvedItems.map((item) => normalizeItem(item, resolvedEstablishment))
      );
    } catch (error) {
      setApiError(
        getApiMessage(error, error?.message || "Erro ao carregar o catálogo.")
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
