// src/hooks/useEmployerCreate.js
import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { apiBaseUrl } from "../config";

export default function useEmployerCreate(slug) {
  const [establishment, setEstablishment] = useState(null);
  const [users, setUsers] = useState([]);
  const [role, setRole] = useState("colaborador");
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [errors, setErrors] = useState({});

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!slug) return;

    let mounted = true;

    (async () => {
      try {
        const { data } = await axios.get(
          `${apiBaseUrl}/establishment/view/${slug}`
        );

        if (!mounted) return;
        setEstablishment(data.establishment);
      } catch (error) {
        await Swal.fire({
          icon: "error",
          title: "Erro",
          text:
            error?.response?.data?.error ||
            error?.response?.data?.message ||
            "Estabelecimento não encontrado.",
        });
      }
    })();

    return () => {
      mounted = false;
    };
  }, [slug]);

  const searchUsers = async (payload) => {
    if (!payload || Object.keys(payload).length === 0) {
      await Swal.fire({
        icon: "warning",
        title: "Atenção",
        text: "Informe um valor para buscar o usuário.",
      });
      return;
    }

    try {
      setSearching(true);
      setUsers([]);

      const { data } = await axios.post(
        `${apiBaseUrl}/user/find-for-employer`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setUsers(data.users || []);
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Erro",
        text:
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Erro ao buscar usuários.",
      });
    } finally {
      setSearching(false);
    }
  };

  const createEmployer = async (user) => {
    if (!establishment || !user?.id) return;

    try {
      setLoading(true);
      setErrors({});

      const { data } = await axios.post(
        `${apiBaseUrl}/employer/store`,
        {
          user_id: user.id,
          establishment_id: establishment.id,
          role,
          permissions,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      await Swal.fire({
        icon: "success",
        title: "Sucesso",
        text: data?.message,
      });

      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? { ...u, is_employer: true, employer: data.employer }
            : u
        )
      );

      return data;
    } catch (error) {
      setErrors(error?.response?.data?.errors || {});

      await Swal.fire({
        icon: "error",
        title: "Erro",
        text:
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Erro ao associar colaborador.",
      });

      throw error;
    } finally {
      setLoading(false);
    }
  };

  const detachEmployer = async (employerId) => {
    if (!establishment) return;

    try {
      setLoading(true);

      const { data } = await axios.post(
        `${apiBaseUrl}/employer/detach`,
        {
          employer_id: employerId,
          establishment_id: establishment.id,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      await Swal.fire({
        icon: "success",
        title: "Sucesso",
        text: data?.message,
      });

      setUsers((prev) =>
        prev.map((u) =>
          u.employer?.id === employerId
            ? { ...u, is_employer: false, employer: null }
            : u
        )
      );

      return data;
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Erro",
        text:
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Erro ao remover associação.",
      });

      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    establishment,
    users,
    role,
    permissions,
    loading,
    searching,
    errors,
    setRole,
    setPermissions,
    searchUsers,
    createEmployer,
    detachEmployer,
  };
}
