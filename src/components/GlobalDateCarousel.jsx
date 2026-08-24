import React, { useState, useEffect, useRef } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import tz from "dayjs/plugin/timezone";
import "dayjs/locale/pt-br";
import "./GlobalDateCarousel.css";

dayjs.extend(utc);
dayjs.extend(tz);
dayjs.locale("pt-br");

export default function GlobalDateCarousel({
  selectedDate,
  onChange,
  daysToShow = 14,
}) {
  const TZ = "America/Sao_Paulo";
  const [days, setDays] = useState([]);
  const trackRef = useRef(null);

  useEffect(() => {
    const hoje = dayjs().tz(TZ).startOf("day");

    const diasPT = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
    const mesesPT = [
      "JAN",
      "FEV",
      "MAR",
      "ABR",
      "MAI",
      "JUN",
      "JUL",
      "AGO",
      "SET",
      "OUT",
      "NOV",
      "DEZ",
    ];

    const arr = Array.from({ length: daysToShow }, (_, i) => {
      const d = hoje.add(i, "day");
      return {
        key: d.format("YYYY-MM-DD"),
        week: diasPT[d.day()],
        day: d.date(),
        month: mesesPT[d.month()],
      };
    });

    setDays(arr);
  }, [daysToShow]);

  const scroll = (direction) => {
    if (!trackRef.current) return;
    const offset = direction === "left" ? -300 : 300;
    trackRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  return (
    <div className="date-carousel">
      <button
        type="button"
        className="date-btn left"
        onClick={() => scroll("left")}
      >
        <FaChevronLeft />
      </button>

      <div className="date-track" ref={trackRef}>
        {days.map((d) => {
          const isActive = selectedDate === d.key;

          return (
            <div
              key={d.key}
              className={`date-item ${isActive ? "active" : ""}`}
              onClick={() => onChange(d.key)}
            >
              <div className="date-week">{d.week}</div>
              <div className="date-day">{d.day}</div>
              <div className="date-month">{d.month}</div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className="date-btn right"
        onClick={() => scroll("right")}
      >
        <FaChevronRight />
      </button>
    </div>
  );
}
