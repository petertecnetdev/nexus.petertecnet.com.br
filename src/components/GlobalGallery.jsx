// src/components/GlobalGallery.jsx
import React, { useState } from "react";
import PropTypes from "prop-types";
import { Row, Col, Modal } from "react-bootstrap";
import "./GlobalGallery.css";

export default function GlobalGallery({ images = [] }) {
  const [show, setShow] = useState(false);
  const [activeImg, setActiveImg] = useState(null);

  if (!Array.isArray(images) || images.length === 0) return null;

  const open = (img) => {
    setActiveImg(img);
    setShow(true);
  };

  const close = () => {
    setShow(false);
    setActiveImg(null);
  };

  return (
    <div className="global-gallery">
      <Row className="gy-3">
        {images.map((img, index) => (
          <Col key={index} xs={6} sm={4} md={3} lg={3}>
            <div className="gg-thumb" onClick={() => open(img.public_url)}>
              <img
                src={img.public_url}
                alt={img.type || "image"}
                className="gg-img"
                onError={(e) => (e.target.src = "/images/logo.png")}
              />
            </div>
          </Col>
        ))}
      </Row>

      <Modal show={show} onHide={close} centered size="lg" className="gg-modal">
        <Modal.Body className="p-0">
          {activeImg && (
            <img
              src={activeImg}
              alt="zoom"
              className="gg-modal-img"
              onError={(e) => (e.target.src = "/images/logo.png")}
            />
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}

GlobalGallery.propTypes = {
  images: PropTypes.arrayOf(
    PropTypes.shape({
      public_url: PropTypes.string,
      type: PropTypes.string,
    })
  ),
};
