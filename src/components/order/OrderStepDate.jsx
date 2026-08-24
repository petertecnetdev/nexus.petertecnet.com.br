// src/components/order/steps/OrderStepDate.jsx
import React, { useState } from "react";
import PropTypes from "prop-types";
import dayjs from "dayjs";
import GlobalDateCarousel from "../GlobalDateCarousel";
import "./OrderStepDate.css";

export default function OrderStepDate({ onChange }) {
  const [date, setDate] = useState(null);

  return (
    <div className="order-step-container">
      <h4>Escolha a Data</h4>

      <GlobalDateCarousel
        selectedDate={date}
        daysToShow={14}
        onChange={(d) => {
          const normalized = dayjs(d).format("YYYY-MM-DD");
          setDate(normalized);
          onChange(normalized);
        }}
      />
    </div>
  );
}

OrderStepDate.propTypes = {
  onChange: PropTypes.func.isRequired,
};
