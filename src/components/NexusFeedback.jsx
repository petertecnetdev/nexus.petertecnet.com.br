import React from "react";
import PropTypes from "prop-types";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaTimesCircle,
} from "react-icons/fa";

import "./NexusFeedback.css";

const ICONS = {
  error: FaTimesCircle,
  success: FaCheckCircle,
  warning: FaExclamationTriangle,
  info: FaInfoCircle,
  neutral: FaInfoCircle,
};

const DEFAULT_TITLES = {
  error: "Não foi possível concluir",
  success: "Tudo certo",
  warning: "Atenção",
  info: "Informação",
  neutral: "Aviso",
};

export default function NexusFeedback({
  type = "info",
  title,
  children,
  actionLabel,
  onAction,
  compact = false,
  className = "",
}) {
  const normalizedType = ICONS[type] ? type : "info";
  const Icon = ICONS[normalizedType];

  return (
    <div
      className={`nx-feedback nx-feedback--${normalizedType}${compact ? " nx-feedback--compact" : ""} ${className}`.trim()}
      role={normalizedType === "error" ? "alert" : "status"}
      aria-live={normalizedType === "error" ? "assertive" : "polite"}
    >
      <div className="nx-feedback__icon" aria-hidden="true">
        <Icon />
      </div>

      <div className="nx-feedback__content">
        <strong className="nx-feedback__title">
          {title || DEFAULT_TITLES[normalizedType]}
        </strong>
        {children && <div className="nx-feedback__message">{children}</div>}
      </div>

      {actionLabel && onAction && (
        <button type="button" className="nx-feedback__action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

NexusFeedback.propTypes = {
  type: PropTypes.oneOf(["error", "success", "warning", "info", "neutral"]),
  title: PropTypes.string,
  children: PropTypes.node,
  actionLabel: PropTypes.string,
  onAction: PropTypes.func,
  compact: PropTypes.bool,
  className: PropTypes.string,
};
