import React, { useState } from "react";
import GlobalDateCarousel from "../GlobalDateCarousel";
import dayjs from "dayjs";
import tz from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import localeData from "dayjs/plugin/localeData";
import "dayjs/locale/pt-br";
import "./steps.css";

dayjs.extend(utc);
dayjs.extend(tz);
dayjs.extend(localeData);
dayjs.locale("pt-br");

export default function StepDate({ onChange }) {
  const [date, setDate] = useState(null);

  return (
    <div className="step-container">
      <h4>Escolha a Data</h4>
      <GlobalDateCarousel
        selectedDate={date}
        onChange={(d) => {
          const normalized = dayjs(d).format("YYYY-MM-DD");
          setDate(normalized);
          onChange(normalized);
        }}
        daysToShow={14}
        locale="pt-br"
      />
    </div>
  );
}
