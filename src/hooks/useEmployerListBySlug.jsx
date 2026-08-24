  // src/hooks/useEmployerListBySlug.js
  import { useEffect, useState, useCallback } from "react";
  import axios from "axios";
  import Swal from "sweetalert2";
  import { apiBaseUrl } from "../config";

  export default function useEmployerListBySlug(slug) {
    const [establishment, setEstablishment] = useState(null);
    const [employers, setEmployers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState(null);

    useEffect(() => {
      if (!slug) {
        setApiError("Slug inválido.");
        setLoading(false);
        return;
      }

      let mounted = true;

      (async () => {
        try {
          setLoading(true);
          setApiError(null);

          const { data } = await axios.get(
            `${apiBaseUrl}/employer/list-by-entity/${slug}`
          );

          if (!mounted) return;

          setEstablishment(data.establishment ?? null);
          setEmployers(Array.isArray(data.employers) ? data.employers : []);
        } catch (error) {
          if (!mounted) return;

          setApiError(
            error?.response?.data?.error ||
              error?.response?.data?.message ||
              "Erro ao carregar colaboradores."
          );
        } finally {
          if (mounted) setLoading(false);
        }
      })();

      return () => {
        mounted = false;
      };
    }, [slug]);
    const removeEmployer = async (employerId) => {
      if (!establishment) return;

      const token = localStorage.getItem("token");

      const confirm = await Swal.fire({
        title: "Remover colaborador",
        text: "Tem certeza que deseja remover este colaborador do estabelecimento?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sim, remover",
        cancelButtonText: "Cancelar",
        reverseButtons: true,
      });

      if (!confirm.isConfirmed) return;

      try {
        await axios.post(
          `${apiBaseUrl}/employer/detach`,
          {
            employer_id: employerId,
            establishment_id: establishment.id,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setApiError(null); // 🔥 ESSENCIAL
        setEmployers((prev) => prev.filter((e) => e.id !== employerId));

        await Swal.fire({
          icon: "success",
          title: "Removido",
          text: "Colaborador removido com sucesso.",
        });
      } catch (error) {
        await Swal.fire({
          icon: "error",
          title: "Erro",
          text:
            error?.response?.data?.error ||
            error?.response?.data?.message ||
            "Erro ao remover colaborador.",
        });
      }
    };

    return {
      establishment,
      employers,
      loading,
      apiError,
      removeEmployer,
    };
  }
