import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const getFileUrlByType = (files, type) =>
  Array.isArray(files) ? files.find((f) => f.type === type)?.public_url ?? null : null;

const distributeItems = (items) => {
  const groups = items.reduce((acc, item) => {
    const estId = item.establishment_id;
    if (!acc[estId]) acc[estId] = [];
    acc[estId].push(item);
    return acc;
  }, {});

  const result = [];
  let lastEstId = null;

  while (Object.keys(groups).length) {
    const candidates = Object.keys(groups).filter(
      (id) => id !== lastEstId && groups[id].length
    );

    const selectedId = candidates.length
      ? candidates[Math.floor(Math.random() * candidates.length)]
      : Object.keys(groups)[0];

    const item = groups[selectedId].shift();
    result.push(item);
    lastEstId = selectedId;

    if (!groups[selectedId].length) delete groups[selectedId];
  }

  return result;
};

export default function useHome(apiBaseUrl, appId) {
  const [establishments, setEstablishments] = useState([]);
  const [employers, setEmployers] = useState([]);
  const [serviceItems, setServiceItems] = useState([]);
  const [productItems, setProductItems] = useState([]);
  const [stats, setStats] = useState({
    top_establishments_views: [],
    top_items_views: [],
    total_views: 0,
    dau: 0,
    mau: 0,
    dau_mau_ratio: 0,
  });
  const [highlights, setHighlights] = useState({});
  const [homePayload, setHomePayload] = useState({});
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentInteractions, setRecentInteractions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const city = localStorage.getItem("selectedCity");
  const uf = localStorage.getItem("selectedUF");

  useEffect(() => {
    let active = true;

    async function loadHome() {
      setIsLoading(true);
      setError(null);

      try {
        const query =
          city && uf
            ? `?city=${encodeURIComponent(city)}&uf=${encodeURIComponent(uf)}`
            : "";

        const [homeRes, estRes, empRes, itemRes] = await Promise.all([
          axios.get(`${apiBaseUrl}/home/${appId}${query}`),
          axios.get(`${apiBaseUrl}/establishment/home/${appId}${query}`),
          axios.get(`${apiBaseUrl}/employer/home/${appId}${query}`),
          axios.get(`${apiBaseUrl}/item/home/${appId}${query}`),
        ]);

        if (!active) return;

        // Mapeia establishments
        const mappedEstablishments = (estRes.data?.establishments || []).map((est) => ({
          ...est,
          type: "establishment",
          name: est.name,
          image: getFileUrlByType(est.files, "logo") || getFileUrlByType(est.files, "background") || null,
          images: {
            logo: getFileUrlByType(est.files, "logo"),
            background: getFileUrlByType(est.files, "background"),
          },
        }));

        // Mapeia employers
        const mappedEmployers = (empRes.data?.employers || []).map((emp) => {
          const firstName = emp.user?.first_name || "";
          const lastName = emp.user?.last_name || "";
          const fullName = `${firstName} ${lastName}`.trim();

          return {
            ...emp,
            type: "employer",
            name: fullName || firstName || "Colaborador",
            first_name: firstName,
            last_name: lastName,
            avatar: getFileUrlByType(emp.user?.files, "avatar"),
            image: getFileUrlByType(emp.user?.files, "avatar"),
            user: emp.user,
          };
        });

        // Mapeia items
        const mappedItems = (itemRes.data?.items || []).map((item) => ({
          ...item,
          type: item.type,
          image: getFileUrlByType(item.files, "image"),
        }));

        const orderedItems = distributeItems(mappedItems);

        // Atualiza estados
        setEstablishments(mappedEstablishments);
        setEmployers(mappedEmployers);
        setServiceItems(orderedItems.filter((item) => item.type === "service"));
        setProductItems(orderedItems.filter((item) => item.type === "product"));

        setStats({
          top_establishments_views: estRes.data?.stats?.top_establishments_views || [],
          top_items_views: itemRes.data?.stats?.top_items_views || [],
          total_views:
            (estRes.data?.stats?.total_views || 0) + (itemRes.data?.stats?.total_views || 0),
          dau: estRes.data?.stats?.dau || 0,
          mau: estRes.data?.stats?.mau || 0,
          dau_mau_ratio: estRes.data?.stats?.dau_mau_ratio || 0,
        });

        setHighlights(homeRes.data?.highlights || {});
        setHomePayload(homeRes.data?.payload || {});
        setRecentOrders(homeRes.data?.recent_orders || []);
        setRecentInteractions(homeRes.data?.recent_interactions || []);
      } catch (err) {
        if (!active) return;

        const msg =
          typeof err?.response?.data?.message === "string"
            ? err.response.data.message
            : "Erro ao carregar a home.";

        setError(msg);

        Swal.fire({
          icon: "error",
          title: "Erro",
          text: msg,
        });
      } finally {
        if (active) setIsLoading(false);
      }
    }

    if (appId) loadHome();
    else {
      setError("app_id não informado.");
      setIsLoading(false);
    }

    return () => {
      active = false;
    };
  }, [apiBaseUrl, appId, city, uf]);

  return {
    establishments,
    employers,
    serviceItems,
    productItems,
    stats,
    highlights,
    homePayload,
    recentOrders,
    recentInteractions,
    isLoading,
    error,
  };
}
