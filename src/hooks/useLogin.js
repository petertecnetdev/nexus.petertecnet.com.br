import api from "../services/api";
import { appId } from "../config";

export default function useLogin(onSuccess, redirectTo = "/establishment/my") {
  const setToken = (token) => localStorage.setItem("token", token);
  const clearToken = () => localStorage.removeItem("token");

  const extractToken = (payload) =>
    payload?.token?.access_token ??
    payload?.token?.original?.access_token ??
    payload?.access_token ??
    payload?.token ??
    null;

  const getLocation = () =>
    new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ latitude: null, longitude: null });
        return;
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

  const verifySession = async (token) => {
    setToken(token);

    try {
      const { data } = await api.get("/account/context", {
        params: { app_id: appId },
      });

      if (!data?.user) {
        throw new Error("A API não retornou os dados da conta autenticada.");
      }

      return data;
    } catch (error) {
      clearToken();
      throw error;
    }
  };

  const finalizeLogin = async (token) => {
    const session = await verifySession(token);

    window.dispatchEvent(
      new CustomEvent("authChanged", {
        detail: session,
      })
    );

    if (onSuccess) onSuccess(token, session);
    else window.location.href = redirectTo;

    return session;
  };

  const normalizeLoginError = (error, fallback) => {
    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      error?.message ||
      fallback;

    const normalizedError = new Error(message);
    normalizedError.cause = error;
    throw normalizedError;
  };

  const login = async (username, password) => {
    try {
      const location = await getLocation();
      const { data } = await api.post("/auth/login", {
        username: String(username || "").trim(),
        password,
        app_id: appId,
        ...location,
      });

      const token = extractToken(data);
      if (!token) throw new Error("A API não retornou uma sessão válida.");

      await finalizeLogin(token);
      return token;
    } catch (error) {
      normalizeLoginError(
        error,
        "Não foi possível entrar. Confira seu usuário, e-mail e senha e tente novamente."
      );
    }
  };

  const loginGoogle = async (credential) => {
    try {
      if (!credential) {
        throw new Error("Não recebemos a credencial do Google.");
      }

      const location = await getLocation();
      const { data } = await api.post("/auth/google", {
        token_id: credential,
        app_id: appId,
        ...location,
      });

      const token = extractToken(data);
      if (!token) throw new Error("A API não retornou uma sessão válida.");

      await finalizeLogin(token);
      return token;
    } catch (error) {
      normalizeLoginError(
        error,
        "Não foi possível entrar com o Google. Tente novamente."
      );
    }
  };

  return { login, loginGoogle };
}
