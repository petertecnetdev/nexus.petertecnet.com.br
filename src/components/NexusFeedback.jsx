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

const RESTRICTED_RESOURCE_MESSAGES = [
  "recurso não encontrado",
  "catálogo não encontrado",
  "estabelecimento não encontrado",
  "não encontramos esta empresa",
];

const normalizeFeedbackText = (value) =>
  typeof value === "string" ? value.trim().toLocaleLowerCase("pt-BR") : "";

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
  const messageText = normalizeFeedbackText(children);
  const isUnavailableResourceMessage = RESTRICTED_RESOURCE_MESSAGES.some(
    (message) => messageText.includes(message)
  );
  const isRestrictedEstablishment =
    normalizedType === "error" &&
    title === "Empresa indisponível" &&
    isUnavailableResourceMessage;
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
  const feedbackRole =
    isRestrictedEstablishment || normalizedType !== "error" ? "status" : "alert";
  const feedbackLive =
    isRestrictedEstablishment || normalizedType !== "error"
      ? "polite"
      : "assertive";

  return (
    <div
      className={feedbackClassName}
      role={feedbackRole}
      aria-live={feedbackLive}
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
