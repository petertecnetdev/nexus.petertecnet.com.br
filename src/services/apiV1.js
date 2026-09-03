import { apiV1BaseUrls } from "../config";
import api from "./api";

export const isApplicationContextUnavailable = (error) =>
  Number(error?.response?.status) === 404 &&
  String(error?.response?.data?.code || "") === "APPLICATION_NOT_AVAILABLE";

const buildUrl = (baseUrl, path) => {
  const normalizedPath = String(path || "").startsWith("/")
    ? String(path || "")
    : `/${String(path || "")}`;
  return `${baseUrl}${normalizedPath}`;
};

export async function getFromApiV1(path, config = {}) {
  let lastError = null;

  for (let index = 0; index < apiV1BaseUrls.length; index += 1) {
    const baseUrl = apiV1BaseUrls[index];
    try {
      const response = await api.get(buildUrl(baseUrl, path), config);
      return { ...response, resolvedApiV1BaseUrl: baseUrl };
    } catch (error) {
      lastError = error;
      const hasNextCandidate = index < apiV1BaseUrls.length - 1;
      if (!hasNextCandidate || !isApplicationContextUnavailable(error)) {
        throw error;
      }
    }
  }

  throw lastError || new Error("Contexto da aplicação indisponível.");
}

export default getFromApiV1;
