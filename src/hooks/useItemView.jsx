import { useState, useEffect } from "react";
import axios from "axios";

export default function useItemView(apiBaseUrl, slug, token) {
  const [item, setItem] = useState(null);
  const [employers, setEmployers] = useState([]);
  const [otherItems, setOtherItems] = useState([]);
  const [establishment, setEstablishment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) return;

    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    setLoading(true);
    setError(null);

    const fetchData = async () => {
      try {
        const itemRes = await axios.get(
          `${apiBaseUrl}/item/view/${slug}`,
          { headers }
        );

        const itemData = itemRes.data.item;
        const establishmentData = itemRes.data.establishment;

        const itemImage =
          itemData.image_url ||
          itemData.files?.find((f) => f.type === "image")?.public_url ||
          null;

        const establishmentLogo =
          establishmentData?.files?.find((f) => f.type === "logo")?.public_url ||
          null;

        setItem({ ...itemData, imageUrl: itemImage });
        setEstablishment({ ...establishmentData, logoImage: establishmentLogo });

        if (establishmentData?.slug || establishmentData?.id) {
          const otherItemsRes = await axios.get(
            `${apiBaseUrl}/item/list-others/${establishmentData.slug ?? establishmentData.id}`,
            { headers }
          );

          setOtherItems(
            otherItemsRes.data?.map((i) => ({
              ...i,
              imageUrl:
                i.image_url ||
                i.files?.find((f) => f.type === "image")?.public_url ||
                null,
            })) || []
          );
        }

        const employersRes = await axios.get(
          `${apiBaseUrl}/employer/list-by-item/${slug}`,
          { headers }
        );

        setEmployers(
          employersRes.data.employers?.map((e) => ({
            id: e.id,
            type: "employer",
            name: `${e.user?.first_name || ""} ${e.user?.last_name || ""}`.trim(),
            role: e.role,
            attended_count: e.attended_count,
            image:
              e.user?.files?.find((f) => f.type === "avatar")?.public_url ||
              "/images/logo.png",
            user: {
              id: e.user?.id,
              first_name: e.user?.first_name || "",
              last_name: e.user?.last_name || "",
              avatar:
                e.user?.files?.find((f) => f.type === "avatar")?.public_url ||
                "/images/logo.png",
              city: e.user?.city || "",
              uf: e.user?.uf || "",
            },
          })) || []
        );
      } catch (err) {
        setError(err.response?.data || err);
        setItem(null);
        setEmployers([]);
        setOtherItems([]);
        setEstablishment(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [apiBaseUrl, slug, token]);

  return { item, employers, otherItems, establishment, loading, error };
}
