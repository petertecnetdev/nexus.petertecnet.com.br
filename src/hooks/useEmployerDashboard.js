import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { apiBaseUrl } from "../config";

import {
  normalizeDateLike,
  toIsoDate,
  addDays,
  getWeekdayIndex,
  weekdayPt,
  shortPt,
  toHourMin,
  PT_WEEK,
} from "../utils/dateUtils";

import { money } from "../utils/moneyUtils";
import { translateStatus } from "../utils/statusUtils";

const MySwal = withReactContent(Swal);
const TZ = "America/Sao_Paulo";

export default function useEmployerDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    today: 0,
    tomorrow: 0,
    value: 0,
  });

  const [nextAppointment, setNextAppointment] = useState(null);
  const [lastAppointment, setLastAppointment] = useState(null);
  const [nextPendingAppointment, setNextPendingAppointment] = useState(null);

  const [recentAppointments, setRecentAppointments] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    day: "all",
    status: "all",
  });

  const [localLoading, setLocalLoading] = useState(true);
  const [notifQueue, setNotifQueue] = useState([]);
  const [flashIds, setFlashIds] = useState(new Set());
  const [finalizableAppointment, setFinalizableAppointment] = useState(null);

  const meRef = useRef(null);
  const lastCheckRef = useRef(null);
  const recentStoreRef = useRef([]);

  const token = useMemo(() => localStorage.getItem("token"), []);

  const safeAxios = useCallback(
    async (fn) => {
      const instance = axios.create();
      instance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      return await fn(instance);
    },
    [token]
  );

  const recomputeSummary = useCallback((list) => {
    const todayISO = toIsoDate(new Date());
    const tomorrowISO = toIsoDate(addDays(new Date(), 1));

    const total = list.length;
    const todayCount = list.filter((a) => toIsoDate(a.order_datetime) === todayISO).length;
    const tomorrowCount = list.filter((a) => toIsoDate(a.order_datetime) === tomorrowISO).length;

    const totalValue = list.reduce(
      (s, o) => s + parseFloat(o.total_price || 0),
      0
    );

    setSummary({
      total,
      today: todayCount,
      tomorrow: tomorrowCount,
      value: totalValue,
    });
  }, []);

  const computeNexts = useCallback((list) => {
    const now = new Date();
    const upcoming = list
      .filter(
        (a) =>
          ["pending", "confirmed"].includes(a.appointment_status) &&
          normalizeDateLike(a.order_datetime) >= now
      )
      .sort((a, b) => new Date(a.order_datetime) - new Date(b.order_datetime));

    const prevs = list
      .filter((a) => normalizeDateLike(a.order_datetime) < now)
      .sort((a, b) => new Date(a.order_datetime) - new Date(b.order_datetime));

    setNextAppointment(upcoming[0] || null);
    setLastAppointment(prevs.length ? prevs[prevs.length - 1] : null);

    const onlyPendingUpcoming = upcoming.filter((a) => a.appointment_status === "pending");
    setNextPendingAppointment(onlyPendingUpcoming[0] || null);
  }, []);

  const loadInitial = useCallback(async () => {
    try {
      setLocalLoading(true);

      const { data: me } = await safeAxios((req) => req.get(`${apiBaseUrl}/auth/me`));
      meRef.current = me || {};

      const { data: listResp } = await safeAxios((req) =>
        req.get(`${apiBaseUrl}/employer/appointments`)
      );

      const baseList = Array.isArray(listResp.appointments) ? listResp.appointments : [];

      let fullOrders = [];
      try {
        const { data: allResp } = await safeAxios((req) =>
          req.get(`${apiBaseUrl}/order/listbyemployer`)
        );
        const arr = Array.isArray(allResp?.orders) ? allResp.orders : [];
        fullOrders = arr.filter((o) => (o.type || "appointment") === "appointment");
      } catch {
        fullOrders = baseList;
      }

      setAppointments(baseList);
      setAllOrders(fullOrders);

      recomputeSummary(baseList);
      computeNexts(baseList);

      const recentSeed = [...baseList]
        .sort(
          (a, b) =>
            new Date(b.created_at || b.order_datetime) -
            new Date(a.created_at || a.order_datetime)
        )
        .slice(0, 3);

      setRecentAppointments(recentSeed);
      recentStoreRef.current = recentSeed;

      lastCheckRef.current = new Date().toISOString();
    } catch (e) {
      console.warn("Falha ao carregar inicial:", e);
    } finally {
      setLocalLoading(false);
    }
  }, [computeNexts, recomputeSummary, safeAxios]);

  const enqueueFlash = useCallback((ids = []) => {
    if (!ids.length) return;

    setFlashIds((prev) => {
      const clone = new Set(prev);
      ids.forEach((id) => clone.add(id));
      return clone;
    });

    setTimeout(() => {
      setFlashIds((prev) => {
        const clone = new Set(prev);
        ids.forEach((id) => clone.delete(id));
        return clone;
      });
    }, 2200);
  }, []);

  const pushNotification = useCallback((title, body, kind = "info", payload = {}) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    setNotifQueue((q) => [{ id, title, body, kind, payload }, ...q].slice(0, 6));

    setTimeout(() => {
      setNotifQueue((q) => q.filter((n) => n.id !== id));
    }, 8000);
  }, []);

  const updateRecentPersistent = useCallback((incoming = []) => {
    if (!incoming.length) return recentStoreRef.current;

    const mapExisting = new Map(recentStoreRef.current.map((r) => [r.id, r]));

    incoming.forEach((i) => mapExisting.set(i.id, i));

    const merged = Array.from(mapExisting.values()).sort(
      (a, b) =>
        new Date(b.created_at || b.order_datetime) -
        new Date(a.created_at || a.order_datetime)
    );

    const limited = merged.slice(0, 6);
    recentStoreRef.current = limited;
    setRecentAppointments(limited);

    return limited;
  }, []);

  const checkUpdates = useCallback(async () => {
    try {
      const employerId =
        meRef.current?.employer?.id ||
        JSON.parse(localStorage.getItem("employer") || "{}")?.id;

      if (!employerId) return;

      const params = new URLSearchParams();
      params.append("employer_id", employerId);

      if (lastCheckRef.current)
        params.append("last_check", lastCheckRef.current);

      const { data } = await safeAxios((req) =>
        req.get(`${apiBaseUrl}/employer/check-updates?${params.toString()}`)
      );

      lastCheckRef.current = data?.checked_at || new Date().toISOString();

      const newOnes = Array.isArray(data?.new_appointments)
        ? data.new_appointments
        : [];

      const nextApp = data?.next_appointment || null;
      const finalizable = data?.finalizable_appointment || null;

      if (newOnes.length) {
        enqueueFlash(newOnes.map((n) => n.id));

        newOnes.forEach((n) => {
          pushNotification(
            "Novo agendamento recebido",
            `${n.customer_name} — ${shortPt(n.order_datetime)} às ${toHourMin(
              n.order_datetime
            )}`,
            "success",
            { id: n.id }
          );
        });
      }

      if (nextApp) setNextAppointment(nextApp);
      if (finalizable) {
        setFinalizableAppointment(finalizable);
        pushNotification(
          "Atendimento finalizado",
          `${finalizable.customer_name} — ${shortPt(
            finalizable.order_datetime
          )} às ${toHourMin(finalizable.order_datetime)} precisa ser finalizado.`,
          "warning"
        );
      }

      const persisted = updateRecentPersistent(newOnes);

      try {
        const { data: refresh } = await safeAxios((req) =>
          req.get(`${apiBaseUrl}/employer/appointments`)
        );
        const base = Array.isArray(refresh.appointments)
          ? refresh.appointments
          : [];

        setAppointments(base);
        recomputeSummary(base);
        computeNexts(base);
      } catch {}

      if (!newOnes.length && !persisted.length && appointments.length) {
        updateRecentPersistent([appointments[0]]);
      }
    } catch (e) {
      console.warn("Falha ao verificar atualizações:", e);
    }
  }, [
    appointments.length,
    enqueueFlash,
    pushNotification,
    recomputeSummary,
    computeNexts,
    safeAxios,
    updateRecentPersistent,
  ]);

  // APLICAÇÃO DE FILTROS
  const timeButtons = useMemo(() => {
    const today = new Date();
    const yesterday = addDays(today, -1);
    const tomorrow = addDays(today, 1);

    const todayISO = toIsoDate(today);
    const yesterdayISO = toIsoDate(yesterday);
    const tomorrowISO = toIsoDate(tomorrow);

    const seq = [
      { key: "yesterday", label: "Ontem", dateISO: yesterdayISO },
      { key: "today", label: "Hoje", dateISO: todayISO },
      { key: "tomorrow", label: "Amanhã", dateISO: tomorrowISO },
    ];

    const names = PT_WEEK;
    for (let i = 2; i <= 7; i++) {
      const d = addDays(today, i);
      const idx = getWeekdayIndex(d);
      const label = names[idx][0].toUpperCase() + names[idx].slice(1);
      seq.push({ key: `d${i}`, label, dateISO: toIsoDate(d) });
    }

    return seq;
  }, []);

  const applyFilters = useCallback(
    (list) => {
      const search = (filters.search || "").trim().toLowerCase();
      const stFilter = filters.status || "all";
      const dayKey = filters.day || "all";

      let base = list;

      if (dayKey !== "all") {
        const button = timeButtons.find((b) => b.key === dayKey);

        if (button) {
          const target = new Date(`${button.dateISO}T00:00:00-03:00`);

          base = base.filter((a) => {
            const d = normalizeDateLike(a.order_datetime);
            const dLocal = new Date(
              d.toLocaleString("en-US", { timeZone: TZ })
            );
            return (
              dLocal.getFullYear() === target.getFullYear() &&
              dLocal.getMonth() === target.getMonth() &&
              dLocal.getDate() === target.getDate()
            );
          });
        }
      }

      if (stFilter !== "all") {
        base = base.filter(
          (a) => (a.appointment_status || "").toLowerCase() === stFilter
        );
      }

      if (search) {
        base = base.filter((a) => {
          const inName = (a.customer_name || "").toLowerCase().includes(search);

          const inItems =
            Array.isArray(a.items) &&
            a.items.some((i) =>
              (i?.item?.name || "").toLowerCase().includes(search)
            );

          return inName || inItems;
        });
      }

      base = [...base].sort(
        (a, b) => new Date(a.order_datetime) - new Date(b.order_datetime)
      );

      return base;
    },
    [filters.day, filters.search, filters.status, timeButtons]
  );

  const filteredAppointments = useMemo(() => {
    const source =
      Array.isArray(allOrders) && allOrders.length
        ? allOrders
        : appointments;

    return applyFilters(source);
  }, [allOrders, appointments, applyFilters]);

  // Inicial
  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  // Check updates
  useEffect(() => {
    const id = setInterval(() => {
      checkUpdates();
    }, 8000);
    return () => clearInterval(id);
  }, [checkUpdates]);


  // --------------------
  // RETORNO DO HOOK
  // --------------------

  return {
    appointments,
    allOrders,
    summary,
    nextAppointment,
    lastAppointment,
    nextPendingAppointment,
    recentAppointments,
    filters,
    setFilters,
    localLoading,
    notifQueue,
    flashIds,
    finalizableAppointment,
    handleAction: async (appt, action) => {
      const confirm =
        action === "cancel"
          ? await MySwal.fire({
              title: "Cancelar Agendamento",
              input: "text",
              inputPlaceholder: "Motivo (opcional)",
              showCancelButton: true,
              confirmButtonText: "Confirmar",
              cancelButtonText: "Fechar",
              background: "#121212",
              color: "#fff",
            })
          : { isConfirmed: true };

      if (!confirm.isConfirmed) return;

      try {
        setLocalLoading(true);
        const payload = { action };
        if (confirm.value) payload.reason = confirm.value;

        const { data } = await safeAxios((req) =>
          req.put(
            `${apiBaseUrl}/order/${appt.id}/update-appointment-status`,
            payload
          )
        );

        const msg = data?.message || "Operação concluída com sucesso!";
        await MySwal.fire({
          icon: data?.error ? "error" : "success",
          title: data?.error ? "Erro" : "Sucesso",
          text: msg,
          background: "#121212",
          color: "#fff",
        });

        await loadInitial();
      } catch {
        await MySwal.fire({
          icon: "error",
          title: "Erro",
          text: "Falha ao atualizar status.",
          background: "#121212",
          color: "#fff",
        });
      } finally {
        setLocalLoading(false);
      }
    },

    handleFinalize: async (appt, status) => {
      try {
        setLocalLoading(true);
        const payload = { action: status };

        const { data } = await safeAxios((req) =>
          req.put(
            `${apiBaseUrl}/order/${appt.id}/update-appointment-status`,
            payload
          )
        );

        const msg = data?.message || "Status atualizado com sucesso.";
        await MySwal.fire({
          icon: data?.error ? "error" : "success",
          title: data?.error ? "Erro" : "Sucesso",
          text: msg,
          background: "#121212",
          color: "#fff",
        });

        setFinalizableAppointment(null);
        await loadInitial();
      } catch {
        await MySwal.fire({
          icon: "error",
          title: "Erro",
          text: "Falha ao finalizar atendimento.",
          background: "#121212",
          color: "#fff",
        });
      } finally {
        setLocalLoading(false);
      }
    },

    filteredAppointments,
    timeButtons,
    weekdayPt,
    shortPt,
    toHourMin,
    money,
    translateStatus,
  };
}
