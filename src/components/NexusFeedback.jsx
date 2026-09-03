import React from "react";
import PropTypes from "prop-types";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaLock,
  FaShieldAlt,
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
  const isRestrictedEstablishment =
    normalizedType === "error" && title === "Empresa indisponível";
  const Icon = isRestrictedEstablishment ? FaLock : ICONS[normalizedType];
  const feedbackClassName = [
    "nx-feedback",
    `nx-feedback--${normalizedType}`,
    compact ? "nx-feedback--compact" : "",
    isRestrictedEstablishment ? "nx-feedback--privacy" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={feedbackClassName}
      role={
        isRestrictedEstablishment
          ? "status"
          : normalizedType === "error"
            ? "alert"
            : "status"
      }
      aria-live={
        isRestrictedEstablishment
          ? "polite"
          : normalizedType === "error"
            ? "assertive"
            : "polite"
      }
    >
      <div className="nx-feedback__icon" aria-hidden="true">
        <Icon />
      </div>

      <div className="nx-feedback__content">
        {isRestrictedEstablishment && (
          <span className="nx-feedback__eyebrow">
            <FaShieldAlt /> Visibilidade restrita
          </span>
        )}

        <strong className="nx-feedback__title">
          {isRestrictedEstablishment
            ? "Este estabelecimento não está disponível publicamente"
            : title || DEFAULT_TITLES[normalizedType]}
        </strong>

        {isRestrictedEstablishment ? (
          <>
            <div className="nx-feedback__message">
              O responsável pode ter desativado temporariamente a exibição
              pública deste perfil. Enquanto essa configuração estiver ativa,
              informações, catálogo e itens do estabelecimento ficam protegidos.
            </div>
            <div className="nx-feedback__privacy-note">
              <FaLock aria-hidden="true" />
              <span>
                A Nexus respeita a configuração de privacidade definida pelo
                responsável pelo estabelecimento.
              </span>
            </div>
          </>
        ) : (
          children && <div className="nx-feedback__message">{children}</div>
        )}
      </div>

      {actionLabel && onAction && (
        <button type="button" className="nx-feedback__action" onClick={onAction}>
          {isRestrictedEstablishment ? "Explorar a Nexus" : actionLabel}
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
