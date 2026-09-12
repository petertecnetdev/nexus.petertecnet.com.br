// src/components/GlobalImageUploader.jsx
import React, { useRef, useState } from "react";
import PropTypes from "prop-types";
import { Button, Spinner } from "react-bootstrap";
import "./GlobalImageInputEnhancer.css";

async function convertImageToPng(file, maxResolution) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        let { width, height } = img;

        if (maxResolution) {
          if (width > height && width > maxResolution) {
            height = Math.round((height * maxResolution) / width);
            width = maxResolution;
          } else if (height > maxResolution) {
            width = Math.round((width * maxResolution) / height);
            height = maxResolution;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Falha ao converter imagem"));
              return;
            }

            const pngFile = new File([blob], "image.png", { type: "image/png" });

            resolve({
              file: pngFile,
              preview: canvas.toDataURL("image/png"),
              width,
              height,
            });
          },
          "image/png",
          0.95
        );
      };

      img.onerror = reject;
      img.src = e.target.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function GlobalImageUploader({
  onChange,
  onPreview,
  maxResolution = 800,
  addLabel = "Adicionar imagem",
  removeLabel = "Remover imagem",
  disabled = false,
}) {
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState("");

  const handleSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const result = await convertImageToPng(file, maxResolution);
      setPreview(result.preview);
      onChange?.(result.file);
      onPreview?.(result.preview);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setPreview("");
    onChange?.(null);
    onPreview?.(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="pt-global-image-uploader" data-global-image-uploader="true">
      <div
        className="pt-image-input-surface pt-global-image-uploader__surface"
        data-pt-image-shape="image"
        onClick={() => {
          if (!disabled && !loading) inputRef.current?.click();
        }}
        onKeyDown={(event) => {
          if (disabled || loading) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || loading}
        aria-label={preview ? "Alterar imagem" : addLabel}
      >
        <span className="pt-image-input-surface__frame">
          {preview ? (
            <img className="pt-image-input-surface__preview" src={preview} alt="Prévia da imagem selecionada" />
          ) : (
            <span className="pt-image-input-surface__placeholder">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M4 5.75A1.75 1.75 0 0 1 5.75 4h12.5A1.75 1.75 0 0 1 20 5.75v12.5A1.75 1.75 0 0 1 18.25 20H5.75A1.75 1.75 0 0 1 4 18.25V5.75Zm1.5 0v8.66l3.03-3.03a1.75 1.75 0 0 1 2.48 0l1.63 1.63 1.63-1.63a1.75 1.75 0 0 1 2.48 0l1.75 1.75V5.75a.25.25 0 0 0-.25-.25H5.75a.25.25 0 0 0-.25.25Zm13 9.5-2.81-2.81a.25.25 0 0 0-.36 0l-4.69 4.69-2.11-2.11a.25.25 0 0 0-.36 0L5.5 17.69v.56c0 .14.11.25.25.25h12.5a.25.25 0 0 0 .25-.25v-3ZM8.25 7.25a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" />
              </svg>
              <strong>{addLabel}</strong>
              <small>Clique na imagem para selecionar ou trocar</small>
            </span>
          )}

          <span className="pt-image-input-surface__action">
            {loading ? <Spinner animation="border" size="sm" /> : <span aria-hidden="true">✎</span>}
            <span>{loading ? "Processando..." : preview ? "Trocar imagem" : addLabel}</span>
          </span>
        </span>
      </div>

      {preview && (
        <Button
          type="button"
          variant="outline-secondary"
          size="sm"
          className="pt-global-image-uploader__remove"
          disabled={disabled || loading}
          onClick={handleRemove}
        >
          {removeLabel}
        </Button>
      )}

      <input
        ref={inputRef}
        className="pt-image-input-native"
        type="file"
        accept="image/*"
        onChange={handleSelect}
        disabled={disabled}
      />
    </div>
  );
}

GlobalImageUploader.propTypes = {
  onChange: PropTypes.func.isRequired,
  onPreview: PropTypes.func,
  maxResolution: PropTypes.number,
  addLabel: PropTypes.string,
  removeLabel: PropTypes.string,
  disabled: PropTypes.bool,
};
