import { useState, useEffect } from "react";
import axios from "axios";

export default function useItemView(apiBaseUrl, slug, token) {
  const [item, setItem] = useState(null);
  const [otherItems, setOtherItems] = useState([]);
  const [establishment, setEstablishment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) return undefined;
    let active = true;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const itemRes = await axios.get(`${apiBaseUrl}/item/view/${slug}`, { headers });
        if (!active) return;

        const itemData = itemRes.data.item;
        const establishmentData = itemRes.data.establishment;
        const itemImage =
          itemData?.image_url ||
          itemData?.files?.find((file) => file.type === "image")?.public_url ||
          itemData?.image ||
          null;
        const establishmentLogo =
          establishmentData?.files?.find((file) => file.type === "logo")?.public_url ||
          establishmentData?.logo ||
          null;

        setItem(itemData ? { ...itemData, imageUrl: itemImage } : null);
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

        const otherItemsRes = await axios.get(
          `${apiBaseUrl}/item/list-others/${identifier}`,
          { headers }
        );
        if (!active) return;

        const list = Array.isArray(otherItemsRes.data?.items)
          ? otherItemsRes.data.items
          : Array.isArray(otherItemsRes.data)
            ? otherItemsRes.data
            : [];

        setOtherItems(
          list
            .filter((candidate) => candidate.id !== itemData?.id)
            .filter((candidate) => Number(candidate.status ?? 1) !== 0)
            .map((candidate) => ({
              ...candidate,
              image:
                candidate.image_url ||
                candidate.files?.find((file) => file.type === "image")?.public_url ||
                candidate.image ||
                null,
            }))
        );
      } catch (err) {
        if (!active) return;
        setError(err.response?.data || err);
        setItem(null);
        setOtherItems([]);
        setEstablishment(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();
    return () => {
      active = false;
    };
  }, [apiBaseUrl, slug, token]);

  return { item, otherItems, establishment, loading, error };
}
