import React from "react";
import PropTypes from "prop-types";
import { Card, Badge, Image } from "react-bootstrap";
import { FaUserTie, FaCut, FaCheckCircle } from "react-icons/fa";
import "./EmployerTopItemClientCard.css";

export default function EmployerTopItemClientCard({ data, apiBaseUrl, navigate }) {
  if (!data || !data.top_item) return null;

  const { top_item, top_client_for_item } = data;

  const resolveImage = (path) => {
    if (!path) return "/images/item-placeholder.png";
    if (path.startsWith("http")) return path;
    return `${apiBaseUrl.replace(/\/$/, "")}/${path.replace(/^\/+/, "")}`;
  };

  const resolveAvatar = (path) => {
    if (!path) return "/images/avatar-placeholder.png";
    if (path.startsWith("http")) return path;
    return `${apiBaseUrl.replace(/\/$/, "")}/${path.replace(/^\/+/, "")}`;
  };

  return (
    <Card className="emp-topcard">
      <Card.Header className="emp-topcard-header">
        <FaCheckCircle className="me-2 text-info" />
        <span>Desempenho em Destaque</span>
      </Card.Header>

      <Card.Body className="emp-topcard-body">
        <div className="emp-topcard-item-section">
          <h6 className="text-light mb-2">
            <FaCut className="me-2 text-warning" />
            Item mais atendido
          </h6>

          <div
            className="emp-topcard-item d-flex align-items-center cursor-pointer"
            onClick={() => navigate(`/item/${top_item.slug}`)}
          >
            <Image
              src={resolveImage(top_item.image)}
              onError={(e) => (e.target.src = "/images/item-placeholder.png")}
              alt={top_item.name}
              roundedCircle
              className="emp-topcard-item-img me-3"
            />
            <div>
              <div className="fw-semibold text-light">{top_item.name}</div>
              <div className="text-muted small">
                {top_item.total_attended} atendimentos
              </div>
            </div>
          </div>
        </div>

        {top_client_for_item && (
          <div className="emp-topcard-client-section mt-4">
            <h6 className="text-light mb-2">
              <FaUserTie className="me-2 text-success" />
              Cliente mais frequente neste item
            </h6>

            <div
              className="emp-topcard-client d-flex align-items-center cursor-pointer"
              onClick={() => navigate(`/user/view/${top_client_for_item.user_name}`)}
            >
              <Image
                src={resolveAvatar(top_client_for_item.avatar)}
                onError={(e) => (e.target.src = "/images/avatar-placeholder.png")}
                alt={top_client_for_item.name}
                roundedCircle
                className="emp-topcard-client-img me-3"
              />
              <div>
                <div className="fw-semibold text-light">
                  {top_client_for_item.name}
                </div>
                <div className="text-muted small">
                  {top_client_for_item.total_attended_for_item} atendimentos deste item
                </div>
              </div>
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

EmployerTopItemClientCard.propTypes = {
  data: PropTypes.object,
  apiBaseUrl: PropTypes.string.isRequired,
  navigate: PropTypes.func.isRequired,
};
