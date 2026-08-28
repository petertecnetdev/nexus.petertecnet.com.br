// src/hooks/useEstablishmentCreate.js
import { useState } from "react";
import Swal from "sweetalert2";
import api from "../services/api";

const getApiMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  fallback;

export default function useEstablishmentCreate({ appId, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const createEstablishment = async (formData) => {
    if (!appId) return null;

    setLoading(true);
    setErrors({});

    try {
      formData.set("app_id", String(appId));

      const { data } = await api.post("/establishment", formData);
      const establishment = data?.establishment || null;

      await Swal.fire({
        icon: "success",
        title: "Empresa cadastrada",
        text: data?.message || "Agora você pode adicionar itens e publicar o catálogo.",
      });

      if (onSuccess) onSuccess(establishment);
      return establishment;
    } catch (error) {
      const validationErrors = error?.response?.data?.errors || {};
      setErrors(validationErrors);
      const firstValidationMessage = Object.values(validationErrors).flat().find(Boolean);

      await Swal.fire({
        icon: "error",
        title: error?.response?.status === 422 ? "Revise os dados" : "Erro ao cadastrar empresa",
        text: firstValidationMessage || getApiMessage(error, "Não foi possível cadastrar a empresa."),
      });

      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    createEstablishment,
    loading,
    errors,
  };
}
