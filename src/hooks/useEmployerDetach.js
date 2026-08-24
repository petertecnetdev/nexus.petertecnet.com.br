// src/hooks/useEmployerDetach.js
import { useState, useCallback } from "react";
import api from "../services/api";

export default function useEmployerDetach() {
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const detachEmployer = useCallback(
    async ({ employer_id, establishment_id }) => {
      try {
        setLoading(true);
        setApiError(null);
        setSuccessMessage(null);

        const res = await api.post("/employer/detach", {
          employer_id,
          establishment_id,
        });

        setSuccessMessage(
          res?.data?.message ||
            "Colaborador desvinculado com sucesso."
        );

        return res.data;
      } catch (err) {
        const message =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Erro ao desvincular colaborador.";

        setApiError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    detachEmployer,
    loading,
    apiError,
    successMessage,
  };
}
