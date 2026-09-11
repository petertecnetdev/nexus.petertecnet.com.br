// src/hooks/useItemUpdate.js
import { useCallback, useState } from "react";
import Swal from "sweetalert2";
import { appId } from "../config";
import api from "../services/api";

function normalizeBoolean(value) {
  if (value === true || value === 1 || value === "1" || value === "true" || value === "on") return "1";
  if (value === false || value === 0 || value === "0" || value === "false" || value === "off") return "0";
  return null;
}

const getApiMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  fallback;

function appendValue(formData, key, value) {
  if (value === undefined) return;

  if (key === "editor_config") {
    formData.append(key, JSON.stringify(value || {}));
    return;
  }

  if (key === "tags") {
    const tags = Array.isArray(value) ? value : [];
    if (!tags.length) {
      formData.append("tags", "");
      return;
    }
    tags.forEach((tag) => formData.append("tags[]", tag));
    return;
  }

  if (key === "status" || key === "is_featured" || key === "limited_by_user") {
    const normalized = normalizeBoolean(value);
    if (normalized !== null) formData.append(key, normalized);
    return;
  }

  formData.append(key, value === null ? "" : String(value));
}

export default function useItemUpdate(id) {
  const [loading, setLoading] = useState(false);
  const [apiErrors, setApiErrors] = useState({});

  const updateItem = useCallback(
    async (values, imageFile, removeImage, imageUrl = "", options = {}) => {
      if (!id) return null;

      const { silent = false } = options;
      setLoading(true);
      setApiErrors({});

      try {
        const formData = new FormData();
        const payload = { ...values, app_id: appId };

        Object.entries(payload).forEach(([key, value]) => appendValue(formData, key, value));

        if (removeImage) formData.append("remove_image", "1");
        if (imageFile instanceof File) formData.append("image", imageFile);

        const { data } = await api.post("/item/" + encodeURIComponent(id), formData);
        const trimmedImageUrl = imageUrl.trim();

        if (trimmedImageUrl && !(imageFile instanceof File)) {
          const currentFiles = Array.isArray(data?.item?.files) ? data.item.files : [];
          const primaryFiles = currentFiles.filter(
            (file) => file.type === "image" && file.id && (file.is_primary || file.group === "primary")
          );
          const fallbackPrimary = primaryFiles.length
            ? primaryFiles
            : currentFiles.filter((file) => file.type === "image" && file.id).slice(0, 1);

          await Promise.all(
            fallbackPrimary.map((file) => api.delete("/file/" + encodeURIComponent(file.id)))
          );

          await api.post("/file", {
            app_id: appId,
            entity_id: Number(id),
            entity_name: "item",
            external_url: trimmedImageUrl,
            group: "primary",
            visibility: "public",
            is_primary: true,
            position: 0,
          });
        }

        if (!silent) {
          await Swal.fire({
            icon: "success",
            title: "Item atualizado",
            text: data?.message || "As alterações foram salvas.",
            timer: 1600,
            showConfirmButton: false,
          });
        }

        return data;
      } catch (error) {
        const validationErrors = error?.response?.data?.errors || {};
        setApiErrors(validationErrors);
        const firstValidationMessage = Object.values(validationErrors).flat().find(Boolean);

        if (!silent) {
          await Swal.fire({
            icon: "error",
            title: error?.response?.status === 422 ? "Revise os dados" : "Erro ao atualizar item",
            text: firstValidationMessage || getApiMessage(error, "Não foi possível atualizar o item."),
          });
        }

        return null;
      } finally {
        setLoading(false);
      }
    },
    [id]
  );

  return { updateItem, loading, apiErrors };
}
