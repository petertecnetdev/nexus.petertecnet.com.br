// src/hooks/useEmployerHome.js
import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const getFileUrlByType = (files, type) =>
  Array.isArray(files) ? files.find((f) => f.type === type)?.public_url ?? null : null;

export default function useEmployerHome(apiBaseUrl, appId) {
  const [employers, setEmployers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const city = localStorage.getItem("selectedCity");
  const uf = localStorage.getItem("selectedUF");

  useEffect(() => {
    let active = true;

    async function loadEmployers() {
      setIsLoading(true);
      setError(null);

      try {
        const query =
          city && uf
            ? `?city=${encodeURIComponent(city)}&uf=${encodeURIComponent(uf)}`
            : "";

        const res = await axios.get(`${apiBaseUrl}/employer/home/${appId}${query}`);

        if (!active) return;

        const mappedEmployers = (res.data?.employers || []).map((emp) => {
          const firstName = emp.user?.first_name || "";
          const lastName = emp.user?.last_name || "";
          const fullName = `${firstName} ${lastName}`.trim();

          return {
            ...emp,
            type: "employer",
            name: fullName || firstName || "Colaborador",
            first_name: firstName,
            last_name: lastName,
            avatar: getFileUrlByType(emp.user?.files, "avatar"),
            image: getFileUrlByType(emp.user?.files, "avatar"),
            user: emp.user,
          };
        });

        setEmployers(mappedEmployers);
      } catch (err) {
        if (!active) return;

        const msg =
          typeof err?.response?.data?.message === "string"
            ? err.response.data.message
            : "Erro ao carregar os profissionais.";

        setError(msg);

        Swal.fire({
          icon: "error",
          title: "Erro",
          text: msg,
        });
      } finally {
        if (active) setIsLoading(false);
      }
    }

    if (appId) loadEmployers();
    else {
      setError("app_id não informado.");
      setIsLoading(false);
    }

    return () => {
      active = false;
    };
  }, [apiBaseUrl, appId, city, uf]);

  return { employers, isLoading, error };
}
