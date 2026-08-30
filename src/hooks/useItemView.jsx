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
        const { data } = await api.get(`/nexus/item/${encodedSlug}`, {
          params: { app_id: appId },
          signal: controller.signal,
        });

        const itemData = data?.item || null;
        const establishmentData = data?.establishment || null;
        const relatedItems = Array.isArray(data?.other_items) ? data.other_items : [];

        if (!itemData) throw new Error("Item não encontrado.");

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
        setOtherItems(
          relatedItems
            .filter((candidate) => Number(candidate.status ?? 1) !== 0)
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
