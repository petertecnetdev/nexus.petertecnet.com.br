// src/hooks/useItemCreate.js
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { appId } from "../config";
import api from "../services/api";
import catalogIntelligence from "../services/catalogIntelligence";

const getApiMessage = (error, fallback) =>
  error?.response?.data?.message || error?.response?.data?.error || fallback;

const catalogFieldNames = new Set([
  "gtin", "sale_unit", "package_quantity", "package_unit",
  "spec_length", "spec_width", "spec_height", "spec_diameter", "spec_thickness",
  "spec_color", "spec_finish", "spec_material", "spec_application",
]);

const compact = (object) => Object.fromEntries(
  Object.entries(object).filter(([, value]) => value !== undefined && value !== null && value !== "")
);

function buildCatalogPayload(data) {
  const specifications = compact({
    length: data.spec_length,
    width: data.spec_width,
    height: data.spec_height,
    diameter: data.spec_diameter,
    thickness: data.spec_thickness,
    color: data.spec_color,
    finish: data.spec_finish,
    material: data.spec_material,
    application: data.spec_application,
  });

  return compact({
    canonical_name: data.name,
    gtin: data.gtin,
    sku: data.sku,
    brand: data.brand,
    category: data.category,
    subcategory: data.subcategory,
    sale_unit: data.sale_unit || "un",
    package_quantity: data.package_quantity,
    package_unit: data.package_unit,
    specifications,
    source: "manual",
    source_confidence: 100,
    provenance: {
      name: "manual",
      price: "manual",
      specifications: "manual",
    },
  });
}

export default function useItemCreate(navigate, reset, setValue, establishmentFromState = null) {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [establishment, setEstablishment] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const setupFromEstablishment = (est) => {
      if (!est?.id) throw new Error("Estabelecimento inválido.");
      if (est.app_id != null && Number(est.app_id) !== Number(appId)) {
        throw new Error("Este estabelecimento não pertence à Nexus.");
      }

      setEstablishment(est);
      setValue("app_id", appId);
      setValue("entity_id", est.id);
      setValue("entity_name", "establishment");
      setValue("status", 1);
      setValue("type", "product");
      setValue("sale_unit", "un");
    };

    const loadEstablishment = async () => {
      try {
        if (establishmentFromState?.id) {
          setupFromEstablishment(establishmentFromState);
          return;
        }

        if (!slug) throw new Error("Estabelecimento não identificado.");
        const { data } = await api.get(`/establishment/view/${encodeURIComponent(slug)}`, {
          params: { app_id: appId },
          signal: controller.signal,
        });

        if (!controller.signal.aborted) setupFromEstablishment(data?.establishment);
      } catch (error) {
        if (error?.code === "ERR_CANCELED") return;
        await Swal.fire({
          icon: "error",
          title: "Não foi possível abrir o cadastro",
          text: getApiMessage(error, error?.message || "Erro ao identificar o estabelecimento."),
        });
        navigate(-1);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    loadEstablishment();
    return () => controller.abort();
  }, [slug, navigate, setValue, establishmentFromState]);

  async function submitCreate(data) {
    if (!establishment?.id) return;
    setLoading(true);

    try {
      const { image_url: imageUrl = "", ...allItemData } = data;
      const catalogPayload = buildCatalogPayload(allItemData);
      const itemData = Object.fromEntries(
        Object.entries(allItemData).filter(([key]) => !catalogFieldNames.has(key))
      );
      const formData = new FormData();
      const payload = {
        ...itemData,
        app_id: appId,
        entity_id: establishment.id,
        entity_name: "establishment",
      };

      Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") formData.append(key, value);
      });

      const { data: response } = await api.post("/item", formData);
      const createdItem = response?.item || response?.data;
      const trimmedImageUrl = String(imageUrl || "").trim();
      const hasUploadedImage = itemData.image instanceof File;

      if (trimmedImageUrl && !hasUploadedImage && createdItem?.id) {
        await api.post("/file", {
          app_id: appId,
          entity_id: createdItem.id,
          entity_name: "item",
          external_url: trimmedImageUrl,
          visibility: "public",
          is_primary: true,
          position: 0,
        });
      }

      let quality = null;
      let enrichmentWarning = null;
      if (createdItem?.id && String(itemData.type || "product") === "product") {
        try {
          const { data: enrichment } = await catalogIntelligence.enrichItem(createdItem.id, catalogPayload);
          quality = enrichment?.data?.quality || null;
        } catch (error) {
          enrichmentWarning = getApiMessage(error, "O item foi criado, mas as especificações ainda precisam ser revisadas.");
        }
      }

      await Swal.fire({
        icon: enrichmentWarning ? "warning" : "success",
        title: enrichmentWarning ? "Item criado com revisão pendente" : "Item criado",
        html: enrichmentWarning
          ? `${response?.message || "O item foi adicionado ao catálogo."}<br><small>${enrichmentWarning}</small>`
          : `${response?.message || "O item foi adicionado ao catálogo."}${quality ? `<br><small>Qualidade do cadastro: ${quality.score}/100</small>` : ""}`,
      });

      reset();
      navigate(establishment.slug ? `/establishment/item/${establishment.slug}` : "/establishment/my");
    } catch (error) {
      const validationErrors = error?.response?.data?.errors;
      const firstValidationMessage = validationErrors
        ? Object.values(validationErrors).flat().find(Boolean)
        : null;

      await Swal.fire({
        icon: "error",
        title: error?.response?.status === 422 ? "Revise os dados" : "Erro ao criar item",
        text: firstValidationMessage || getApiMessage(error, "Não foi possível criar o item."),
      });
    } finally {
      setLoading(false);
    }
  }

  return { loading, establishment, submitCreate };
}
