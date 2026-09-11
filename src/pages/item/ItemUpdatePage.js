// src/pages/item/ItemUpdatePage.js
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Container } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import Swal from "sweetalert2";

import GlobalNav from "../../components/GlobalNav";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import ItemUpdateForm from "../../components/item/ItemUpdateForm";
import useItemUpdate from "../../hooks/useItemUpdate";
import api from "../../services/api";
import { appId } from "../../config";

const DEFAULT_EDITOR_CONFIG = {
  short_description: "",
  sale: {
    enabled: false,
    price: "",
    start_at: "",
    end_at: "",
  },
  availability: {
    mode: "always",
    weekdays: [],
    start_time: "",
    end_time: "",
  },
  variants: [],
  add_on_groups: [],
  catalog: {
    visible: true,
    featured: false,
    qr_enabled: true,
    share_enabled: true,
    online_purchase: true,
    sort_order: 0,
  },
  seo: {
    title: "",
    description: "",
    og_image: "",
  },
};

function mergeEditorConfig(value) {
  const source = value && typeof value === "object" ? value : {};
  return {
    ...DEFAULT_EDITOR_CONFIG,
    ...source,
    sale: { ...DEFAULT_EDITOR_CONFIG.sale, ...(source.sale || {}) },
    availability: { ...DEFAULT_EDITOR_CONFIG.availability, ...(source.availability || {}) },
    variants: Array.isArray(source.variants) ? source.variants : [],
    add_on_groups: Array.isArray(source.add_on_groups) ? source.add_on_groups : [],
    catalog: { ...DEFAULT_EDITOR_CONFIG.catalog, ...(source.catalog || {}) },
    seo: { ...DEFAULT_EDITOR_CONFIG.seo, ...(source.seo || {}) },
  };
}

function toLocalDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 16);
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return shifted.toISOString().slice(0, 16);
}

function itemFormValues(data) {
  return {
    name: data.name ?? "",
    type: data.type || "product",
    slug: data.slug ?? "",
    sku: data.sku ?? "",
    price: data.price ?? "",
    stock: data.stock ?? "",
    status: Number(data.status ?? 1),
    duration: data.duration ?? "",
    description: data.description ?? "",
    category: data.category ?? "",
    subcategory: data.subcategory ?? "",
    brand: data.brand ?? "",
    is_featured: Boolean(data.is_featured),
    limited_by_user: Boolean(data.limited_by_user),
    availability_start: toLocalDateTime(data.availability_start),
    availability_end: toLocalDateTime(data.availability_end),
    expiration_date: toLocalDateTime(data.expiration_date),
    discount: data.discount ?? "",
    notes: data.notes ?? "",
    tags_input: Array.isArray(data.tags) ? data.tags.join(", ") : "",
  };
}

function primaryImageFrom(item) {
  const files = Array.isArray(item?.files) ? item.files.filter((file) => file.type === "image") : [];
  return files.find((file) => file.is_primary || file.group === "primary") || files[0] || null;
}

function galleryFrom(item) {
  const files = Array.isArray(item?.files) ? item.files.filter((file) => file.type === "image") : [];
  const primary = primaryImageFrom(item);
  return files
    .filter((file) => !primary || file.id !== primary.id)
    .map((file) => ({ ...file, pending: false, preview: file.public_url || file.image_url || file.path }));
}

function normalizeApiNumber(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const normalized = raw.includes(",")
    ? raw.replace(/\./g, "").replace(",", ".")
    : raw;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : value;
}

function cleanValues(values, editorConfig) {
  const payload = { ...values };
  const tags = String(payload.tags_input || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 30);
  delete payload.tags_input;

  return {
    ...payload,
    type: payload.type || "product",
    price: normalizeApiNumber(payload.price),
    discount: payload.discount === "" ? "" : normalizeApiNumber(payload.discount),
    tags,
    editor_config: editorConfig,
  };
}

export default function ItemUpdatePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const form = useForm({ mode: "onChange" });
  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors, isDirty },
  } = form;
  const watchedValues = useWatch({ control });

  const { updateItem, loading: saving, apiErrors } = useItemUpdate(id);

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imageUrlStatus, setImageUrlStatus] = useState("idle");
  const [removeImage, setRemoveImage] = useState(false);
  const [editorConfig, setEditorConfig] = useState(DEFAULT_EDITOR_CONFIG);
  const [configDirty, setConfigDirty] = useState(false);
  const [gallery, setGallery] = useState([]);
  const [removedGalleryIds, setRemovedGalleryIds] = useState([]);
  const [draftSavedAt, setDraftSavedAt] = useState(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const [galleryBusy, setGalleryBusy] = useState(false);

  const draftKey = useMemo(() => "nexus:item-edit-draft:" + id, [id]);

  const applyLoadedItem = useCallback((data, { allowDraft = false } = {}) => {
    const primary = primaryImageFrom(data);
    const serverValues = itemFormValues(data);
    const serverConfig = mergeEditorConfig(data.editor_config);
    let values = serverValues;
    let config = serverConfig;
    let restored = false;

    if (allowDraft) {
      try {
        const raw = localStorage.getItem(draftKey);
        if (raw) {
          const draft = JSON.parse(raw);
          const draftTime = Number(draft?.updatedAt || 0);
          const serverTime = new Date(data.updated_at || 0).getTime();
          if (draftTime > serverTime && draft?.values) {
            values = { ...serverValues, ...draft.values };
            config = mergeEditorConfig(draft.editorConfig || serverConfig);
            restored = true;
          }
        }
      } catch {
        localStorage.removeItem(draftKey);
      }
    }

    setItem(data);
    reset(values);
    setEditorConfig(config);
    setConfigDirty(false);
    setDraftRestored(restored);
    setGallery(galleryFrom(data));
    setRemovedGalleryIds([]);

    const currentImage = primary?.public_url || data.image_url || data.image || null;
    setImagePreview(currentImage);
    if (primary?.source === "external_url" || primary?.storage === "external") {
      setImageUrl(primary.public_url || "");
      setImageUrlStatus(primary.public_url ? "loaded" : "idle");
    } else {
      setImageUrl("");
      setImageUrlStatus("idle");
    }
    setImageFile(null);
    setRemoveImage(false);
  }, [draftKey, reset]);

  const fetchItem = useCallback(async ({ allowDraft = false } = {}) => {
    const { data: response } = await api.get("/item/manage/" + encodeURIComponent(id), {
      params: { app_id: appId },
    });
    const data = response?.item ?? response;
    if (!data?.id) throw new Error("Item não encontrado.");
    if (data.app_id != null && Number(data.app_id) !== Number(appId)) {
      throw new Error("Este item não pertence à Nexus.");
    }
    applyLoadedItem(data, { allowDraft });
    return data;
  }, [id, applyLoadedItem]);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setApiError(null);

        const { data: response } = await api.get("/item/manage/" + encodeURIComponent(id), {
          params: { app_id: appId },
          signal: controller.signal,
        });

        const data = response?.item ?? response;
        if (!data?.id) throw new Error("Item não encontrado.");
        if (data.app_id != null && Number(data.app_id) !== Number(appId)) {
          throw new Error("Este item não pertence à Nexus.");
        }

        applyLoadedItem(data, { allowDraft: true });
      } catch (error) {
        if (error?.code === "ERR_CANCELED") return;
        setApiError(
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Erro ao carregar item."
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [id, applyLoadedItem]);

  useEffect(() => {
    if (!item) return undefined;
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(
          draftKey,
          JSON.stringify({
            updatedAt: Date.now(),
            values: watchedValues || watch(),
            editorConfig,
          })
        );
        setDraftSavedAt(new Date());
      } catch {
        // Local draft is best-effort and must never block editing.
      }
    }, 700);

    return () => window.clearTimeout(timer);
  }, [draftKey, editorConfig, item, watch, watchedValues]);

  const updateConfig = useCallback((updater) => {
    setEditorConfig((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      return mergeEditorConfig(next);
    });
    setConfigDirty(true);
  }, []);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setImageUrl("");
    setImageUrlStatus("idle");
    setRemoveImage(false);

    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleImageUrlChange = (event) => {
    const value = event.target.value;
    setImageUrl(value);
    setImageFile(null);
    setRemoveImage(false);

    const trimmed = value.trim();
    if (!trimmed) {
      setImageUrlStatus("idle");
      setImagePreview(null);
      return;
    }

    setImageUrlStatus("loading");
    setImagePreview(trimmed);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImageUrl("");
    setImageUrlStatus("idle");
    setImagePreview(null);
    setRemoveImage(true);
  };

  const handleGalleryAdd = (event) => {
    const incoming = Array.from(event.target.files || []).filter((file) => file.type.startsWith("image/"));
    if (!incoming.length) return;

    setGallery((current) => {
      const room = Math.max(0, 8 - current.length);
      return [
        ...current,
        ...incoming.slice(0, room).map((file, index) => ({
          id: "pending-" + Date.now() + "-" + index,
          file,
          pending: true,
          preview: URL.createObjectURL(file),
        })),
      ];
    });

    event.target.value = "";
  };

  const handleGalleryRemove = (entry) => {
    if (!entry?.pending && entry?.id) {
      setRemovedGalleryIds((current) => [...new Set([...current, entry.id])]);
    }
    if (entry?.pending && entry?.preview) URL.revokeObjectURL(entry.preview);
    setGallery((current) => current.filter((candidate) => candidate.id !== entry.id));
  };

  const persistGalleryChanges = async () => {
    const uploads = gallery.filter((entry) => entry.pending && entry.file instanceof File);
    if (!removedGalleryIds.length && !uploads.length) return;

    setGalleryBusy(true);
    try {
      await Promise.all(
        removedGalleryIds.map((fileId) => api.delete("/file/" + encodeURIComponent(fileId)))
      );

      for (let index = 0; index < uploads.length; index += 1) {
        const formData = new FormData();
        formData.append("app_id", String(appId));
        formData.append("entity_id", String(id));
        formData.append("entity_name", "item");
        formData.append("file", uploads[index].file);
        formData.append("group", "gallery");
        formData.append("position", String(index + 1));
        formData.append("is_primary", "0");
        formData.append("visibility", "public");
        await api.post("/file", formData);
      }
    } finally {
      setGalleryBusy(false);
    }
  };

  const onSubmit = async (values) => {
    if (imageUrl.trim() && imageUrlStatus === "error") return;
    const payload = cleanValues(values, editorConfig);

    const response = await updateItem(payload, imageFile, removeImage, imageUrl);
    if (!response) return;

    try {
      await persistGalleryChanges();
      localStorage.removeItem(draftKey);
      const fresh = await fetchItem();
      reset(itemFormValues(fresh));
      setConfigDirty(false);
      setDraftSavedAt(null);
      setDraftRestored(false);
    } catch (error) {
      await Swal.fire({
        icon: "warning",
        title: "Item salvo, galeria pendente",
        text: error?.response?.data?.message || "As informações foram salvas, mas houve um problema ao atualizar a galeria.",
      });
    }
  };

  const duplicateItem = async () => {
    if (!item) return;
    const result = await Swal.fire({
      icon: "question",
      title: "Duplicar este item?",
      text: "A cópia será criada com os mesmos dados e configurações para você ajustar.",
      showCancelButton: true,
      confirmButtonText: "Duplicar",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;

    try {
      const values = cleanValues(watch(), editorConfig);
      const formData = new FormData();
      const clone = {
        ...values,
        app_id: appId,
        entity_name: item.entity_name || "establishment",
        entity_id: item.entity_id,
        name: (values.name || item.name || "Item") + " — cópia",
      };
      delete clone.slug;
      delete clone.tags;
      delete clone.editor_config;

      Object.entries(clone).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (typeof value === "boolean") formData.append(key, value ? "1" : "0");
        else formData.append(key, String(value));
      });
      (values.tags || []).forEach((tag) => formData.append("tags[]", tag));
      formData.append("editor_config", JSON.stringify(editorConfig));

      const { data } = await api.post("/item", formData);
      const created = data?.item ?? data?.data ?? data;
      if (!created?.id) throw new Error("A API não retornou o novo item.");

      const imageUrls = [
        imagePreview && !String(imagePreview).startsWith("data:") ? imagePreview : null,
        ...gallery.filter((entry) => !entry.pending).map((entry) => entry.public_url || entry.preview),
      ].filter(Boolean);

      for (let index = 0; index < imageUrls.length; index += 1) {
        await api.post("/file", {
          app_id: appId,
          entity_id: created.id,
          entity_name: "item",
          external_url: imageUrls[index],
          group: index === 0 ? "primary" : "gallery",
          visibility: "public",
          is_primary: index === 0,
          position: index,
        });
      }

      await Swal.fire({
        icon: "success",
        title: "Item duplicado",
        text: "A cópia foi criada e está pronta para edição.",
        timer: 1500,
        showConfirmButton: false,
      });
      navigate("/item/update/" + created.id);
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Não foi possível duplicar",
        text: error?.response?.data?.message || error?.message || "Tente novamente.",
      });
    }
  };

  const deleteItem = async () => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Excluir este item?",
      text: "Ele será removido do catálogo. Esta ação não deve ser usada apenas para ocultar temporariamente o item.",
      showCancelButton: true,
      confirmButtonText: "Excluir item",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
    });
    if (!result.isConfirmed) return;

    try {
      await api.delete("/item/" + encodeURIComponent(id));
      localStorage.removeItem(draftKey);
      await Swal.fire({
        icon: "success",
        title: "Item excluído",
        timer: 1200,
        showConfirmButton: false,
      });
      navigate("/establishment/my", { replace: true });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Não foi possível excluir",
        text: error?.response?.data?.message || "Tente novamente.",
      });
    }
  };

  const hasPendingChanges =
    isDirty ||
    configDirty ||
    Boolean(imageFile) ||
    removeImage ||
    removedGalleryIds.length > 0 ||
    gallery.some((entry) => entry.pending);

  if (loading) {
    return (
      <ProcessingIndicatorComponent
        messages={["Carregando item…", "Preparando o novo editor…"]}
      />
    );
  }

  return (
    <>
      <GlobalNav />

      {apiError && (
        <Container className="my-4">
          <Alert variant="danger">{apiError}</Alert>
        </Container>
      )}

      {!apiError && item && (
        <ItemUpdateForm
          register={register}
          handleSubmit={handleSubmit}
          watch={watch}
          errors={errors}
          apiErrors={apiErrors}
          item={item}
          imagePreview={imagePreview}
          imageUrl={imageUrl}
          imageUrlStatus={imageUrlStatus}
          editorConfig={editorConfig}
          onEditorConfigChange={updateConfig}
          gallery={gallery}
          onGalleryAdd={handleGalleryAdd}
          onGalleryRemove={handleGalleryRemove}
          draftSavedAt={draftSavedAt}
          draftRestored={draftRestored}
          hasPendingChanges={hasPendingChanges}
          isSubmitting={saving || galleryBusy}
          onSubmit={onSubmit}
          onImageChange={handleImageChange}
          onImageUrlChange={handleImageUrlChange}
          onImageUrlLoad={() => setImageUrlStatus("loaded")}
          onImageUrlError={() => setImageUrlStatus("error")}
          onRemoveImage={handleRemoveImage}
          onPreview={() => item.slug && navigate("/item/" + encodeURIComponent(item.slug))}
          onDuplicate={duplicateItem}
          onCancel={() => navigate(-1)}
          onDelete={deleteItem}
        />
      )}
    </>
  );
}
