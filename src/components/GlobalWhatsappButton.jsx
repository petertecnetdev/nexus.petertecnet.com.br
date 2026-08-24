// src/components/GlobalWhatsappButton.jsx
import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { FaWhatsapp } from "react-icons/fa";

export default function GlobalWhatsappButton({ link, message }) {
  const finalLink = useMemo(() => {
    if (!link) return null;

    const match = link.match(/wa\.me\/(\d+)/);
    if (!match) return link;

    const phone = match[1];
    const text = message ? `?text=${encodeURIComponent(message)}` : "";

    return `https://wa.me/${phone}${text}`;
  }, [link, message]);

  if (!finalLink) return null;

  return (
    <a
      href={finalLink}
      target="_blank"
      rel="noreferrer"
      title="Chamar no WhatsApp"
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: "50%",
        backgroundColor: "#25D366",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
        zIndex: 9999,
        cursor: "pointer",
      }}
    >
      <FaWhatsapp size={28} color="#fff" />
    </a>
  );
}

GlobalWhatsappButton.propTypes = {
  link: PropTypes.string,
  message: PropTypes.string,
};
