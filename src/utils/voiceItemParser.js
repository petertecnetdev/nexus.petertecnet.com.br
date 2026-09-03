const FIELD_MARKERS = [
  "preço", "preco", "valor", "estoque", "categoria", "subcategoria", "marca",
  "descrição", "descricao", "duração", "duracao", "status"
];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const markerPattern = FIELD_MARKERS.map(escapeRegex).join("|");

const cleanValue = (value = "") => String(value)
  .replace(/^[\s,:;-]+/, "")
  .replace(/[\s,;.-]+$/, "")
  .trim();

const capture = (text, aliases) => {
  const aliasPattern = aliases.map(escapeRegex).join("|");
  const regex = new RegExp(`(?:^|[,;.]|\\s)(?:${aliasPattern})\\s*(?:é|:|=)?\\s*(.+?)(?=\\s+(?:${markerPattern})\\s*(?:é|:|=)?|[,;.](?:\\s|$)|$)`, "i");
  return cleanValue(text.match(regex)?.[1]);
};

const normalizeMoney = (value) => {
  const raw = cleanValue(value).replace(/r\$/gi, "").replace(/\s/g, "");
  if (!raw) return "";
  if (raw.includes(",")) return raw.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "");
  return raw.replace(/[^\d.-]/g, "");
};

const normalizeInteger = (value) => {
  const match = String(value || "").match(/\d+/);
  return match ? match[0] : "";
};

export function parseVoiceItemTranscript(transcript = "") {
  const text = String(transcript || "").trim();
  if (!text) return {};

  let type = "";
  let working = text;
  const typeMatch = working.match(/^\s*(produto|serviço|servico|item)\b\s*/i);
  if (typeMatch) {
    const token = typeMatch[1].toLowerCase();
    type = token === "produto" ? "product" : token.startsWith("serv") ? "service" : "";
    working = working.slice(typeMatch[0].length);
  }

  const firstMarker = new RegExp(`\\s+(?:${markerPattern})\\s*(?:é|:|=)?`, "i").exec(working);
  const name = cleanValue(firstMarker ? working.slice(0, firstMarker.index) : working);
  const statusValue = capture(working, ["status"]);
  const statusText = statusValue.toLowerCase();

  const parsed = {
    name,
    type,
    price: normalizeMoney(capture(working, ["preço", "preco", "valor"])),
    stock: normalizeInteger(capture(working, ["estoque"])),
    duration: normalizeInteger(capture(working, ["duração", "duracao"])),
    category: capture(working, ["categoria"]),
    subcategory: capture(working, ["subcategoria"]),
    brand: capture(working, ["marca"]),
    description: capture(working, ["descrição", "descricao"]),
  };

  if (statusText) {
    if (/inativ|desativ|indispon/.test(statusText)) parsed.status = 0;
    else if (/ativ|dispon/.test(statusText)) parsed.status = 1;
  }

  return Object.fromEntries(Object.entries(parsed).filter(([, value]) => value !== "" && value !== undefined));
}
