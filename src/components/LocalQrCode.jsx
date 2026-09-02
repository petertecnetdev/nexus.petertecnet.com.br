import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";

let qrRuntimePromise = null;

const loadQrRuntime = () => {
  if (typeof window === "undefined") return Promise.reject(new Error("QR runtime requires a browser"));
  if (window.QRCode) return Promise.resolve(window.QRCode);
  if (qrRuntimePromise) return qrRuntimePromise;

  qrRuntimePromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-nexus-qr-runtime="true"]');
    if (existing) {
      existing.addEventListener("load", () => window.QRCode ? resolve(window.QRCode) : reject(new Error("QR runtime unavailable")), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load QR runtime")), { once: true });
      return;
    }

    const script = document.createElement("script");
    const publicBase = String(process.env.PUBLIC_URL || "").replace(/\/$/, "");
    script.src = `${publicBase}/qrcode.min.js`;
    script.async = true;
    script.dataset.nexusQrRuntime = "true";
    script.onload = () => window.QRCode ? resolve(window.QRCode) : reject(new Error("QR runtime unavailable"));
    script.onerror = () => reject(new Error("Failed to load QR runtime"));
    document.head.appendChild(script);
  }).catch((error) => {
    qrRuntimePromise = null;
    throw error;
  });

  return qrRuntimePromise;
};

export default function LocalQrCode({ value, title, size = 320, label = "acesso Nexus" }) {
  const containerRef = useRef(null);
  const qrInstanceRef = useRef(null);
  const [generationError, setGenerationError] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !value) return undefined;

    let cancelled = false;
    setGenerationError(false);
    setReady(false);
    container.innerHTML = "";

    loadQrRuntime()
      .then((QRCode) => {
        if (cancelled || !containerRef.current) return;
        container.innerHTML = "";
        qrInstanceRef.current = new QRCode(container, {
          text: value,
          width: size,
          height: size,
          colorDark: "#000000",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.H,
        });
        setReady(true);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Nexus QR generation failed", error);
        setGenerationError(true);
      });

    return () => {
      cancelled = true;
      try { qrInstanceRef.current?.clear?.(); } catch { /* noop */ }
      qrInstanceRef.current = null;
      if (container) container.innerHTML = "";
    };
  }, [size, value]);

  const download = () => {
    if (!value || !containerRef.current) return;
    try {
      const canvas = containerRef.current.querySelector("canvas");
      const image = containerRef.current.querySelector("img");
      const dataUrl = canvas?.toDataURL?.("image/png") || image?.src;
      if (!dataUrl) throw new Error("QR image unavailable");
      const anchor = document.createElement("a");
      anchor.href = dataUrl;
      anchor.download = `${String(title || "nexus").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase() || "nexus"}-qr.png`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch (error) {
      console.error("Nexus QR download failed", error);
      setGenerationError(true);
    }
  };

  return <div className="nexus-local-qr">
    <div ref={containerRef} className="nexus-local-qr__render" aria-label={`QR Code para ${label}${title ? `: ${title}` : ""}`} role="img" />
    {generationError ? <small role="status">Não foi possível gerar o QR Code. Use o link direto.</small> : <button type="button" onClick={download} disabled={!ready}>{ready ? "Baixar QR Code" : "Gerando QR Code…"}</button>}
  </div>;
}

LocalQrCode.propTypes = { value: PropTypes.string.isRequired, title: PropTypes.string, size: PropTypes.number, label: PropTypes.string };
