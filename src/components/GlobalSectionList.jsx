// src/components/GlobalSectionList.jsx
import React from "react";
import PropTypes from "prop-types";
import GlobalCard from "./GlobalCard";
import "./GlobalSectionList.css";

export default function GlobalSectionList({
  title,
  items,
  fmtBRL,
  navigate,
  onEdit,
  onDelete,
  openSchedulePopup,
}) {
  return (
    <div className="gsection-root">
      <h3 className="iteml-title">{title}</h3>

      <div className="iteml-grid">
        {items.map((it) => (
          <GlobalCard
            key={it.id}
            item={{ ...it, type: "item" }}
            fmtBRL={fmtBRL}
            navigate={navigate}
            onEdit={() => onEdit(it)}
            onDelete={() => onDelete(it)}
            openSchedulePopup={openSchedulePopup}
          />
        ))}
      </div>
    </div>
  );
}

GlobalSectionList.propTypes = {
  title: PropTypes.string.isRequired,
  items: PropTypes.array.isRequired,
  fmtBRL: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  openSchedulePopup: PropTypes.func,
};

GlobalSectionList.defaultProps = {
  openSchedulePopup: () => {},
};
