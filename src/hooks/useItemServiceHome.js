// src/hooks/useItemServiceHome.js
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

export default function useItemServiceHome(apiBaseUrl, appId) {
  const [serviceItems, setServiceItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const city = localStorage.getItem("selectedCity");
  const uf = localStorage.getItem("selectedUF");

  useEffect(() => {
    let active = true;

    async function loadServiceItems() {
      setIsLoading(true);
      setError(null);

      try {
        const query =
          city && uf
            ? `?city=${encodeURIComponent(city)}&uf=${encodeURIComponent(uf)}`
            : "";

        const res = await axios.get(`${apiBaseUrl}/item/home/${appId}${query}`);

        if (!active) return;

        const mappedItems = (res.data?.items || [])
          .filter((item) => item.type === "service")
          .map((item) => ({
            ...item,
            type: item.type,
            image: getFileUrlByType(item.files, "image"),
          }));

        const orderedItems = distributeItems(mappedItems);
        setServiceItems(orderedItems);
      } catch (err) {
        if (!active) return;

        const msg =
          typeof err?.response?.data?.message === "string"
            ? err.response.data.message
            : "Erro ao carregar os serviços.";

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

    if (appId) loadServiceItems();
    else {
      setError("app_id não informado.");
      setIsLoading(false);
    }

    return () => {
      active = false;
    };
  }, [apiBaseUrl, appId, city, uf]);

  return { serviceItems, isLoading, error };
}