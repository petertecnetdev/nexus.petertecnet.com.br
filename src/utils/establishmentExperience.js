const normalizeText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

export const asObject = (value) => {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value !== "string") return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
};

export const parseList = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value || typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
  } catch {
    // Comma-separated fallback below.
  }
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
};

export const getBusinessProfile = (establishment) =>
  asObject(
    establishment?.business_profile ||
      establishment?.businessProfile ||
      establishment?.commerce_profile ||
      establishment?.commercial_profile
  );

const categoryValue = (value) => {
  if (!value) return "";
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }
  return String(value?.name || value?.label || value?.title || "").trim();
};

export const itemCategory = (item) =>
  categoryValue(
    item?.category ||
      item?.category_name ||
      item?.subcategory ||
      item?.segment ||
      item?.type
  ) || "Outros";

export const getItemCategories = (items = []) => {
  const categories = [...new Set(items.map(itemCategory).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b, "pt-BR")
  );
  return ["Todos", ...categories];
};

const itemTimestamp = (item) => {
  const raw = item?.updated_at || item?.created_at || item?.published_at;
  const value = raw ? new Date(raw).getTime() : 0;
  return Number.isFinite(value) ? value : 0;
};

const itemViews = (item) =>
  Number(item?.total_views || item?.views_count || item?.metrics?.total_views || 0) || 0;

const itemSearchText = (item) =>
  normalizeText(
    [
      item?.name,
      item?.description,
      itemCategory(item),
      ...(parseList(item?.tags) || []),
    ]
      .filter(Boolean)
      .join(" ")
  );

export const filterAndRankItems = (
  items = [],
  { query = "", category = "Todos", sort = "smart" } = {}
) => {
  const normalizedQuery = normalizeText(query);
  const normalizedCategory = normalizeText(category);

  const filtered = items.filter((item) => {
    if (Number(item?.status ?? 1) === 0) return false;
    const matchesQuery =
      !normalizedQuery || itemSearchText(item).includes(normalizedQuery);
    const matchesCategory =
      !normalizedCategory ||
      normalizedCategory === "todos" ||
      normalizeText(itemCategory(item)) === normalizedCategory;
    return matchesQuery && matchesCategory;
  });

  return [...filtered].sort((a, b) => {
    if (sort === "price_asc") {
      return Number(a?.price || 0) - Number(b?.price || 0);
    }
    if (sort === "recent") {
      return itemTimestamp(b) - itemTimestamp(a);
    }
    if (sort === "popular") {
      return itemViews(b) - itemViews(a) || itemTimestamp(b) - itemTimestamp(a);
    }

    const smartScore = (item) =>
      (item?.is_featured ? 100000 : 0) +
      Math.min(itemViews(item), 100000) * 4 +
      Math.floor(itemTimestamp(item) / 86400000);
    return smartScore(b) - smartScore(a);
  });
};

const dayConfig = [
  { schema: "Sunday", label: "domingo", keys: ["sunday", "domingo", "dom", "0"] },
  { schema: "Monday", label: "segunda-feira", keys: ["monday", "segunda", "seg", "1"] },
  { schema: "Tuesday", label: "terça-feira", keys: ["tuesday", "terca", "terça", "ter", "2"] },
  { schema: "Wednesday", label: "quarta-feira", keys: ["wednesday", "quarta", "qua", "3"] },
  { schema: "Thursday", label: "quinta-feira", keys: ["thursday", "quinta", "qui", "4"] },
  { schema: "Friday", label: "sexta-feira", keys: ["friday", "sexta", "sex", "5"] },
  { schema: "Saturday", label: "sábado", keys: ["saturday", "sabado", "sábado", "sab", "6"] },
];

const hoursSource = (establishment) => {
  const profile = getBusinessProfile(establishment);
  const raw =
    profile.opening_hours ||
    profile.business_hours ||
    establishment?.opening_hours ||
    establishment?.business_hours ||
    establishment?.hours;
  return asObject(raw);
};

const dayEntry = (hours, dayIndex) => {
  const config = dayConfig[dayIndex];
  for (const key of config.keys) {
    if (Object.prototype.hasOwnProperty.call(hours, key)) return hours[key];
  }
  return undefined;
};

const parseTime = (value) => {
  const match = String(value || "").match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
};

const normalizeHoursEntry = (entry) => {
  if (entry === undefined) return { known: false };
  if (entry === null || entry === false) return { known: true, closed: true };
  if (Array.isArray(entry)) return normalizeHoursEntry(entry[0]);

  if (typeof entry === "string") {
    const normalized = normalizeText(entry);
    if (["closed", "fechado", "fechada"].includes(normalized)) {
      return { known: true, closed: true };
    }
    if (/24\s*h|24\s*horas|24hours/.test(normalized)) {
      return { known: true, open24: true, open: "00:00", close: "23:59" };
    }
    const times = entry.match(/(\d{1,2}:\d{2})/g) || [];
    if (times.length >= 2) {
      return { known: true, open: times[0], close: times[1] };
    }
    return { known: false };
  }

  if (typeof entry === "object") {
    if (entry.closed || entry.is_closed) return { known: true, closed: true };
    if (entry.open_24_hours || entry.open24 || entry.is_24h) {
      return { known: true, open24: true, open: "00:00", close: "23:59" };
    }
    const open = entry.open || entry.opens || entry.start || entry.from;
    const close = entry.close || entry.closes || entry.end || entry.to;
    if (open && close) return { known: true, open: String(open), close: String(close) };
  }

  return { known: false };
};

const isWithinHours = (nowMinutes, openMinutes, closeMinutes) => {
  if (openMinutes === null || closeMinutes === null) return false;
  if (closeMinutes >= openMinutes) {
    return nowMinutes >= openMinutes && nowMinutes < closeMinutes;
  }
  return nowMinutes >= openMinutes || nowMinutes < closeMinutes;
};

export const getOpeningStatus = (establishment, now = new Date()) => {
  const profile = getBusinessProfile(establishment);
  if (profile.open_24_hours === true) {
    return {
      known: true,
      isOpen: true,
      label: "Aberto agora",
      detail: "Atendimento 24 horas",
      tone: "open",
    };
  }

  const hours = hoursSource(establishment);
  if (!Object.keys(hours).length) {
    return {
      known: false,
      isOpen: null,
      label: "Horário não informado",
      detail: "Consulte o estabelecimento antes de visitar",
      tone: "unknown",
    };
  }

  const todayIndex = now.getDay();
  const today = normalizeHoursEntry(dayEntry(hours, todayIndex));
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  if (today.open24) {
    return {
      known: true,
      isOpen: true,
      label: "Aberto agora",
      detail: "Atendimento 24 horas hoje",
      tone: "open",
    };
  }

  if (today.known && !today.closed) {
    const openMinutes = parseTime(today.open);
    const closeMinutes = parseTime(today.close);
    if (isWithinHours(nowMinutes, openMinutes, closeMinutes)) {
      return {
        known: true,
        isOpen: true,
        label: "Aberto agora",
        detail: `Fecha às ${today.close}`,
        tone: "open",
      };
    }
  }

  for (let offset = today.known && !today.closed ? 0 : 1; offset < 7; offset += 1) {
    const index = (todayIndex + offset) % 7;
    const entry = normalizeHoursEntry(dayEntry(hours, index));
    if (!entry.known || entry.closed) continue;

    if (offset === 0) {
      const nextTodayOpening = parseTime(entry.open);
      if (entry.open24 || (nextTodayOpening !== null && nextTodayOpening > nowMinutes)) {
        return {
          known: true,
          isOpen: false,
          label: "Fechado agora",
          detail: entry.open24 ? "Abre hoje por 24 horas" : `Abre hoje às ${entry.open}`,
          tone: "closed",
        };
      }

      // We already passed today's closing time. Continue with tomorrow instead
      // of incorrectly telling the user that the business will reopen earlier today.
      continue;
    }

    const when = offset === 1 ? "amanhã" : dayConfig[index].label;
    return {
      known: true,
      isOpen: false,
      label: "Fechado agora",
      detail: entry.open24 ? `Abre ${when} por 24 horas` : `Abre ${when} às ${entry.open}`,
      tone: "closed",
    };
  }

  return {
    known: true,
    isOpen: false,
    label: "Fechado agora",
    detail: today.closed ? "Fechado hoje" : "Consulte os próximos horários",
    tone: "closed",
  };
};

export const openingHoursSpecification = (establishment) => {
  const profile = getBusinessProfile(establishment);
  if (profile.open_24_hours === true) {
    return dayConfig.map((day) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: `https://schema.org/${day.schema}`,
      opens: "00:00",
      closes: "23:59",
    }));
  }

  const hours = hoursSource(establishment);
  return dayConfig.flatMap((day, index) => {
    const entry = normalizeHoursEntry(dayEntry(hours, index));
    if (!entry.known || entry.closed) return [];
    return [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: `https://schema.org/${day.schema}`,
        opens: entry.open24 ? "00:00" : entry.open,
        closes: entry.open24 ? "23:59" : entry.close,
      },
    ];
  });
};

const paymentLabels = {
  pix: "Pix",
  cash: "Dinheiro",
  debit_card: "Cartão de débito",
  credit_card: "Cartão de crédito",
  boleto: "Boleto",
  transfer: "Transferência",
};

export const getCommerceFacts = (establishment) => {
  const profile = getBusinessProfile(establishment);
  const paymentMethods = parseList(
    profile.payment_methods || establishment?.payment_methods
  ).map((method) => paymentLabels[normalizeText(method).replace(/\s+/g, "_")] || method);

  return {
    paymentMethods,
    deliveryAvailable:
      profile.delivery_available ?? establishment?.delivery_available ?? null,
    pickupAvailable:
      profile.pickup_available ?? establishment?.pickup_available ?? null,
    serviceArea: profile.service_area || establishment?.service_area || null,
    accessibility:
      profile.accessibility ?? establishment?.accessibility ?? null,
    parking: profile.parking ?? establishment?.parking ?? null,
  };
};

export const buildStructuredData = ({
  establishment,
  items = [],
  companyUrl,
  catalogUrl,
  title,
  imageUrl,
  socialLinks = [],
}) => {
  if (!establishment || !companyUrl) return null;
  const businessId = `${companyUrl}#business`;
  const image = imageUrl || undefined;
  const opening = openingHoursSpecification(establishment);
  const address = [establishment.address, establishment.city, establishment.uf]
    .filter(Boolean)
    .join(", ");

  const business = {
    "@type": "LocalBusiness",
    "@id": businessId,
    name: title,
    description: establishment.description || undefined,
    url: companyUrl,
    image,
    telephone: establishment.phone || undefined,
    email: establishment.email || undefined,
    address: address
      ? {
          "@type": "PostalAddress",
          streetAddress: establishment.address || undefined,
          addressLocality: establishment.city || undefined,
          addressRegion: establishment.uf || undefined,
          postalCode: establishment.cep || undefined,
          addressCountry: "BR",
        }
      : undefined,
    openingHoursSpecification: opening.length ? opening : undefined,
    sameAs: socialLinks.map((entry) => entry.href).filter(Boolean),
  };

  const breadcrumbs = {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Nexus",
        item: companyUrl.replace(/\/establishment\/view\/.*$/, ""),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: title,
        item: companyUrl,
      },
    ],
  };

  const products = items.slice(0, 12).map((item) => {
    const price = Number(item?.price);
    return {
      "@type": "Product",
      "@id": `${companyUrl}#item-${item.id || item.slug}`,
      name: item?.name || "Item",
      description: item?.description || undefined,
      category: itemCategory(item),
      image: item?.image || item?.image_url || undefined,
      url: item?.slug
        ? companyUrl.replace(/\/establishment\/view\/.*$/, `/item/view/${encodeURIComponent(item.slug)}`)
        : catalogUrl,
      offers: Number.isFinite(price)
        ? {
            "@type": "Offer",
            priceCurrency: "BRL",
            price: price.toFixed(2),
            availability: "https://schema.org/InStock",
            seller: { "@id": businessId },
          }
        : undefined,
    };
  });

  return {
    "@context": "https://schema.org",
    "@graph": [business, breadcrumbs, ...products],
  };
};
