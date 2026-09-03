export function parseCommerceClaimQr(rawValue) {
  const raw = String(rawValue || "").trim();
  if (!raw) return null;

  try {
    const url = new URL(raw, "https://nexus.petertecnet.com.br");
    const match = url.pathname.match(/\/redeem\/([^/?#]+)/i);
    const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
    const token = hashParams.get("token") || url.searchParams.get("token");

    if (!match?.[1] || !token) return null;

    return {
      publicId: decodeURIComponent(match[1]),
      token,
    };
  } catch {
    return null;
  }
}
