import React, { useState, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import { Form, ListGroup, Spinner } from "react-bootstrap";
import useImageUtils from "../../hooks/useImageUtils";

export default function OrderClientSearch({
  searchClients,
  clients = [],
  searching = false,
  selectedClient,
  onSelect,
  onClear,
}) {
  const { imageUrl } = useImageUtils();
  const [query, setQuery] = useState("");

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

  const resolvedClients = useMemo(() => {
    return clients.map((c) => {
      const name = `${c.first_name || ""} ${c.last_name || ""}`.trim();

      const paths = [
        c.image,
        c.avatar,
        c.images?.avatar,
        Array.isArray(c.images?.gallery) ? c.images.gallery[0] : null,
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
        client: c,
        name,
        email: c.email,
        image,
      };
    });
  }, [clients, imageUrl, buildPlaceholder]);

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    searchClients(value);
  };

  if (selectedClient) return null;

  return (
    <div className="position-relative">
      <Form.Control
        type="text"
        placeholder="Buscar cliente por nome, email ou CPF"
        value={query}
        onChange={handleChange}
        autoComplete="off"
      />

      {searching && (
        <div className="text-center mt-2">
          <Spinner animation="border" size="sm" />
        </div>
      )}

      {!!resolvedClients.length && (
        <ListGroup className="position-absolute w-100 mt-1 shadow z-3">
          {resolvedClients.map(({ client, name, email, image }) => (
            <ListGroup.Item
              key={client.id}
              action
              onClick={() => {
                onSelect(client);
                setQuery("");
              }}
              className="d-flex align-items-center gap-3"
            >
              <img
                src={image}
                alt={name}
                width={40}
                height={40}
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
        </ListGroup>
      )}
    </div>
  );
}

OrderClientSearch.propTypes = {
  searchClients: PropTypes.func.isRequired,
  clients: PropTypes.array,
  searching: PropTypes.bool,
  selectedClient: PropTypes.object,
  onSelect: PropTypes.func.isRequired,
  onClear: PropTypes.func,
};
