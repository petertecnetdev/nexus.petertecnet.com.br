import { normalizeCatalogProfile } from "./catalogExperience";

const lines = (value) =>
  String(value || "")
    .split(/\r?\n|;/)
    .map((entry) => entry.trim())
    .filter(Boolean);

const faqFromText = (value) =>
  String(value || "")
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [question, ...answer] = entry.split("|");
      return {
        question: String(question || "").trim(),
        answer: answer.join("|").trim(),
      };
    })
    .filter((entry) => entry.question);

export const catalogProfileToFormValues = (value) => {
  const profile = normalizeCatalogProfile(value);
  const join = (key) => (Array.isArray(profile[key]) ? profile[key].join("\n") : "");

  return {
    catalog_headline: profile.headline || "",
    catalog_problem: profile.problem || "",
    catalog_audience: join("audience"),
    catalog_benefits: join("benefits"),
    catalog_deliverables: join("deliverables"),
    catalog_use_cases: join("use_cases"),
    catalog_process: join("process"),
    catalog_technologies: join("technologies"),
    catalog_proof_points: join("proof_points"),
    catalog_duration_text: profile.duration_text || "",
    catalog_price_note: profile.price_note || "",
    catalog_cta_label: profile.cta_label || "",
    catalog_faq: Array.isArray(profile.faq)
      ? profile.faq
          .map((entry) => {
            if (typeof entry === "string") return entry;
            const question = String(entry?.question || "").trim();
            const answer = String(entry?.answer || "").trim();
            return question ? `${question}${answer ? ` | ${answer}` : ""}` : "";
          })
          .filter(Boolean)
          .join("\n")
      : "",
  };
};

export const takeCatalogProfileFromForm = (payload, existingProfile = {}) => {
  const source = { ...payload };
  const existing = normalizeCatalogProfile(existingProfile);
  const profile = {
    ...existing,
    headline: String(source.catalog_headline || "").trim(),
    problem: String(source.catalog_problem || "").trim(),
    audience: lines(source.catalog_audience),
    benefits: lines(source.catalog_benefits),
    deliverables: lines(source.catalog_deliverables),
    use_cases: lines(source.catalog_use_cases),
    process: lines(source.catalog_process),
    technologies: lines(source.catalog_technologies),
    proof_points: lines(source.catalog_proof_points),
    duration_text: String(source.catalog_duration_text || "").trim(),
    price_note: String(source.catalog_price_note || "").trim(),
    cta_label: String(source.catalog_cta_label || "").trim(),
    faq: faqFromText(source.catalog_faq),
  };

  [
    "catalog_headline",
    "catalog_problem",
    "catalog_audience",
    "catalog_benefits",
    "catalog_deliverables",
    "catalog_use_cases",
    "catalog_process",
    "catalog_technologies",
    "catalog_proof_points",
    "catalog_duration_text",
    "catalog_price_note",
    "catalog_cta_label",
    "catalog_faq",
  ].forEach((key) => delete source[key]);

  source.catalog_profile = profile;
  return source;
};
