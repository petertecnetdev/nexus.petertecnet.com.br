// src/hooks/useItemUpdate.js
import { useState, useCallback } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { apiBaseUrl } from "../config";

function normalizeBoolean(v) {
  if (v === true || v === 1 || v === "1" || v === "true" || v === "on") return "1";
  if (v === false || v === 0 || v === "0" || v === "false" || v === "off") return "0";
  return null;
}

export default function useItemUpdate(id) {
  const [loading, setLoading] = useState(false);
  const [apiErrors, setApiErrors] = useState({});

  const updateItem = useCallback(
    async (values, imageFile, removeImage) => {
      setLoading(true);
      setApiErrors({});

      try {
        const token = localStorage.getItem("token");
        const formData = new FormData();

        Object.entries(values || {}).forEach(([key, value]) => {
          if (value === undefined || value === null || value === "") return;

          if (
            key === "status" ||
            key === "is_featured" ||
            key === "limited_by_user"
          ) {
            const b = normalizeBoolean(value);
            if (b !== null) formData.append(key, b);
            return;
          }

          formData.append(key, value);
        });

        if (removeImage) {
          formData.append("remove_image", "1");
        }

        if (imageFile instanceof File) {
          formData.append("image", imageFile);
        }

        const res = await axios.post(
          `${apiBaseUrl}/item/${id}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        Swal.fire({
          icon: "success",
          title: "Sucesso",
          text: res.data?.message || "Item atualizado com sucesso.",
        });

        return res.data;
      } catch (err) {
        if (err.response?.status === 422) {
          setApiErrors(err.response.data?.errors || {});
          Swal.fire({
            icon: "error",
            title: "Erro de validação",
            text: err.response.data?.error || "Erro de validação.",
          });
          return null;
        }

        Swal.fire({
          icon: "error",
          title: "Erro",
          text: "Erro interno.",
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
