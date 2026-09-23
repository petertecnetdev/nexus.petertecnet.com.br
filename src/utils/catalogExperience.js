const money = (value) =>
  Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const normalizeCatalogProfile = (value) => {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value !== "string") return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

export const asCatalogList = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") {
    return value.split(/\r?\n|;/).map((entry) => entry.trim()).filter(Boolean);
  }
  return [];
};

export const pricingPresentation = (item = {}) => {
  const model = item.pricing_model || "fixed";
  const price = Number(item.price || 0);
  const min = Number(item.price_min || price || 0);
  const max = Number(item.price_max || 0);
  const recurring = Number(item.recurring_price || 0);
  const setup = Number(item.setup_price || 0);
  const intervals = { monthly: "mês", quarterly: "trimestre", yearly: "ano", once: "projeto" };
  const interval = intervals[item.billing_interval] || "mês";

  if (model === "quote") {
    return { model, primary: "Sob orçamento", secondary: "Escopo e investimento definidos após diagnóstico.", checkoutAmount: 0 };
  }
  if (model === "range" && min > 0 && max >= min) {
    return { model, primary: `${money(min)} – ${money(max)}`, secondary: "Faixa estimada conforme escopo.", checkoutAmount: 0 };
  }
  if (model === "recurring" && recurring > 0) {
    return { model, primary: `${money(recurring)}/${interval}`, secondary: "Plano recorrente.", checkoutAmount: 0 };
  }
  if (model === "setup_recurring") {
    const pieces = [];
    if (setup > 0) pieces.push(`${money(setup)} de implantação`);
    if (recurring > 0) pieces.push(`${money(recurring)}/${interval}`);
    return { model, primary: pieces.join(" + ") || "Sob orçamento", secondary: "Implantação + evolução recorrente.", checkoutAmount: 0 };
  }
  if (model === "starting_at" && min > 0) {
    return { model, primary: `A partir de ${money(min)}`, secondary: "Valor final varia conforme escopo.", checkoutAmount: 0 };
  }
  if (price > 0) {
    return { model, primary: money(price), secondary: null, checkoutAmount: price };
  }
  return { model: "quote", primary: "Sob orçamento", secondary: "Fale com a equipe para definir o escopo.", checkoutAmount: 0 };
};

export const catalogSearchText = (item = {}) => {
  const profile = normalizeCatalogProfile(item.catalog_profile);
  return [
    item.name,
    item.short_description,
    item.description,
    item.category,
    item.subcategory,
    item.brand,
    ...(Array.isArray(item.tags) ? item.tags : []),
    ...Object.values(profile).flatMap((value) => {
      if (Array.isArray(value)) return value.map((entry) => typeof entry === "string" ? entry : JSON.stringify(entry));
      return typeof value === "string" ? [value] : [];
    }),
  ].filter(Boolean).join(" ").toLowerCase();
};

export { money };
