import { useEffect, useState } from "react";
import { getFromApiV1 } from "../services/apiV1";

const getFileUrlByType = (files, type) =>
  Array.isArray(files) ? files.find((file) => file.type === type)?.public_url ?? null : null;

const distributeItems = (items) => {
  const groups = items.reduce((acc, item) => {
    const establishmentId = item.establishment_id || item.entity_id || "unknown";
    if (!acc[establishmentId]) acc[establishmentId] = [];
    acc[establishmentId].push(item);
    return acc;
  }, {});

  const result = [];
  let lastEstablishmentId = null;

  while (Object.keys(groups).length) {
    const candidates = Object.keys(groups).filter(
      (id) => id !== lastEstablishmentId && groups[id].length
    );
    const selectedId = candidates.length
      ? candidates[Math.floor(Math.random() * candidates.length)]
      : Object.keys(groups)[0];

    result.push(groups[selectedId].shift());
    lastEstablishmentId = selectedId;
    if (!groups[selectedId].length) delete groups[selectedId];
  }

  return result;
};

export default function useHome(_apiBaseUrl, appId) {
  const [establishments, setEstablishments] = useState([]);
  const [serviceItems, setServiceItems] = useState([]);
  const [productItems, setProductItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function loadHome() {
      setIsLoading(true);
      setError(null);

      try {
        const { data } = await getFromApiV1("/discovery", {
          signal: controller.signal,
        });

        if (!active) return;

        const mappedEstablishments = (data?.establishments || []).map((establishment) => ({
          ...establishment,
          type: "establishment",
          name: establishment.fantasy || establishment.name,
          image:
            getFileUrlByType(establishment.files, "logo") ||
            getFileUrlByType(establishment.files, "background") ||
            null,
          images: {
            logo: getFileUrlByType(establishment.files, "logo"),
            background: getFileUrlByType(establishment.files, "background"),
          },
        }));

        const mappedItems = (data?.items || [])
          .filter((item) => Number(item.status ?? 1) !== 0)
          .map((item) => ({
            ...item,
            establishment_id: item.establishment_id || item.entity_id || item.establishment?.id,
            type: item.type,
            image: getFileUrlByType(item.files, "image"),
          }));

        const orderedItems = distributeItems(mappedItems);

        setEstablishments(mappedEstablishments);
        setServiceItems(orderedItems.filter((item) => item.type === "service"));
        setProductItems(orderedItems.filter((item) => item.type === "product"));
      } catch (requestError) {
        if (!active || requestError?.code === "ERR_CANCELED") return;

        const message =
          typeof requestError?.response?.data?.message === "string"
            ? requestError.response.data.message
            : "Não foi possível carregar os catálogos e itens.";
        setError(message);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    if (appId) {
      loadHome();
    } else {
      setError("appId não configurado.");
      setIsLoading(false);
    }

    return () => {
      active = false;
      controller.abort();
    };
  }, [appId]);

  return {
    establishments,
    serviceItems,
    productItems,
    isLoading,
    error,
  };
}
