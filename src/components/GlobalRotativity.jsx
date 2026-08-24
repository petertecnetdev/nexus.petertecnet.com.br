// src/components/GlobalRotativity.jsx
import React from "react";
import PropTypes from "prop-types";
import GlobalCarousel from "./GlobalCarousel";
import "./GlobalRotativity.css";

export default function GlobalRotativity({
  otherEstablishments = [],
  otherEmployers = [],
  otherItems = [],
  navigate,
  openSchedulePopup,
  fmtBRL,
}) {
  const hasAny =
    (otherEstablishments && otherEstablishments.length > 0) ||
    (otherEmployers && otherEmployers.length > 0) ||
    (otherItems && otherItems.length > 0);

  if (!hasAny) return null;

  return (
    <section className="grot-root">
      {otherEstablishments && otherEstablishments.length > 0 && (
        <GlobalCarousel
          title="Outros estabelecimentos"
          items={otherEstablishments}
          fmtBRL={fmtBRL}
          navigate={navigate}
          openSchedulePopup={openSchedulePopup}
          showSchedule
        />
      )}

      {otherEmployers && otherEmployers.length > 0 && (
        <GlobalCarousel
          title="Outros profissionais"
          items={otherEmployers}
          fmtBRL={fmtBRL}
          navigate={navigate}
          openSchedulePopup={openSchedulePopup}
          showSchedule
        />
      )}

      {otherItems && otherItems.length > 0 && (
        <GlobalCarousel
          title="Outros serviços e produtos"
          items={otherItems}
          fmtBRL={fmtBRL}
          navigate={navigate}
          openSchedulePopup={openSchedulePopup}
          showSchedule
        />
      )}
    </section>
  );
}

GlobalRotativity.propTypes = {
  otherEstablishments: PropTypes.array,
  otherEmployers: PropTypes.array,
  otherItems: PropTypes.array,
  navigate: PropTypes.func.isRequired,
  openSchedulePopup: PropTypes.func.isRequired,
  fmtBRL: PropTypes.func.isRequired,
};
