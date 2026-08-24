// src/hooks/useOrderWizard.js
import { useCallback } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import tz from "dayjs/plugin/timezone";
import { apiBaseUrl } from "../config";

dayjs.extend(utc);
dayjs.extend(tz);

export default function useOrderWizard() {
  const loadAvailableTimes = useCallback(
    async (date, employer, duration) => {
      if (!date || !employer?.id || !duration) return [];

      const token = localStorage.getItem("token");

      const res = await fetch(
        `${apiBaseUrl}/employer/${employer.id}/available-times?date=${date}&duration=${duration}`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Erro ao buscar horários");
      }

      return Array.isArray(data) ? data : data.times || [];
    },
    []
  );

  const createOrder = useCallback(async (payload) => {
    const token = localStorage.getItem("token");

    const res = await fetch(`${apiBaseUrl}/order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.message || "Erro ao criar pedido");
    }

    return data;
  }, []);

  const buildDatetime = useCallback((date, time) => {
    return dayjs
      .tz(`${date} ${time}`, "YYYY-MM-DD HH:mm", "America/Sao_Paulo")
      .format("YYYY-MM-DDTHH:mm:ssZ");
  }, []);

  return {
    loadAvailableTimes,
    createOrder,
    buildDatetime,
  };
}
