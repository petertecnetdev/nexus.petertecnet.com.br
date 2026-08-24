// src/hooks/useEstablishmentCreate.js
import { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { apiBaseUrl } from "../config";

const MySwal = withReactContent(Swal);

export default function useEstablishmentCreate({ appId, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const createEstablishment = async (formData) => {
    setLoading(true);
    setErrors({});

    try {
      // 🔒 Garantia absoluta do app_id
      if (!formData.has("app_id")) {
        formData.append("app_id", String(appId));
      }

      const token = localStorage.getItem("token");

      const response = await axios.post(
        `${apiBaseUrl}/establishment`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            // NÃO definir Content-Type manualmente com FormData
          },
        }
      );

      MySwal.fire({
        icon: "success",
        title: "Estabelecimento criado",
        text: response.data?.message || "Operação realizada com sucesso.",
      });

      if (onSuccess) {
        onSuccess(response.data.establishment);
      }

      return response.data.establishment;
    } catch (err) {
      // ❌ ERROS DE VALIDAÇÃO (422)
      if (err.response?.status === 422 && err.response.data?.errors) {
        const apiErrors = err.response.data.errors;
        setErrors(apiErrors);

        const html = Object.entries(apiErrors)
          .map(
            ([field, messages]) => `
              <div style="text-align:left;margin-bottom:6px">
                <strong>${field}</strong>: ${messages.join(", ")}
              </div>
            `
          )
          .join("");

        MySwal.fire({
          icon: "error",
          title: "Erro de validação",
          html,
        });

        return;
      }

      // ❌ ERRO GERAL (500, 401, etc)
      MySwal.fire({
        icon: "error",
        title: "Erro ao criar estabelecimento",
        text:
          err.response?.data?.error ||
          err.response?.data?.message ||
          "Erro inesperado ao processar a solicitação.",
      });

      throw err;
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
