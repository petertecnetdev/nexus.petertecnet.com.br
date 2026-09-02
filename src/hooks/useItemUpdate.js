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
        const payload = { ...values, app_id: appId };

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

          await Promise.all(
            imageFiles.map((file) => api.delete(`/file/${encodeURIComponent(file.id)}`))
          );

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

        await Swal.fire({
          icon: "success",
          title: "Item atualizado",
          text: data?.message || "As alterações foram salvas.",
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
