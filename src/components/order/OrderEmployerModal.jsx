// src/components/order/OrderEmployerModal.jsx
import React, { useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import { Modal, ListGroup } from "react-bootstrap";
import useImageUtils from "../../hooks/useImageUtils";
import GlobalButton from "../GlobalButton";

export default function OrderEmployerModal({
  show,
  onHide,
  employers = [],
  onSelect,
}) {
  const { imageUrl } = useImageUtils();

  const buildInitials = useCallback((name) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    return parts.length === 1
      ? parts[0][0].toUpperCase()
      : parts[0][0].toUpperCase() + parts.at(-1)[0].toUpperCase();
  }, []);

  const buildPlaceholder = useCallback(
    (name) => {
      const initials = buildInitials(name);
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#0b1c2d" />
              <stop offset="100%" stop-color="#020617" />
            </linearGradient>
          </defs>
          <rect width="200" height="200" rx="100" ry="100" fill="url(#g)" />
          <text
            x="50%"
            y="54%"
            text-anchor="middle"
            dominant-baseline="middle"
            font-size="72"
            font-weight="700"
            fill="#e5e7eb"
            font-family="Inter, Arial, sans-serif"
            letter-spacing="2"
          >
            ${initials}
          </text>
        </svg>
      `;
      return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    },
    [buildInitials]
  );

  const resolvedEmployers = useMemo(() => {
    return employers.map((e) => {
      const u = e.user || {};
      const name = `${u.first_name || ""} ${u.last_name || ""}`.trim();

      const paths = [
        u.image,
        u.avatar,
        u.images?.avatar,
        Array.isArray(u.images?.gallery) ? u.images.gallery[0] : null,
      ];

      let image = null;
      for (const p of paths) {
        const url = imageUrl(p);
        if (url) {
          image = url;
          break;
        }
      }

      if (!image) {
        image = buildPlaceholder(name);
      }

      return {
        employer: e,
        name,
        email: u.email,
        image,
      };
    });
  }, [employers, imageUrl, buildPlaceholder]);

  const handleSelect = (employer) => {
    onSelect(employer);
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} centered size="md">
      <Modal.Header closeButton>
        <Modal.Title>Selecionar colaborador</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <ListGroup>
          {resolvedEmployers.map(({ employer, name, email, image }) => (
            <ListGroup.Item
              key={employer.id}
              className="d-flex align-items-center gap-3"
              action
              onClick={() => handleSelect(employer)}
            >
              <img
                src={image}
                alt={name}
                width={48}
                height={48}
                style={{
                  borderRadius: "50%",
                  objectFit: "cover",
                  flexShrink: 0,
                }}
              />

              <div className="flex-grow-1">
                <strong>{name}</strong>
                {email && (
                  <div className="text-muted small">{email}</div>
                )}
              </div>
            </ListGroup.Item>
          ))}

          {!resolvedEmployers.length && (
            <div className="text-muted text-center py-3">
              Nenhum colaborador disponível.
            </div>
          )}
        </ListGroup>
      </Modal.Body>

      <Modal.Footer>
        <GlobalButton variant="secondary" onClick={onHide}>
          Fechar
        </GlobalButton>
      </Modal.Footer>
    </Modal>
  );
}

OrderEmployerModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  employers: PropTypes.array,
  onSelect: PropTypes.func.isRequired,
};
