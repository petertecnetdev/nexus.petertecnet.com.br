// src/hooks/useItemCreate.js
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { appId } from "../config";
import api from "../services/api";

const getApiMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  fallback;

export default function useItemCreate(
  navigate,
  reset,
  setValue,
  establishmentFromState = null
) {
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
    };

    const loadEstablishment = async () => {
      try {
        if (establishmentFromState?.id) {
          setupFromEstablishment(establishmentFromState);
          return;
        }

        if (!slug) throw new Error("Estabelecimento não identificado.");

        const { data } = await api.get(
          `/establishment/view/${encodeURIComponent(slug)}`,
          {
            params: { app_id: appId },
            signal: controller.signal,
          }
        );

        if (!controller.signal.aborted) {
          setupFromEstablishment(data?.establishment);
        }
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
      const formData = new FormData();
      const payload = {
        ...data,
        app_id: appId,
        entity_id: establishment.id,
        entity_name: "establishment",
      };

      Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          formData.append(key, value);
        }
      });

      const { data: response } = await api.post("/item", formData);

      await Swal.fire({
        icon: "success",
        title: "Item criado",
        text: response?.message || "O item foi adicionado ao catálogo.",
      });

      reset();
      if (establishment.slug) {
        navigate(`/establishment/item/${establishment.slug}`);
      } else {
        navigate("/establishment/my");
      }
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

  return {
    loading,
    establishment,
    submitCreate,
  };
}
