// src/utils/dateUtils.js
import { DateTime } from "luxon";

export const TZ = "America/Sao_Paulo";

export function normalizeDateLike(value) {
  if (!value) return null;
  if (DateTime.isDateTime(value)) return value; // já é DateTime
  if (value instanceof Date) return DateTime.fromJSDate(value).setZone(TZ);
  if (typeof value === "string") {
    // tenta criar a partir de SQL ou ISO
    const dt = DateTime.fromSQL(value, { zone: TZ });
    if (dt.isValid) return dt;
    const dtIso = DateTime.fromISO(value, { zone: TZ });
    if (dtIso.isValid) return dtIso;
  }
  return null;
}

export function toIsoDate(value) {
  const d = normalizeDateLike(value);
  if (!d) return "";
  return d.toISODate(); // YYYY-MM-DD
}

export function isSameDayISO(a, b) {
  const dateA = toIsoDate(a);
  const dateB = toIsoDate(b);
  return dateA === dateB;
}

export function toHourMin(value) {
  const d = normalizeDateLike(value);
  if (!d) return "";
  return d.toFormat("HH:mm");
}

export function weekdayPt(value) {
  const d = normalizeDateLike(value);
  if (!d) return "";
  return d.setLocale("pt-BR").toFormat("cccc");
}

export function shortPt(value) {
  const d = normalizeDateLike(value);
  if (!d) return "";
  return d.toFormat("dd/MM");
}

export function startOfDayISO(value) {
  const d = normalizeDateLike(value);
  if (!d) return "";
  return d.startOf("day").toISODate();
}

export function addDays(value, n) {
  const d = normalizeDateLike(value);
  if (!d) return null;
  return d.plus({ days: n });
}

export function fmtFriendlyDate(value) {
  const d = normalizeDateLike(value);
  if (!d) return "";

  const now = DateTime.now().setZone(TZ).startOf("day");
  const today = now;
  const tomorrow = now.plus({ days: 1 });
  const dateISO = d.startOf("day");

  const timeStr = toHourMin(d);

  if (dateISO.equals(today)) return `Hoje às ${timeStr}`;
  if (dateISO.equals(tomorrow)) return `Amanhã às ${timeStr}`;

  const diffDays = Math.floor(dateISO.diff(today, "days").days);

  if (diffDays > 1 && diffDays < 7) {
    return `${weekdayPt(d)} às ${timeStr}`;
  }

  const day = d.toFormat("dd");
  const month = d.setLocale("pt-BR").toFormat("LLLL");
  const year = d.year;
  return `${day} de ${month} de ${year} às ${timeStr}`;
}

// Hora de início e término
export function fmtTimeRange(startValue, durationMinutes) {
  const start = normalizeDateLike(startValue);
  if (!start) return "";
  const end = start.plus({ minutes: durationMinutes });
  return `${toHourMin(start)} - ${toHourMin(end)}`;
}
