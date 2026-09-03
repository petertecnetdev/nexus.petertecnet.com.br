import React from "react";
import PropTypes from "prop-types";
import {
  FaArrowRight,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaSearch,
  FaShieldAlt,
  FaSlidersH,
  FaStore,
} from "react-icons/fa";

import "./ResourceAvailabilityState.css";

const RESOURCE_LABELS = {
  establishment: "estabelecimento",
  catalog: "catálogo",
  item: "item",
};

function getCopy(availability, resourceType) {
  const label = RESOURCE_LABELS[resourceType] || "recurso";
  const reason = availability?.reason;
  const isOwner = availability?.viewer?.is_owner === true;

  if (reason === "not_public") {
    if (isOwner) {
      return {
        eyebrow: "Visibilidade desativada",
        title: `Seu ${label} está oculto para visitantes`,
        message:
          "Os links e QR Codes continuam válidos. Enquanto a visibilidade pública estiver desativada, visitantes verão apenas este aviso e nenhum dado privado será exibido.",
        icon: FaEyeSlash,
      };
    }

    return {
      eyebrow: "Visibilidade restrita",
      title: `Este ${label} não está disponível publicamente`,
      message:
        "O responsável desativou a exibição pública no momento. Informações, catálogo e itens permanecem protegidos até que a visibilidade seja reativada.",
      icon: FaLock,
    };
  }

  if (reason === "pending_approval") {
    return {
      eyebrow: isOwner ? "Publicação pendente" : "Ainda não publicado",
      title: isOwner
        ? `Seu ${label} está aguardando liberação`
        : `Este ${label} ainda não está disponível publicamente`,
      message: isOwner
        ? "Você pode revisar a pré-visualização enquanto a publicação passa pelo processo de liberação."
        : "A publicação ainda não foi concluída. Tente acessar novamente mais tarde.",
      icon: FaShieldAlt,
    };
  }

  if (reason === "disabled" || availability?.status === "unavailable") {
    return {
      eyebrow: "Indisponível",
      title: `Este ${label} não está mais disponível`,
      message:
        "O recurso foi desativado e não pode ser acessado por este link neste momento.",
      icon: FaStore,
    };
  }

  if (reason === "not_found" || availability?.status === "not_found") {
    return {
      eyebrow: "Link não encontrado",
      title: `Não encontramos este ${label}`,
      message:
        "O endereço pode estar incorreto, ter sido alterado ou o recurso pode não existir mais.",
      icon: FaSearch,
    };
  }

  return {
    eyebrow: "Não foi possível carregar",
    title: `Não conseguimos acessar este ${label} agora`,
    message:
      "Pode ter ocorrido uma falha temporária de conexão ou serviço. Tente novamente em instantes.",
    icon: FaShieldAlt,
  };
}

export default function ResourceAvailabilityState({
  availability,
  resourceType = "establishment",
  onExplore,
  onManage,
  onPreview,
  onRetry,
}) {
  const copy = getCopy(availability, resourceType);
  const Icon = copy.icon;
  const viewer = availability?.viewer || {};
  const isTechnicalError =
    availability?.status === "technical_error" ||
    availability?.reason === "technical_error";

  return (
    <section
      className="resource-availability"
      role={isTechnicalError ? "alert" : "status"}
      aria-live={isTechnicalError ? "assertive" : "polite"}
    >
      <div className="resource-availability__glow" aria-hidden="true" />
      <div className="resource-availability__icon" aria-hidden="true">
        <Icon />
      </div>

      <div className="resource-availability__content">
        <span className="resource-availability__eyebrow">
          <FaShieldAlt /> {copy.eyebrow}
        </span>
        <h1>{copy.title}</h1>
        <p>{copy.message}</p>

        {availability?.reason === "not_public" && (
          <div className="resource-availability__note">
            <FaLock aria-hidden="true" />
            <span>
              A configuração de privacidade é respeitada sem invalidar o endereço
              original. Quando a publicação for reativada, o mesmo link e QR Code
              voltarão a abrir o conteúdo normalmente.
            </span>
          </div>
        )}

        <div className="resource-availability__actions">
          {viewer.can_manage && onManage && (
            <button type="button" className="resource-availability__primary" onClick={onManage}>
              <FaSlidersH /> Gerenciar visibilidade
            </button>
          )}
          {viewer.can_preview && onPreview && (
            <button type="button" className="resource-availability__secondary" onClick={onPreview}>
              <FaEye /> Ver pré-visualização privada
            </button>
          )}
          {isTechnicalError && onRetry && (
            <button type="button" className="resource-availability__primary" onClick={onRetry}>
              Tentar novamente <FaArrowRight />
            </button>
          )}
          {onExplore && (
            <button type="button" className="resource-availability__secondary" onClick={onExplore}>
              Explorar a Nexus <FaArrowRight />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

ResourceAvailabilityState.propTypes = {
  availability: PropTypes.shape({
    status: PropTypes.string,
    reason: PropTypes.string,
    viewer: PropTypes.shape({
      is_owner: PropTypes.bool,
      can_manage: PropTypes.bool,
      can_preview: PropTypes.bool,
      resource_id: PropTypes.number,
    }),
  }),
  resourceType: PropTypes.oneOf(["establishment", "catalog", "item"]),
  onExplore: PropTypes.func,
  onManage: PropTypes.func,
  onPreview: PropTypes.func,
  onRetry: PropTypes.func,
};
