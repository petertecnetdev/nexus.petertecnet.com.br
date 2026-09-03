// src/components/establishment/EstablishmentActionsBar.jsx
import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

export default function EstablishmentActionsBar({ establishment, onDelete, deleting }) {
  const presentationUrl = `/establishment/view/${establishment.slug}`;

  return (
    <div className="company-card__actions" aria-label={`Ações de ${establishment.fantasy || establishment.name}`}>
      <Link to={`/establishment/item/${establishment.slug}`} className="company-action company-action--primary">
        <i className="fas fa-boxes-stacked" aria-hidden="true" />
        <span>Itens</span>
      </Link>
      <Link to={presentationUrl} className="company-action">
        <i className="fas fa-arrow-up-right-from-square" aria-hidden="true" />
        <span>Ver</span>
      </Link>
      <Link to={`/establishment/update/${establishment.id}`} className="company-action">
        <i className="fas fa-pen" aria-hidden="true" />
        <span>Editar</span>
      </Link>
      <Link to={presentationUrl} className="company-action">
        <i className="fas fa-qrcode" aria-hidden="true" />
        <span>QR</span>
      </Link>
      <button
        type="button"
        className="company-action company-action--danger"
        onClick={onDelete}
        disabled={deleting}
      >
        <i className={deleting ? "fas fa-circle-notch fa-spin" : "fas fa-trash"} aria-hidden="true" />
        <span>{deleting ? "Excluindo" : "Excluir"}</span>
      </button>
    </div>
  );
}

EstablishmentActionsBar.propTypes = {
  establishment: PropTypes.shape({
    id: PropTypes.number.isRequired,
    slug: PropTypes.string.isRequired,
    name: PropTypes.string,
    fantasy: PropTypes.string,
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
  deleting: PropTypes.bool,
};

EstablishmentActionsBar.defaultProps = {
  deleting: false,
};
