import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import QRCode from "qrcode";

export default function LocalQrCode({ value, title, size = 320 }) {
  const canvasRef = useRef(null);
  const [generationError, setGenerationError] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return undefined;

    let cancelled = false;
    setGenerationError(false);
    setReady(false);

    QRCode.toCanvas(canvas, value, {
      width: size,
      margin: 2,
      errorCorrectionLevel: "H",
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    })
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Nexus QR generation failed", error);
        setGenerationError(true);
      });

    return () => {
      cancelled = true;
      const context = canvas.getContext?.("2d");
      context?.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [size, value]);

  const download = async () => {
    if (!value) return;

    try {
      const dataUrl = await QRCode.toDataURL(value, {
        width: Math.max(size, 640),
        margin: 2,
        errorCorrectionLevel: "H",
        type: "image/png",
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });

      const anchor = document.createElement("a");
      anchor.href = dataUrl;
      anchor.download = `${String(title || "catalogo-nexus")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9_-]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase() || "catalogo-nexus"}-qr.png`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch (error) {
      console.error("Nexus QR download failed", error);
      setGenerationError(true);
    }
  };

  return (
    <div className="nexus-local-qr">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        aria-label={`QR Code do catálogo ${title || "Nexus"}`}
        role="img"
      />
      {generationError ? (
        <small role="status">Não foi possível gerar o QR Code. Use o link do catálogo.</small>
      ) : (
        <button type="button" onClick={download} disabled={!ready}>
          {ready ? "Baixar QR Code" : "Gerando QR Code…"}
        </button>
      )}
    </div>
  );
}

LocalQrCode.propTypes = {
  value: PropTypes.string.isRequired,
  title: PropTypes.string,
  size: PropTypes.number,
};
