// src/hooks/useImageUtils.js
import { useMemo, useCallback } from "react";
import { storageUrl } from "../config";

const PASSTHROUGH_SCHEME = /^(?:https?:|data:|blob:)/i;

export const resolveImageUrl = (path, base = storageUrl) => {
  if (!path || typeof path !== "string") return null;

  const trimmed = path.trim();
  if (!trimmed) return null;
  if (PASSTHROUGH_SCHEME.test(trimmed)) return trimmed;

  const normalizedBase = String(base || "").trim().replace(/\/+$/, "");
  if (!normalizedBase) return trimmed;

  try {
    const baseUrl = new URL(normalizedBase);

    if (trimmed.startsWith("//")) {
      return `${baseUrl.protocol}${trimmed}`;
    }

    // Laravel frequently returns both `storage/foo.jpg` and `/storage/foo.jpg`.
    // The storage base already ends in `/storage`; joining them naively creates
    // `/storage/storage/...`, which makes valid establishment covers disappear.
    if (/^\/?storage\//i.test(trimmed)) {
      return `${baseUrl.origin}/${trimmed.replace(/^\/+/, "")}`;
    }

    // Root-relative media paths belong to the API/storage origin, not inside
    // the configured `/storage` folder.
    if (trimmed.startsWith("/")) {
      return `${baseUrl.origin}${trimmed}`;
    }

    return `${normalizedBase}/${trimmed.replace(/^\/+/, "")}`;
  } catch {
    const separator = normalizedBase.endsWith("/") ? "" : "/";
    return `${normalizedBase}${separator}${trimmed.replace(/^\/+/, "")}`;
  }
};

export default function useImageUtils(options = {}) {
  const {
    fallbackText = "",
    fallbackShape = "square",
  } = options;

  const imageUrl = useCallback((path) => resolveImageUrl(path), []);

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
