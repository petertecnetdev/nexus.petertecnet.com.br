import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import "./ProcessingIndicatorComponent.css";

export default function ProcessingIndicatorComponent({
  messages = ["Carregando a Nexus…", "Preparando seu catálogo…"],
  interval = 2400,
  logoSrc = "/images/logo.png",
  compact = false,
}) {
  const messageIndex = useRef(0);
  const [currentMessage, setCurrentMessage] = useState(messages[0] || "Carregando…");

  useEffect(() => {
    if (!messages?.length || messages.length === 1) return undefined;

    const timer = window.setInterval(() => {
      messageIndex.current = (messageIndex.current + 1) % messages.length;
      setCurrentMessage(messages[messageIndex.current]);
    }, interval);

    return () => window.clearInterval(timer);
  }, [messages, interval]);

  return (
    <div
      className={`processing-overlay${compact ? " processing-overlay--compact" : ""}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="processing-loader">
        <div className="processing-orbit processing-orbit--outer" aria-hidden="true" />
        <div className="processing-orbit processing-orbit--inner" aria-hidden="true" />
        <div className="processing-logo-shell">
          <img className="processing-logo" src={logoSrc} alt="Nexus" draggable={false} />
        </div>
        <span className="processing-pulse" aria-hidden="true" />
      </div>

      <div className="processing-copy">
        <strong>Nexus</strong>
        <span>{currentMessage}</span>
        <div className="processing-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
      </div>
    </div>
  );
}

ProcessingIndicatorComponent.propTypes = {
  messages: PropTypes.arrayOf(PropTypes.string),
  interval: PropTypes.number,
  logoSrc: PropTypes.string,
  compact: PropTypes.bool,
};
