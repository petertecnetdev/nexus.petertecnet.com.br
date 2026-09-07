import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import "./ProcessingIndicatorComponent.css";

const DEFAULT_MESSAGES = [
  "Organizando seu catálogo com calma…",
  "Conectando produtos, pedidos e gestão…",
  "Carregando somente o que você precisa…",
  "Quase lá — a Nexus já está abrindo.",
];

export default function ProcessingIndicatorComponent({
  messages = DEFAULT_MESSAGES,
  interval = 2600,
  logoSrc = "/images/logo.png",
  compact = false,
}) {
  const safeMessages = useMemo(
    () => (Array.isArray(messages) && messages.filter(Boolean).length ? messages.filter(Boolean) : DEFAULT_MESSAGES),
    [messages],
  );
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
    if (safeMessages.length < 2) return undefined;

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % safeMessages.length);
    }, interval);

    return () => window.clearInterval(timer);
  }, [interval, safeMessages]);

  const currentMessage = safeMessages[index] || safeMessages[0] || "Carregando…";

  return (
    <div
      className={`processing-overlay${compact ? " processing-overlay--compact" : ""}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={currentMessage}
    >
      <div className="processing-ambient" aria-hidden="true">
        <i className="processing-spark processing-spark--one" />
        <i className="processing-spark processing-spark--two" />
        <i className="processing-spark processing-spark--three" />
      </div>

      <div className="processing-card">
        <div className="processing-loader" aria-hidden="true">
          <div className="processing-orbit processing-orbit--outer" />
          <div className="processing-orbit processing-orbit--inner" />
          <div className="processing-logo-shell">
            <img className="processing-logo" src={logoSrc} alt="" draggable={false} />
          </div>
          <span className="processing-pulse" />
        </div>

        <div className="processing-copy">
          <span className="processing-kicker">Peter Tecnet</span>
          <strong>Nexus</strong>
          <span className="processing-message" key={currentMessage}>{currentMessage}</span>
        </div>

        <div className="processing-progress" aria-hidden="true">
          <span />
        </div>

        <div className="processing-beat" aria-hidden="true">
          <i /><i /><i /><i /><i />
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
