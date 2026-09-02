import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import QRCode from "qrcodejs";

export default function LocalQrCode({ value, title, size = 320 }) {
  const hostRef = useRef(null);

  useEffect(() => {
    if (!hostRef.current || !value) return undefined;

    hostRef.current.innerHTML = "";
    const qr = new QRCode(hostRef.current, {
      text: value,
      width: size,
      height: size,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H,
    });

    return () => {
      qr.clear();
      if (hostRef.current) hostRef.current.innerHTML = "";
    };
  }, [size, value]);

  const download = () => {
    const canvas = hostRef.current?.querySelector("canvas");
    const image = hostRef.current?.querySelector("img");
    const dataUrl = canvas?.toDataURL?.("image/png") || image?.src;
    if (!dataUrl) return;

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
  };

  return (
    <div className="nexus-local-qr">
      <div ref={hostRef} aria-label={`QR Code do catálogo ${title || "Nexus"}`} />
      <button type="button" onClick={download}>
        Baixar QR Code
      </button>
    </div>
  );
}

LocalQrCode.propTypes = {
  value: PropTypes.string.isRequired,
  title: PropTypes.string,
  size: PropTypes.number,
};
