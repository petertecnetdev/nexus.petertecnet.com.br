// src/hooks/useEstablishmentItemsByIdentifier.js
import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import { apiV1BaseUrl } from "../config";

const getApiMessage = (error, fallback) =>
  error?.response?.data?.error ||
  error?.response?.data?.message ||
  fallback;

const normalizeEntityName = (value) => String(value || "").trim().toLowerCase();

const fileUrl = (file) =>
  file?.public_url ||
  file?.full_url ||
  file?.media_url ||
  file?.image_url ||
  file?.url ||
  file?.src ||
  file?.path ||
  null;

const fileType = (file) =>
  String(
    file?.type ||
      file?.role ||
      file?.kind ||
      file?.collection ||
      file?.category ||
      file?.purpose ||
      ""
  )
    .trim()
    .toLowerCase();

const firstFileUrl = (files) => {
  if (!Array.isArray(files) || files.length === 0) return null;
  const preferred =
    files.find((file) => file?.is_primary) ||
    files.find((file) => fileType(file).includes("image")) ||
    files.find((file) => fileType(file).includes("cover")) ||
    files.find((file) => fileType(file).includes("photo")) ||
    files[0];
  return fileUrl(preferred);
};

const findFileUrl = (files, types) => {
  if (!Array.isArray(files)) return null;
  const normalizedTypes = types.map((type) => String(type).toLowerCase());
  return fileUrl(
    files.find((file) => {
      const currentType = fileType(file);
      return normalizedTypes.some(
        (type) => currentType === type || currentType.includes(type)
      );
    })
  );
};

const uniqueUrls = (values) => [...new Set(values.filter(Boolean))];

const resolveItemImage = (item) =>
  item?.image_url ||
  item?.image ||
  item?.avatar ||
  item?.avatar_url ||
  item?.cover_url ||
  item?.images?.cover ||
  item?.images?.main ||
  item?.images?.avatar ||
  item?.images?.image ||
  (Array.isArray(item?.images?.gallery) ? item.images.gallery[0] : null) ||
  firstFileUrl(item?.files) ||
  null;

const normalizeEstablishment = (establishment) => {
  if (!establishment) return null;

  const rawImages = establishment.images;
  const images =
    rawImages && !Array.isArray(rawImages) && typeof rawImages === "object"
      ? rawImages
      : {};
  const files = [
    ...(Array.isArray(establishment.files) ? establishment.files : []),
    ...(Array.isArray(rawImages) ? rawImages : []),
    ...(Array.isArray(establishment.media) ? establishment.media : []),
  ];

  const logo =
    images.logo ||
    images.logo_url ||
    images.avatar ||
    images.avatar_url ||
    establishment.logo ||
    establishment.logo_url ||
    establishment.avatar ||
    establishment.avatar_url ||
    establishment.image_logo ||
    findFileUrl(files, ["logo", "avatar", "profile"]) ||
    null;

  const background =
    images.background ||
    images.background_url ||
    images.background_image ||
    images.cover ||
    images.cover_url ||
    images.cover_image ||
    images.banner ||
    images.banner_url ||
    images.banner_image ||
    images.hero ||
    images.hero_url ||
    establishment.background ||
    establishment.background_url ||
    establishment.background_image ||
    establishment.cover ||
    establishment.cover_url ||
    establishment.cover_image ||
    establishment.banner ||
    establishment.banner_url ||
    establishment.banner_image ||
    establishment.hero ||
    establishment.hero_url ||
    establishment.image_background ||
    findFileUrl(files, ["background", "cover", "banner", "hero", "header"]) ||
    null;

  const directGallery = [
    ...(Array.isArray(images.gallery) ? images.gallery : []),
    ...(Array.isArray(images.photos) ? images.photos : []),
    ...(Array.isArray(establishment.gallery) ? establishment.gallery : []),
  ];

  const gallery = uniqueUrls([
    ...directGallery.map((entry) =>
      typeof entry === "string" ? entry : fileUrl(entry)
    ),
    ...files
      .filter((file) => {
        const type = fileType(file);
        return ["gallery", "image", "photo", "picture"].some(
          (candidate) => type === candidate || type.includes(candidate)
        );
      })
      .map(fileUrl),
  ]).filter((url) => url !== logo && url !== background);

  return {
    ...establishment,
    files,
    images: {
      ...images,
      logo,
      background,
      cover: images.cover || images.cover_url || background,
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
