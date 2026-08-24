// src/hooks/useLogin.js
import Swal from "sweetalert2";
import api from "../services/api";


export default function useLogin(onSuccess, redirectTo = "/") {
  const setToken = (token) => localStorage.setItem("token", token);

  const extractToken = (p) =>
    p?.token?.access_token ??
    p?.token?.original?.access_token ??
    p?.access_token ??
    p?.token ??
    null;

  const showError = (msg) =>
    Swal.fire({
      title: "Erro",
      text: msg,
      icon: "error",
      confirmButtonText: "Ok",
      customClass: {
        popup: "custom-swal",
        title: "custom-swal-title",
        content: "custom-swal-text",
      },
    });

  const getLocation = () =>
    new Promise((resolve) => {
      if (!navigator.geolocation) {
        return resolve({ latitude: null, longitude: null });
      }

      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }),
        () => resolve({ latitude: null, longitude: null }),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    });

  const finalizeLogin = (token) => {
    setToken(token);
    window.dispatchEvent(new Event("authChanged"));

    if (onSuccess) onSuccess(token);
    else window.location.href = redirectTo;
  };

  const login = async (username, password) => {
    try {
      const location = await getLocation();

      const { data } = await api.post("/auth/login", {
        username,
        password,
        ...location,
      });

      const token = extractToken(data);
      if (!token) throw new Error("Token não recebido");

      finalizeLogin(token);
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Falha no login.";
      showError(msg);
    }
  };

  const loginGoogle = async (credential) => {
    try {
      const location = await getLocation();

      const { data } = await api.post("/auth/google", {
        token_id: credential,
        ...location,
      });

      const token = extractToken(data);
      if (!token) throw new Error("Token Google não recebido");

      finalizeLogin(token);
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Falha no login com Google.";
      showError(msg);
    }
  };

  return {
    login,
    loginGoogle,
  };
}
