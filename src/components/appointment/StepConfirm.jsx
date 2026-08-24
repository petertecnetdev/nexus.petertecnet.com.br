import React, { useEffect } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import tz from "dayjs/plugin/timezone";
import "./steps.css";

dayjs.extend(utc);
dayjs.extend(tz);

export default function StepConfirm({ services, employer, date, time, total, duration }) {
  const fmtBRL = (v) => `R$ ${Number(v || 0).toFixed(2).replace(".", ",")}`;

 // 🕒 Força exibição exata sem alterar o dia
// 🕒 Força exibição exata sem alterar o dia escolhido
// 🕒 Corrige completamente o deslocamento de dia
let formattedDate = "";
try {
  if (date) {
    let localDate;

    if (typeof date === "string") {
      // 🔹 Se for string, forçamos a interpretar como data local pura
      const [y, m, d] = date.split("-");
      localDate = new Date(Number(y), Number(m) - 1, Number(d));
    } else if (date instanceof Date) {
      // 🔹 Se já for objeto Date, clonamos sem UTC
      localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    } else {
      localDate = new Date(date);
    }

    formattedDate = localDate.toLocaleDateString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    });
  }
} catch (err) {
  console.error("❌ Erro ao formatar data:", err);
}

  // 🔍 Log pra confirmar o que está vindo
  useEffect(() => {
    console.log("🧠 [StepConfirm] Debug data render:", {
      raw_date: date,
      parsed_dayjs: date ? dayjs(date).format() : null,
      formattedDate,
      browserTimezone: dayjs.tz.guess(),
    });
  }, [date]);

  return (
    <div className="step-container">
      <h4>Confirmar Agendamento</h4>
      <p><b>Profissional:</b> {employer?.user?.first_name || "—"}</p>
      <p><b>Data:</b> {formattedDate || "Data não informada"}</p>
      <p><b>Horário:</b> {time || "Horário não informado"}</p>
      <ul>
        {services.map((s) => (
          <li key={s.id || s.item_id}>
            {s.name} — {fmtBRL(s.price)}
          </li>
        ))}
      </ul>
      <hr />
      <p>
        <b>Total:</b> {fmtBRL(total)} | <b>Duração:</b> {duration} min
      </p>
    </div>
  );
}
