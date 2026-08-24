// src/hooks/useImageUtils.js
import { useMemo, useCallback } from "react";
import { storageUrl } from "../config";

export default function useImageUtils(options = {}) {
  const {
    fallbackText = "",
    fallbackShape = "square",
  } = options;

  const isAbsolute = (url) => /^https?:\/\//i.test(url);

  const normalize = (base, path) => {
    if (!base) return path;
    if (base.endsWith("/") && path.startsWith("/")) return base + path.slice(1);
    if (!base.endsWith("/") && !path.startsWith("/")) return `${base}/${path}`;
    return base + path;
  };

  const imageUrl = useCallback((path) => {
    if (!path || typeof path !== "string") return null;
    if (isAbsolute(path)) return path;

    if (path.startsWith("storage/")) {
      const base = storageUrl.replace(/\/storage\/?$/, "");
      return normalize(base, path);
    }

    return normalize(storageUrl, path);
  }, []);

  const getInitials = useCallback((text) => {
    if (!text) return "?";
    const parts = text.trim().split(" ");
    return parts.length === 1
      ? parts[0][0].toUpperCase()
      : parts[0][0].toUpperCase() + parts.at(-1)[0].toUpperCase();
  }, []);

  const placeholderSvg = useMemo(() => {
    const initials = getInitials(fallbackText);
    const radius =
      fallbackShape === "round" ? 100 : fallbackShape === "establishment" ? 24 : 18;

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#0b1c2d" />
            <stop offset="100%" stop-color="#020617" />
          </linearGradient>
        </defs>
        <rect width="200" height="200" rx="${radius}" ry="${radius}" fill="url(#g)" />
        <text
          x="50%"
          y="54%"
          text-anchor="middle"
          dominant-baseline="middle"
          font-size="64"
          font-weight="700"
          fill="#e5e7eb"
          font-family="Inter, Arial, sans-serif"
          letter-spacing="2"
        >
          ${initials}
        </text>
      </svg>
    `;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }, [fallbackText, fallbackShape, getInitials]);

  const handleImgError = useCallback(
    (e) => {
      e.currentTarget.onerror = null;
      e.currentTarget.src = placeholderSvg;
    },
    [placeholderSvg]
  );

  return {
    imageUrl,
    handleImgError,
    placeholderSvg,
  };
}
