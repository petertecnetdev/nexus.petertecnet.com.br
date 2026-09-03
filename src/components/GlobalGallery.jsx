// src/components/GlobalGallery.jsx
import React, { useState } from "react";
import PropTypes from "prop-types";
import { Row, Col, Modal } from "react-bootstrap";
import useImageUtils from "../hooks/useImageUtils";
import "./GlobalGallery.css";

export default function GlobalGallery({ images = [] }) {
  const [show, setShow] = useState(false);
  const [activeImg, setActiveImg] = useState(null);
  const { imageUrl } = useImageUtils();

  if (!Array.isArray(images) || images.length === 0) return null;

  const normalizedImages = images
    .map((img) => {
      const rawUrl = typeof img === "string"
        ? img
        : img?.public_url || img?.url || img?.path || null;
      const publicUrl = imageUrl(rawUrl);
      if (!publicUrl) return null;
      return {
        public_url: publicUrl,
        type: typeof img === "object" && img?.type ? img.type : "image",
      };
    })
    .filter(Boolean);

  if (normalizedImages.length === 0) return null;

  const open = (img) => {
    setActiveImg(img.public_url);
    setShow(true);
  };

  const close = () => {
    setShow(false);
    setActiveImg(null);
  };

  return (
    <div className="global-gallery">
      <Row className="gy-3">
        {normalizedImages.map((img, index) => (
          <Col key={`${img.public_url}-${index}`} xs={6} sm={4} md={3} lg={3}>
            <button
              type="button"
              className="gg-thumb"
              onClick={() => open(img)}
              aria-label={`Abrir imagem ${index + 1}`}
            >
              <img
                src={img.public_url}
                alt={img.type || "image"}
                className="gg-img"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/images/logo.png";
                }}
              />
            </button>
          </Col>
        ))}
      </Row>

      <Modal show={show} onHide={close} centered size="lg" className="gg-modal">
        <Modal.Body className="p-0">
          {activeImg && (
            <img
              src={activeImg}
              alt="Imagem ampliada"
              className="gg-modal-img"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/images/logo.png";
              }}
            />
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}

GlobalGallery.propTypes = {
  images: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        public_url: PropTypes.string,
        url: PropTypes.string,
        path: PropTypes.string,
        type: PropTypes.string,
      }),
    ])
  ),
};
