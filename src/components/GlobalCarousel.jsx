import React, { useRef, useLayoutEffect, useState } from "react";
import { Card, Modal } from "react-bootstrap";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import PropTypes from "prop-types";
import LoginFormComponent from "./auth/LoginFormComponent";
import GlobalCard from "./GlobalCard";
import "./GlobalCarousel.css";

export default function GlobalCarousel({
  title,
  items,
  fmtBRL,
  openSchedulePopup,
  navigate,
  showSchedule,
}) {
  const trackRef = useRef(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingSchedule, setPendingSchedule] = useState(null);

  useLayoutEffect(() => {
    const t = setTimeout(() => {
      if (trackRef.current) trackRef.current.scrollLeft = 0;
    }, 80);
    return () => clearTimeout(t);
  }, []);

  const isAuthenticated = () => !!localStorage.getItem("token");
  const canSchedule = showSchedule && typeof openSchedulePopup === "function";

  const handleScheduleClick = (source) => {
    if (!canSchedule) return;

    if (!isAuthenticated()) {
      setPendingSchedule(source);
      setShowLoginModal(true);
      return;
    }

    openSchedulePopup(source);
  };

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    if (pendingSchedule && canSchedule) {
      openSchedulePopup(pendingSchedule);
      setPendingSchedule(null);
    }
  };

  const scroll = (direction) => {
    if (!trackRef.current) return;
    const offset = direction === "left" ? -260 : 260;
    trackRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <>
      <Card
        bg="dark"
        text="light"
        className="mb-4 shadow-sm border-0 rounded-4 overflow-hidden global-carousel"
      >
        <Card.Header className="bg-black text-center py-3 border-0">
          <h5 className="fw-bold text-uppercase mb-0 text-light">
            {title}
          </h5>
        </Card.Header>
        <Card.Body className="p-3 position-relative">
          <button
            type="button"
            className="carousel-arrow left"
            onClick={() => scroll("left")}
          >
            <FaChevronLeft />
          </button>

          <button
            type="button"
            className="carousel-arrow right"
            onClick={() => scroll("right")}
          >
            <FaChevronRight />
          </button>

          <div ref={trackRef} className="carousel-track-static">
            {items.map((it, idx) => (
              <div
                key={it.id || idx}
                className="global-carousel-item-wrapper"
              >
                <GlobalCard
                  item={it}
                  fmtBRL={fmtBRL}
                  navigate={navigate}
                  showSchedule={canSchedule}
                  openSchedulePopup={canSchedule ? handleScheduleClick : null}
                />
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>

      <Modal
        show={showLoginModal}
        onHide={() => setShowLoginModal(false)}
        centered
        size="md"
        backdrop="static"
        className="login-modal"
      >
        <Modal.Body className="bg-dark text-light p-4 rounded-3">
          <h5 className="text-center mb-3">Faça login para continuar</h5>
          <LoginFormComponent onSuccess={handleLoginSuccess} />
        </Modal.Body>
      </Modal>
    </>
  );
}

GlobalCarousel.propTypes = {
  title: PropTypes.string.isRequired,
  items: PropTypes.array.isRequired,
  fmtBRL: PropTypes.func.isRequired,
  openSchedulePopup: PropTypes.func,
  navigate: PropTypes.func.isRequired,
  showSchedule: PropTypes.bool,
};

GlobalCarousel.defaultProps = {
  showSchedule: false,
  openSchedulePopup: null,
};
