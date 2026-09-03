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
  "não está disponível publicamente",
  "ainda não está disponível publicamente",
];

const RESTRICTED_TITLES = ["Empresa indisponível", "Catálogo indisponível"];

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
  const isRestrictedResource =
    normalizedType === "error" &&
    RESTRICTED_TITLES.includes(title) &&
    isUnavailableResourceMessage;
  const isCatalog = title === "Catálogo indisponível";
  const resourceLabel = isCatalog ? "catálogo" : "estabelecimento";
  const Icon = isRestrictedResource ? FaLock : ICONS[normalizedType];
  const feedbackClassName = [
    "nx-feedback",
    `nx-feedback--${normalizedType}`,
    compact ? "nx-feedback--compact" : "",
    isRestrictedResource ? "nx-feedback--privacy" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const feedbackRole =
    isRestrictedResource || normalizedType !== "error" ? "status" : "alert";
  const feedbackLive =
    isRestrictedResource || normalizedType !== "error"
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
        {isRestrictedResource && (
          <span className="nx-feedback__eyebrow">
            <FaShieldAlt /> Visibilidade restrita
          </span>
        )}

        <strong className="nx-feedback__title">
          {isRestrictedResource
            ? `Este ${resourceLabel} não está disponível publicamente`
            : title || DEFAULT_TITLES[normalizedType]}
        </strong>

        {isRestrictedResource ? (
          <>
            <div className="nx-feedback__message">
              O responsável desativou a exibição pública no momento. Enquanto
              essa configuração estiver ativa, informações e itens permanecem
              protegidos para visitantes.
            </div>
            <div className="nx-feedback__privacy-note">
              <FaLock aria-hidden="true" />
              <span>
                O endereço e o QR Code continuam válidos. Quando a publicação
                for reativada, o mesmo link volta a abrir o conteúdo normalmente.
              </span>
            </div>
          </>
        ) : (
          children && <div className="nx-feedback__message">{children}</div>
        )}
      </div>

      {actionLabel && onAction && (
        <button type="button" className="nx-feedback__action" onClick={onAction}>
          {isRestrictedResource ? "Explorar a Nexus" : actionLabel}
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
