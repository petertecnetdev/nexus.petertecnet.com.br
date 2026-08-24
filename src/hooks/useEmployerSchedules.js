// src/hooks/useEmployerSchedules.js
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import Swal from "sweetalert2";
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

const toHM = (v) => {
  if (!v) return "";
  if (/^\d{2}:\d{2}:\d{2}$/.test(v)) return v.slice(0, 5);
  if (/^\d{2}:\d{2}$/.test(v)) return v;
  return String(v).slice(0, 5);
};

const normalize = (s) => ({
  ...s,
  start_time: toHM(s.start_time),
  end_time: toHM(s.end_time),
});

export default function useEmployerSchedules() {
  const mountedRef = useRef(true);

  const [employerId, setEmployerId] = useState(null);
  const [schedules, setSchedules] = useState([]);

  const [addDay, setAddDay] = useState("monday");
  const [addStart, setAddStart] = useState("09:00");
  const [addEnd, setAddEnd] = useState("18:00");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [apiError, setApiError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  const loadEmployer = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/auth/me");
      const emp = res.data?.employer || res.data?.user?.employer;
      if (mountedRef.current) setEmployerId(emp?.id || null);
    } catch {
      if (mountedRef.current) setEmployerId(null);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  const loadSchedules = useCallback(
    async (id) => {
      const eid = id || employerId;
      if (!eid) return;

      try {
        setLoading(true);
        const res = await api.post("/employer/list-schedules", {
          employer_id: eid,
        });
        if (mountedRef.current) {
          setSchedules(res.data.map(normalize));
        }
      } catch (e) {
        if (mountedRef.current) {
          setApiError(e?.response?.data?.error || "Erro ao carregar horários.");
        }
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    [employerId]
  );

  useEffect(() => {
    mountedRef.current = true;
    loadEmployer();
    return () => {
      mountedRef.current = false;
    };
  }, [loadEmployer]);

  useEffect(() => {
    if (employerId) loadSchedules(employerId);
  }, [employerId, loadSchedules]);

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
      map[k] = map[k].sort((a, b) =>
        String(a.start_time).localeCompare(String(b.start_time))
      );
    });

    return map;
  }, [schedules]);

  const handleAddScheduleLocal = useCallback(() => {
    setSchedules((prev) => [
      ...prev,
      {
        id: `tmp-${Date.now()}`,
        day_of_week: addDay,
        start_time: toHM(addStart),
        end_time: toHM(addEnd),
        __local: true,
      },
    ]);
  }, [addDay, addStart, addEnd]);

  const handleRemoveSchedule = useCallback(async (schedule) => {
    const confirm = await Swal.fire({
      title: "Remover horário?",
      text: `Deseja remover o horário ${schedule.start_time} – ${schedule.end_time}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sim, remover",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;

    if (schedule.__local) {
      setSchedules((prev) => prev.filter((s) => s !== schedule));
      return;
    }

    try {
      setDeleting(true);
      await api.delete(`/employer/delete-schedule/${schedule.id}`);
      setSchedules((prev) => prev.filter((s) => s.id !== schedule.id));
      setActionMessage("Horário removido com sucesso.");
    } catch (e) {
      setApiError(e?.response?.data?.error || "Erro ao remover horário.");
    } finally {
      setDeleting(false);
    }
  }, []);

  const handleSaveSchedules = useCallback(async () => {
    if (!employerId) return;

    const confirm = await Swal.fire({
      title: "Confirmar alterações?",
      text: "Deseja salvar os horários de atendimento?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Salvar",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;

    try {
      setSaving(true);
      setApiError(null);

      const payload = schedules
        .filter((s) => s.day_of_week && s.start_time && s.end_time)
        .map((s) => ({
          day_of_week: s.day_of_week,
          start_time: toHM(s.start_time),
          end_time: toHM(s.end_time),
        }));

      await api.post("/employer/save-schedules", {
        employer_id: employerId,
        schedules: payload,
      });

      await loadSchedules(employerId);
      setActionMessage("Horários salvos com sucesso.");
    } catch (e) {
      setApiError(e?.response?.data?.error || "Erro ao salvar horários.");
    } finally {
      setSaving(false);
    }
  }, [employerId, schedules, loadSchedules]);

  return {
    employerId,
    schedulesByDay,
    addDay,
    setAddDay,
    addStart,
    setAddStart,
    addEnd,
    setAddEnd,
    loading,
    saving,
    deleting,
    apiError,
    actionMessage,
    handleAddScheduleLocal,
    handleRemoveSchedule,
    handleSaveSchedules,
  };
}
