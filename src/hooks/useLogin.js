import api from "../services/api";

export default function useLogin(onSuccess, redirectTo = "/") {
  const setToken = (token) => localStorage.setItem("token", token);

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

  const finalizeLogin = (token) => {
    setToken(token);
    window.dispatchEvent(new Event("authChanged"));

    if (onSuccess) onSuccess(token);
    else window.location.href = redirectTo;
  };

  const normalizeLoginError = (error, fallback) => {
    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      fallback;

    const normalizedError = new Error(message);
    normalizedError.cause = error;
    throw normalizedError;
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
      if (!token) throw new Error("A API não retornou uma sessão válida.");

      finalizeLogin(token);
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
        ...location,
      });

      const token = extractToken(data);
      if (!token) throw new Error("A API não retornou uma sessão válida.");

      finalizeLogin(token);
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
