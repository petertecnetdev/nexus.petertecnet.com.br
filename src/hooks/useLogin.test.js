import api from "../services/api";
import useLogin from "./useLogin";

jest.mock("../services/api", () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

describe("Nexus authentication flow", () => {
  beforeEach(() => {
    localStorage.clear();
    api.post.mockReset();
    api.get.mockReset();
  });

  test("login does not request or send browser geolocation", async () => {
    const geolocationSpy = jest.fn();
    Object.defineProperty(window.navigator, "geolocation", {
      configurable: true,
      value: { getCurrentPosition: geolocationSpy },
    });

    api.post.mockResolvedValueOnce({ data: { access_token: "token-1" } });
    api.get.mockResolvedValueOnce({
      data: { user: { id: 1, email_verified_at: "2026-01-01T00:00:00Z" } },
    });

    const onSuccess = jest.fn();
    const { login } = useLogin(onSuccess);
    await login(" usuario@example.com ", "Senha123!");

    expect(geolocationSpy).not.toHaveBeenCalled();
    expect(api.post).toHaveBeenCalledWith("/auth/login", {
      username: "usuario@example.com",
      password: "Senha123!",
      app_id: expect.any(Number),
    });
    expect(api.post.mock.calls[0][1]).not.toHaveProperty("latitude");
    expect(api.post.mock.calls[0][1]).not.toHaveProperty("longitude");
    expect(localStorage.getItem("token")).toBe("token-1");
    expect(onSuccess).toHaveBeenCalled();
  });

  test("clears an issued token when account context validation fails", async () => {
    api.post.mockResolvedValueOnce({ data: { token: { access_token: "unsafe-token" } } });
    api.get.mockRejectedValueOnce({ response: { status: 403, data: { message: "Sem acesso" } } });

    const { login } = useLogin(jest.fn());

    await expect(login("user", "Senha123!")).rejects.toThrow("Sem acesso");
    expect(localStorage.getItem("token")).toBeNull();
  });

  test("propagates invalid credential messages from the API", async () => {
    api.post.mockRejectedValueOnce({
      response: { status: 401, data: { error: "Credenciais inválidas." } },
    });

    const { login } = useLogin(jest.fn());
    await expect(login("user", "wrong")).rejects.toThrow("Credenciais inválidas.");
  });

  test("rejects Google login when no credential is returned", async () => {
    const { loginGoogle } = useLogin(jest.fn());
    await expect(loginGoogle(null)).rejects.toThrow("Não recebemos a credencial do Google.");
    expect(api.post).not.toHaveBeenCalled();
  });

  test("validates Google sessions through account context before success", async () => {
    api.post.mockResolvedValueOnce({ data: { access_token: "google-token" } });
    api.get.mockResolvedValueOnce({ data: { user: { id: 8, email: "google@nexus.test" } } });

    const onSuccess = jest.fn();
    const { loginGoogle } = useLogin(onSuccess);
    await loginGoogle("google-id-token");

    expect(api.post).toHaveBeenCalledWith("/auth/google", {
      token_id: "google-id-token",
      app_id: expect.any(Number),
    });
    expect(api.get).toHaveBeenCalledWith("/account/context", {
      params: { app_id: expect.any(Number) },
    });
    expect(onSuccess).toHaveBeenCalled();
  });
});
