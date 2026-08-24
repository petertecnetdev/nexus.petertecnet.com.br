// src/hooks/useItemsFilter.js
export default function useItemsFilter(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return { services: [], products: [] };
  }

  const normalizeType = (type) => {
    if (!type) return "";
    const t = type.toString().toLowerCase().trim();

    // Padroniza diferentes variações para "service" e "product"
    if (["service", "servico", "serviço"].includes(t)) return "service";
    if (["product", "produto"].includes(t)) return "product";

    return t;
  };

  const services = items.filter(
    (it) => normalizeType(it.type) === "service"
  );

  const products = items.filter(
    (it) => normalizeType(it.type) === "product"
  );

  return { services, products };
}
