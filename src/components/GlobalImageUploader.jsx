// src/components/GlobalImageUploader.jsx
import React, { useRef, useState } from "react";
import PropTypes from "prop-types";
import { Button, Spinner } from "react-bootstrap";

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

            const pngFile = new File([blob], "image.png", {
              type: "image/png",
            });

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

  const handleSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const result = await convertImageToPng(file, maxResolution);
      onChange?.(result.file);
      onPreview?.(result.preview);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    onChange?.(null);
    onPreview?.(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <>
      <div className="d-flex justify-content-center gap-3 my-3">
        <Button
          variant="secondary"
          disabled={disabled || loading}
          onClick={() => inputRef.current?.click()}
        >
          {loading ? <Spinner size="sm" /> : addLabel}
        </Button>

        <Button
          variant="secondary"
          disabled={disabled || loading}
          onClick={handleRemove}
        >
          {removeLabel}
        </Button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleSelect}
        style={{ display: "none" }}
      />
    </>
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
