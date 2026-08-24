// src/hooks/useWhatsappLink.js
import { useMemo } from "react";

export default function useWhatsappLink(establishment) {
  return useMemo(() => {
    const raw = String(establishment?.phone || "").replace(/\D/g, "");
    if (!raw) return null;
    const withCc = raw.startsWith("55") ? raw : `55${raw}`;
    return `https://wa.me/${withCc}`;
  }, [establishment]);
}
