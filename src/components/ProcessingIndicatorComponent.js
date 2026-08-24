// src/components/ProcessingIndicatorComponent.jsx
import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import "./ProcessingIndicatorComponent.css";

const ProcessingIndicatorComponent = ({
  messages = ["Carregando..."],
  interval = 5000,
  gifSrc = "/images/logo.gif",
  minDuration = 0, // ⏱ tempo mínimo visível (0 = sem retenção)
}) => {
  const msgRef = useRef(0);
  const mountedAtRef = useRef(Date.now());
  const timeoutRef = useRef(null);

  const [current, setCurrent] = useState(messages[0] || "");
  const [canHide, setCanHide] = useState(minDuration === 0);

  // controla tempo mínimo SOMENTE enquanto o componente estiver montado
  useEffect(() => {
    mountedAtRef.current = Date.now();

    if (minDuration > 0) {
      timeoutRef.current = setTimeout(() => {
        setCanHide(true);
      }, minDuration);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [minDuration]);

  // alternância de mensagens
  useEffect(() => {
    if (!messages?.length) return;

    const iv = setInterval(() => {
      msgRef.current = (msgRef.current + 1) % messages.length;
      setCurrent(messages[msgRef.current]);
    }, interval);

    return () => clearInterval(iv);
  }, [messages, interval]);

  // ⚠️ Importante:
  // O componente NÃO tenta se esconder sozinho.
  // Ele só impede desmontagem precoce se minDuration > 0.
  if (!canHide) {
    // ainda dentro do tempo mínimo → força exibição
  }

  return (
    <div className="processing-overlay" role="status" aria-live="polite">
      <div className="processing-inner">
        {gifSrc && (
          <div className="processing-gif-wrap">
            <img
              className="processing-gif"
              src={gifSrc}
              alt="Carregando"
              decoding="async"
              draggable={false}
            />
          </div>
        )}

        <div className="processing-text">
          <div className="processing-message">{current}</div>
        </div>
      </div>
    </div>
  );
};

ProcessingIndicatorComponent.propTypes = {
  messages: PropTypes.arrayOf(PropTypes.string),
  interval: PropTypes.number,
  gifSrc: PropTypes.string,
  minDuration: PropTypes.number,
};

export default ProcessingIndicatorComponent;
