import { useEffect, useState } from "react";
import api from "../services/api";
import { appId } from "../config";

const normalizeImage = (entity) =>
  entity?.image_url ||
  entity?.files?.find?.((file) => file.type === "image")?.public_url ||
  entity?.image ||
  null;

export default function useItemView(slug) {
  const [item, setItem] = useState(null);
  const [otherItems, setOtherItems] = useState([]);
  const [establishment, setEstablishment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const encodedSlug = encodeURIComponent(slug);
        const itemRes = await api.get(`/item/view/${encodedSlug}`, {
          params: { app_id: appId },
          signal: controller.signal,
        });

        const itemData = itemRes.data?.item || null;
        const establishmentData = itemRes.data?.establishment || null;

        if (!itemData) throw new Error("Item não encontrado.");

        if (
          itemData.app_id != null &&
          Number(itemData.app_id) !== Number(appId)
        ) {
          throw new Error("Este item não pertence à Nexus.");
        }

        if (
          establishmentData?.app_id != null &&
          Number(establishmentData.app_id) !== Number(appId)
        ) {
          throw new Error("Este catálogo não pertence à Nexus.");
        }

        const establishmentLogo =
          establishmentData?.files?.find?.((file) => file.type === "logo")?.public_url ||
          establishmentData?.logo ||
          null;

        setItem({ ...itemData, imageUrl: normalizeImage(itemData) });
        setEstablishment(
          establishmentData
            ? { ...establishmentData, logo: establishmentLogo }
            : null
        );

        const identifier = establishmentData?.slug || establishmentData?.id;
        if (!identifier) {
          setOtherItems([]);
          return;
        }

        const otherItemsRes = await api.get(
          `/item/list-others/${encodeURIComponent(identifier)}`,
          {
            params: { app_id: appId },
            signal: controller.signal,
          }
        );

        const list = Array.isArray(otherItemsRes.data?.items)
          ? otherItemsRes.data.items
          : Array.isArray(otherItemsRes.data)
            ? otherItemsRes.data
            : [];

        setOtherItems(
          list
            .filter((candidate) => candidate.id !== itemData.id)
            .filter((candidate) => Number(candidate.status ?? 1) !== 0)
            .filter((candidate) => candidate?.app_id == null || Number(candidate.app_id) === Number(appId))
            .map((candidate) => ({
              ...candidate,
              image: normalizeImage(candidate),
            }))
        );
      } catch (err) {
        if (err?.code === "ERR_CANCELED") return;
        setError(err.response?.data || err);
        setItem(null);
        setOtherItems([]);
        setEstablishment(null);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchData();
    return () => controller.abort();
  }, [slug]);

  return { item, otherItems, establishment, loading, error };
}
