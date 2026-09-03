// src/hooks/useEstablishmentCreate.js
import { useState } from "react";
import Swal from "sweetalert2";
import api from "../services/api";
import { apiV1BaseUrl } from "../config";

const getApiMessage = (error, fallback) => error?.response?.data?.message || error?.response?.data?.error || fallback;

export default function useEstablishmentCreate({ onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const createEstablishment = async (formData) => {
    setLoading(true); setErrors({});
    try {
      // O contexto da aplicação é resolvido pela URL genérica /v1/apps/{application};
      // o frontend não injeta mais app_id na regra de negócio.
      formData.delete("app_id");
      const { data } = await api.post(`${apiV1BaseUrl}/establishments`, formData);
      const establishment = data?.establishment || null;
      await Swal.fire({ icon: "success", title: "Empresa cadastrada", text: data?.message || "Agora você pode adicionar itens e publicar o catálogo." });
      if (onSuccess) onSuccess(establishment);
      return establishment;
    } catch (error) {
      const validationErrors = error?.response?.data?.errors || {}; setErrors(validationErrors);
      const firstValidationMessage = Object.values(validationErrors).flat().find(Boolean);
      await Swal.fire({ icon: "error", title: error?.response?.status === 422 ? "Revise os dados" : "Erro ao cadastrar empresa", text: firstValidationMessage || getApiMessage(error, "Não foi possível cadastrar a empresa.") });
      return null;
    } finally { setLoading(false); }
  };
  return { createEstablishment, loading, errors };
}
