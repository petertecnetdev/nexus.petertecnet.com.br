// src/hooks/useItemUpdate.js
import { useCallback, useState } from "react";
import Swal from "sweetalert2";
import { appId } from "../config";
import api from "../services/api";
import catalogIntelligence from "../services/catalogIntelligence";

const catalogFieldNames = new Set([
  "gtin", "sale_unit", "package_quantity", "package_unit",
  "spec_length", "spec_width", "spec_height", "spec_diameter", "spec_thickness",
  "spec_color", "spec_finish", "spec_material", "spec_application",
]);

function normalizeBoolean(value) {
  if (value === true || value === 1 || value === "1" || value === "true" || value === "on") return "1";
  if (value === false || value === 0 || value === "0" || value === "false" || value === "off") return "0";
  return null;
}

const getApiMessage = (error, fallback) =>
  error?.response?.data?.message || error?.response?.data?.error || fallback;

const compact = (object) => Object.fromEntries(
  Object.entries(object).filter(([, value]) => value !== undefined && value !== null && value !== "")
);

function buildCatalogPayload(values) {
  return compact({
    canonical_name: values.name,
    gtin: values.gtin,
    sku: values.sku,
    brand: values.brand,
    category: values.category,
    subcategory: values.subcategory,
    sale_unit: values.sale_unit || "un",
    package_quantity: values.package_quantity,
    package_unit: values.package_unit,
    specifications: compact({
      length: values.spec_length,
      width: values.spec_width,
      height: values.spec_height,
      diameter: values.spec_diameter,
      thickness: values.spec_thickness,
      color: values.spec_color,
      finish: values.spec_finish,
      material: values.spec_material,
      application: values.spec_application,
    }),
    source: "manual",
    source_confidence: 100,
    provenance: { correction: "manual" },
  });
}

export default function useItemUpdate(id) {
  const [loading, setLoading] = useState(false);
  const [apiErrors, setApiErrors] = useState({});

  const updateItem = useCallback(
    async (values, imageFile, removeImage, imageUrl = "") => {
      if (!id) return null;

      setLoading(true);
      setApiErrors({});

      try {
        const formData = new FormData();
        const catalogPayload = buildCatalogPayload(values);
        const legacyValues = Object.fromEntries(
          Object.entries(values).filter(([key]) => !catalogFieldNames.has(key))
        );
        const payload = { ...legacyValues, app_id: appId };

        Object.entries(payload).forEach(([key, value]) => {
          if (value === undefined || value === null || value === "") return;
          if (key === "status" || key === "is_featured") {
            const normalized = normalizeBoolean(value);
            if (normalized !== null) formData.append(key, normalized);
            return;
          }
          formData.append(key, value);
        });

        if (removeImage) formData.append("remove_image", "1");
        if (imageFile instanceof File) formData.append("image", imageFile);

        const { data } = await api.post(`/item/${encodeURIComponent(id)}`, formData);
        const trimmedImageUrl = imageUrl.trim();

        if (trimmedImageUrl && !(imageFile instanceof File)) {
          const currentFiles = Array.isArray(data?.item?.files) ? data.item.files : [];
          const imageFiles = currentFiles.filter((file) => file.type === "image" && file.id);
          await Promise.all(imageFiles.map((file) => api.delete(`/file/${encodeURIComponent(file.id)}`)));
          await api.post("/file", {
            app_id: appId,
            entity_id: Number(id),
            entity_name: "item",
            external_url: trimmedImageUrl,
            visibility: "public",
            is_primary: true,
            position: 0,
          });
        }

        let quality = null;
        let enrichmentWarning = null;
        if (String(values.type || "") === "product") {
          try {
            const { data: enrichment } = await catalogIntelligence.enrichItem(id, catalogPayload);
            quality = enrichment?.data?.quality || null;
          } catch (error) {
            enrichmentWarning = getApiMessage(error, "As alterações comerciais foram salvas, mas as especificações precisam de nova revisão.");
          }
        }

        await Swal.fire({
          icon: enrichmentWarning ? "warning" : "success",
          title: enrichmentWarning ? "Item atualizado com pendência" : "Item atualizado",
          html: enrichmentWarning
            ? `${data?.message || "As alterações foram salvas."}<br><small>${enrichmentWarning}</small>`
            : `${data?.message || "As alterações foram salvas."}${quality ? `<br><small>Qualidade do cadastro: ${quality.score}/100</small>` : ""}`,
        });

        return data;
      } catch (error) {
        const validationErrors = error?.response?.data?.errors || {};
        setApiErrors(validationErrors);
        const firstValidationMessage = Object.values(validationErrors).flat().find(Boolean);

        await Swal.fire({
          icon: "error",
          title: error?.response?.status === 422 ? "Revise os dados" : "Erro ao atualizar item",
          text: firstValidationMessage || getApiMessage(error, "Não foi possível atualizar o item."),
        });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [id]
  );

  return { updateItem, loading, apiErrors };
}
