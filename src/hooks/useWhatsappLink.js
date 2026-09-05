// src/hooks/useWhatsappLink.js
import { useMemo } from "react";

const normalizeWhatsappLink = (establishment) => {
  if (!establishment) return null;

  const url = establishment?.whatsapp_url || establishment?.whatsappUrl || null;
  if (url) {
    const match = String(url).match(/(?:wa\.me\/|phone=)(\d{10,15})/i);
    if (match?.[1]) return `https://wa.me/${match[1]}`;
  }

  const phone =
    establishment?.whatsapp ||
    establishment?.whatsapp_phone ||
    establishment?.whatsappPhone ||
    establishment?.phone ||
    establishment?.mobile ||
    establishment?.cellphone ||
    null;

  const raw = String(phone || "").replace(/\D/g, "").replace(/^0+/, "");
  if (!raw) return null;

  const withCountryCode = raw.startsWith("55") ? raw : `55${raw}`;
  return `https://wa.me/${withCountryCode}`;
};

export default function useWhatsappLink(establishment) {
  return useMemo(() => normalizeWhatsappLink(establishment), [establishment]);
}
