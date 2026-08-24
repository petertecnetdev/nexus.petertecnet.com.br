// src/hooks/useEmployerMe.js
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import api from "../services/api";

export const EMPLOYER_DAYS = [
  { key: "monday", label: "Segunda" },
  { key: "tuesday", label: "Terça" },
  { key: "wednesday", label: "Quarta" },
  { key: "thursday", label: "Quinta" },
  { key: "friday", label: "Sexta" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" },
];

export const EMPLOYER_STATUS_BADGE = {
  pending: { label: "Pendente", variant: "warning" },
  confirmed: { label: "Confirmado", variant: "primary" },
  attended: { label: "Atendido", variant: "success" },
  not_attended: { label: "Não atendido", variant: "secondary" },
  cancelled: { label: "Cancelado", variant: "danger" },
};

const DAY_KEYS = EMPLOYER_DAYS.map((d) => d.key);

const toHM = (v) => {
  const s = String(v || "").trim();
  if (!s) return "";
  if (/^\d{2}:\d{2}:\d{2}$/.test(s)) return s.slice(0, 5);
  if (/^\d{2}:\d{2}$/.test(s)) return s;
  const m = s.match(/(\d{2}:\d{2})/);
  return m ? m[1] : s;
};

const safeArr = (v) => (Array.isArray(v) ? v : []);

const normalizeSchedule = (s) => {
  const day = s?.day_of_week ?? null;
  const start = toHM(s?.start_time);
  const end = toHM(s?.end_time);

  return {
    ...s,
    day_of_week: day,
    start_time: start,
    end_time: end,
  };
};

const sortSchedules = (rows) =>
  safeArr(rows)
    .map(normalizeSchedule)
    .filter((s) => s?.day_of_week && s?.start_time && s?.end_time)
    .sort((a, b) => {
      const da = DAY_KEYS.indexOf(a.day_of_week);
      const db = DAY_KEYS.indexOf(b.day_of_week);
      if (da !== db) return da - db;
      return String(a.start_time).localeCompare(String(b.start_time));
    });

const parseApiError = (e, fallback) => {
  const data = e?.response?.data;
  const errors = data?.errors;

  if (errors && typeof errors === "object") {
    const keys = Object.keys(errors);
    if (keys.length) {
      const k = keys[0];
      const val = errors[k];
      const msg = Array.isArray(val) ? val[0] : val;
      return msg || data?.message || fallback;
    }
  }

  return data?.error || data?.message || fallback;
};

export default function useEmployerMe() {
  const [employerId, setEmployerId] = useState(null);

  const [activeTab, setActiveTab] = useState("schedules");

  const [schedules, setSchedules] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [updates, setUpdates] = useState(null);
  const [lastCheck, setLastCheck] = useState(null);

  const [loading, setLoading] = useState(true);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [updatesLoading, setUpdatesLoading] = useState(false);
  const [savingSchedules, setSavingSchedules] = useState(false);
  const [deletingSchedule, setDeletingSchedule] = useState(false);
  const [reserving, setReserving] = useState(false);

  const [apiError, setApiError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [fieldErrors, setFieldErrors] = useState(null);

  const [addDay, setAddDay] = useState("monday");
  const [addStart, setAddStart] = useState("09:00");
  const [addEnd, setAddEnd] = useState("18:00");

  const mountedRef = useRef(true);

  const clearAlerts = useCallback(() => {
    setApiError(null);
    setActionMessage(null);
    setFieldErrors(null);
  }, []);

  const loadEmployer = useCallback(async () => {
    try {
      setLoading(true);
      clearAlerts();

      const res = await api.get("/auth/me");
      const employer = res.data?.employer || res.data?.user?.employer;

      if (!employer?.id) throw new Error("Employer não encontrado");

      if (mountedRef.current) setEmployerId(employer.id);
    } catch (e) {
      if (mountedRef.current) {
        setApiError(parseApiError(e, "Erro ao carregar dados do profissional."));
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [clearAlerts]);

  const loadSchedules = useCallback(
    async (id) => {
      const eid = id || employerId;
      if (!eid) return;

      try {
        setSchedulesLoading(true);
        setApiError(null);

        const res = await api.post("/employer/list-schedules", { employer_id: eid });
        if (mountedRef.current) setSchedules(sortSchedules(res.data));
      } catch (e) {
        if (mountedRef.current) setApiError(parseApiError(e, "Erro ao carregar horários."));
      } finally {
        if (mountedRef.current) setSchedulesLoading(false);
      }
    },
    [employerId]
  );

  const loadAppointments = useCallback(
    async (id) => {
      const eid = id || employerId;
      if (!eid) return;

      try {
        setAppointmentsLoading(true);
        setApiError(null);

        const res = await api.post("/employer/list-appointments", { employer_id: eid });
        if (mountedRef.current) setAppointments(res.data?.appointments || []);
      } catch (e) {
        if (mountedRef.current) setApiError(parseApiError(e, "Erro ao carregar agendamentos."));
      } finally {
        if (mountedRef.current) setAppointmentsLoading(false);
      }
    },
    [employerId]
  );

  const loadUpdates = useCallback(
    async (id, last = null) => {
      const eid = id || employerId;
      if (!eid) return;

      try {
        setUpdatesLoading(true);
        setApiError(null);

        const res = await api.post("/employer/check-updates", {
          employer_id: eid,
          last_check: last ?? lastCheck ?? null,
        });

        if (mountedRef.current) {
          setUpdates(res.data || null);
          setLastCheck(res.data?.checked_at || new Date().toISOString());
        }
      } catch (e) {
        if (mountedRef.current) setApiError(parseApiError(e, "Erro ao verificar atualizações."));
      } finally {
        if (mountedRef.current) setUpdatesLoading(false);
      }
    },
    [employerId, lastCheck]
  );

  useEffect(() => {
    mountedRef.current = true;
    loadEmployer();
    return () => {
      mountedRef.current = false;
    };
  }, [loadEmployer]);

  useEffect(() => {
    if (!employerId) return;

    let cancelled = false;

    async function loadAll() {
      try {
        setApiError(null);
        setSchedulesLoading(true);
        setAppointmentsLoading(true);
        setUpdatesLoading(true);

        const [schedulesRes, appointmentsRes, updatesRes] = await Promise.all([
          api.post("/employer/list-schedules", { employer_id: employerId }),
          api.post("/employer/list-appointments", { employer_id: employerId }),
          api.post("/employer/check-updates", { employer_id: employerId, last_check: null }),
        ]);

        if (cancelled || !mountedRef.current) return;

        setSchedules(sortSchedules(schedulesRes.data));
        setAppointments(appointmentsRes.data?.appointments || []);
        setUpdates(updatesRes.data || null);
        setLastCheck(updatesRes.data?.checked_at || new Date().toISOString());
      } catch (e) {
        if (!cancelled && mountedRef.current) {
          setApiError(parseApiError(e, "Erro ao carregar horários, agendamentos ou atualizações."));
        }
      } finally {
        if (!cancelled && mountedRef.current) {
          setSchedulesLoading(false);
          setAppointmentsLoading(false);
          setUpdatesLoading(false);
        }
      }
    }

    loadAll();

    return () => {
      cancelled = true;
    };
  }, [employerId]);

  const schedulesByDay = useMemo(() => {
    const map = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    };

    schedules.forEach((s) => {
      if (map[s.day_of_week]) map[s.day_of_week].push(s);
    });

    Object.keys(map).forEach((k) => {
      map[k] = map[k].sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)));
    });

    return map;
  }, [schedules]);

  const handleAddScheduleLocal = useCallback(() => {
    clearAlerts();

    setSchedules((prev) =>
      sortSchedules([
        ...prev,
        {
          id: `tmp-${Date.now()}`,
          day_of_week: addDay,
          start_time: toHM(addStart),
          end_time: toHM(addEnd),
          __local: true,
        },
      ])
    );
  }, [addDay, addStart, addEnd, clearAlerts]);

  const handleRemoveSchedule = useCallback(
    async (schedule) => {
      clearAlerts();

      try {
        if (schedule?.__local) {
          setSchedules((prev) => prev.filter((s) => s !== schedule));
          return;
        }

        if (!schedule?.id) return;

        setDeletingSchedule(true);

        await api.delete(`/employer/delete-schedule/${schedule.id}`);

        if (mountedRef.current) {
          setSchedules((prev) => prev.filter((s) => s.id !== schedule.id));
          setActionMessage("Horário removido com sucesso.");
        }
      } catch (e) {
        if (mountedRef.current) {
          const data = e?.response?.data;
          setFieldErrors(data?.errors || null);
          setApiError(parseApiError(e, "Erro ao remover horário."));
        }
      } finally {
        if (mountedRef.current) setDeletingSchedule(false);
      }
    },
    [clearAlerts]
  );

  const handleSaveSchedules = useCallback(async () => {
    if (!employerId) return;

    clearAlerts();
    setSavingSchedules(true);

    try {
      const payload = schedules
        .map(normalizeSchedule)
        .filter((s) => s?.day_of_week && s?.start_time && s?.end_time)
        .map((s) => ({
          day_of_week: s.day_of_week,
          start_time: toHM(s.start_time),
          end_time: toHM(s.end_time),
        }));

      await api.post("/employer/save-schedules", {
        employer_id: employerId,
        schedules: payload,
      });

      const res = await api.post("/employer/list-schedules", { employer_id: employerId });

      if (mountedRef.current) {
        setSchedules(sortSchedules(res.data));
        setActionMessage("Horários salvos com sucesso.");
      }
    } catch (e) {
      if (mountedRef.current) {
        const data = e?.response?.data;
        setFieldErrors(data?.errors || null);
        setApiError(parseApiError(e, "Erro ao salvar horários."));
      }
    } finally {
      if (mountedRef.current) setSavingSchedules(false);
    }
  }, [employerId, schedules, clearAlerts]);

  const handleReserveSchedule = useCallback(
    async ({ date, type, start_time, end_time }) => {
      if (!employerId) return;

      clearAlerts();
      setReserving(true);

      try {
        const res = await api.post("/employer/reserve-schedule", {
          employer_id: employerId,
          date,
          type,
          start_time: start_time ? toHM(start_time) : start_time,
          end_time: end_time ? toHM(end_time) : end_time,
        });

        if (mountedRef.current) setActionMessage(res.data?.message || "Horário reservado com sucesso.");

        await loadSchedules(employerId);
      } catch (e) {
        if (mountedRef.current) {
          const data = e?.response?.data;
          setFieldErrors(data?.errors || null);
          setApiError(parseApiError(e, "Erro ao reservar horário."));
        }
      } finally {
        if (mountedRef.current) setReserving(false);
      }
    },
    [employerId, clearAlerts, loadSchedules]
  );

  const handleRefresh = useCallback(async () => {
    if (!employerId) return;
    clearAlerts();
    await Promise.all([loadSchedules(employerId), loadAppointments(employerId), loadUpdates(employerId, null)]);
  }, [employerId, clearAlerts, loadSchedules, loadAppointments, loadUpdates]);

  const fmtOrderSP = (dt) =>
    new Date(dt).toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      dateStyle: "short",
      timeStyle: "short",
    });

  const heroData = useMemo(
    () => ({
      logo: null,
      background: null,
      title: "Painel do Profissional",
      subtitle: "Gerencie seus horários e agendamentos",
      description: null,
      metrics: [
        updates?.kpis?.total != null ? { label: "Total", value: updates.kpis.total } : null,
        updates?.kpis?.today != null ? { label: "Hoje", value: updates.kpis.today } : null,
        updates?.kpis?.tomorrow != null ? { label: "Amanhã", value: updates.kpis.tomorrow } : null,
        updates?.kpis?.value != null
          ? {
              label: "Valor",
              value: Number(updates.kpis.value || 0).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              }),
            }
          : null,
      ].filter(Boolean),
    }),
    [updates]
  );

  return {
    employerId,

    activeTab,
    setActiveTab,

    loading,
    apiError,
    actionMessage,
    fieldErrors,

    schedulesLoading,
    appointmentsLoading,
    updatesLoading,

    schedules,
    schedulesByDay,
    appointments,

    updates,
    lastCheck,

    addDay,
    setAddDay,
    addStart,
    setAddStart,
    addEnd,
    setAddEnd,

    savingSchedules,
    deletingSchedule,
    reserving,

    heroData,

    handleAddScheduleLocal,
    handleRemoveSchedule,
    handleSaveSchedules,
    handleReserveSchedule,
    handleRefresh,

    loadSchedules,
    loadAppointments,
    loadUpdates,

    fmtOrderSP,
  };
}
