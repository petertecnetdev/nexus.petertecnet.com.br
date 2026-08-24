// src/components/order/OrderItemsModal.jsx
import React, { useMemo, useCallback, useState } from "react";
import PropTypes from "prop-types";
import { Modal, ListGroup } from "react-bootstrap";

export default function OrderItemsModal({
  show,
  onHide,
  items = [],
  selectedItems = {},
  toggleItem,
}) {
  const buildInitials = useCallback((name) => {
    if (!name) return "?";
    const p = name.trim().split(" ");
    return p.length === 1
      ? p[0][0].toUpperCase()
      : p[0][0].toUpperCase() + p.at(-1)[0].toUpperCase();
  }, []);

  const buildPlaceholder = useCallback((name) => {
    const initials = buildInitials(name);
    return `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#0b1c2d"/>
            <stop offset="100%" stop-color="#020617"/>
          </linearGradient>
        </defs>
        <rect width="200" height="200" rx="16" fill="url(#g)"/>
        <text x="50%" y="54%" text-anchor="middle"
          dominant-baseline="middle"
          font-size="64"
          font-weight="700"
          fill="#e5e7eb">${initials}</text>
      </svg>
    `)}`;
  }, [buildInitials]);

  const resolvedItems = useMemo(() => {
    return items.map((item) => ({
      ...item,
      selected: !!selectedItems[item.id],
      finalImage:
        typeof item.image === "string" && item.image.startsWith("http")
          ? item.image
          : null,
    }));
  }, [items, selectedItems]);

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Selecionar serviços</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <ListGroup>
          {resolvedItems.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              selected={item.selected}
              onClick={() => toggleItem(item)}
              placeholder={buildPlaceholder(item.name)}
            />
          ))}

          {!resolvedItems.length && (
            <div className="text-muted text-center py-3">
              Nenhum serviço disponível.
            </div>
          )}
        </ListGroup>
      </Modal.Body>
    </Modal>
  );
}

function ItemRow({ item, selected, onClick, placeholder }) {
  const [broken, setBroken] = useState(false);

  const src =
    !broken && item.finalImage ? item.finalImage : placeholder;

  return (
    <ListGroup.Item
      action
      active={selected}
      onClick={onClick}
      className="d-flex align-items-center gap-3"
    >
      <img
        src={src}
        alt={item.name}
        width={56}
        height={56}
        onError={() => setBroken(true)}
        style={{
          borderRadius: 12,
          objectFit: "cover",
          flexShrink: 0,
        }}
      />

      <div className="flex-grow-1">
        <div className="fw-semibold">{item.name}</div>
        <div className="text-muted small">
          R$ {Number(item.price).toFixed(2).replace(".", ",")}
        </div>
      </div>
    </ListGroup.Item>
  );
}

ItemRow.propTypes = {
  item: PropTypes.object.isRequired,
  selected: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  placeholder: PropTypes.string.isRequired,
};

OrderItemsModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  items: PropTypes.array,
  selectedItems: PropTypes.object,
  toggleItem: PropTypes.func.isRequired,
};
